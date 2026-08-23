/**
 * Deterministic mock-interview answer evaluator.
 *
 * The numeric score is computed here and nowhere else — no randomness, no
 * model call, no browser-side arithmetic. The same answer always produces the
 * same score, and every point of that score can be traced to a named key point
 * the candidate did or did not cover.
 *
 * Claude is optional garnish only: when ANTHROPIC_API_KEY is configured the
 * controller may ask for richer qualitative coaching, but that text can only
 * ever be appended to the `tips` list. It never touches `score`.
 */

/** Words that carry no discriminating signal when matching a key point. */
const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "that",
  "this", "have", "has", "had", "was", "were", "will", "can", "should",
  "would", "could", "its", "it's", "their", "them", "they", "from", "into",
  "when", "what", "which", "while", "were", "been", "being", "than", "then",
  "there", "here", "how", "why", "who", "whom", "each", "any", "all", "some",
  "such", "own", "same", "too", "very", "one", "two", "get", "got", "use",
  "used", "using", "also", "about", "over", "under", "between", "because",
  "does", "did", "doing", "done", "make", "makes", "made", "may", "might",
  "must", "need", "needs", "want", "wants", "like", "just", "only", "more",
  "most", "other", "others", "our", "out", "off", "onto", "upon", "via",
]);

/**
 * Lowercase, replace every non-alphanumeric character with a space, and
 * collapse runs of whitespace. Applied identically to both sides of every
 * comparison so punctuation and casing can never affect a score.
 */
export function normalise(text) {
  if (typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every plausible singular form of a term, including the term itself.
 *
 * English plurals are ambiguous without a dictionary — "classes" is class+es
 * while "promises" is promise+s — so instead of picking one stem we generate
 * all candidates and treat two terms as equal when their candidate sets
 * intersect. "callbacks"/"callback", "queries"/"query", "boxes"/"box" and
 * "promises"/"promise" all match; unrelated words still do not.
 */
function stemVariants(term) {
  const out = new Set([term]);
  if (term.length > 4 && term.endsWith("ies")) out.add(`${term.slice(0, -3)}y`);
  if (term.length > 4 && term.endsWith("es")) out.add(term.slice(0, -2));
  if (term.length > 3 && term.endsWith("s") && !term.endsWith("ss")) {
    out.add(term.slice(0, -1));
  }
  return out;
}

function tokenise(text) {
  const normalised = normalise(text);
  return normalised ? normalised.split(" ") : [];
}

/**
 * The terms of a key point that actually have to show up in the answer:
 * stopwords dropped, anything shorter than 3 characters dropped.
 *
 * If a key point is made entirely of stopwords or short tokens ("CI CD", "AB
 * testing"), fall back to its raw tokens rather than treating it as
 * unmatchable — an empty term list would otherwise score it automatically.
 */
export function significantTerms(keyPoint) {
  const tokens = tokenise(keyPoint);
  const significant = tokens.filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t)
  );
  const chosen = significant.length > 0 ? significant : tokens;
  return [...new Set(chosen)];
}

/**
 * How many of a key point's terms must appear before it counts as covered.
 *
 * Never fewer than two terms, so a single incidental word ("system" appearing
 * in an unrelated sentence) can never score a multi-term key point. At least
 * half the terms beyond that, and capped at 3 so long, wordy key points stay
 * reachable for a genuinely good answer.
 *
 *   1 term  -> 1     2 terms -> 2     3 terms -> 2
 *   4 terms -> 2     5 terms -> 3     8 terms -> 3
 */
function requiredMatches(termCount) {
  if (termCount <= 1) return termCount;
  return Math.min(Math.max(2, Math.ceil(termCount / 2)), 3);
}

/**
 * Length adequacy multiplier, 0.70 – 1.00.
 *
 * Prevents a two-word answer that happens to contain the right nouns from
 * scoring 100. A full-length answer is unaffected (multiplier 1.0).
 */
function lengthFactor(responseWordCount, keyPointCount) {
  const expected = Math.max(12, keyPointCount * 6);
  const adequacy = Math.min(1, responseWordCount / expected);
  return 0.7 + 0.3 * adequacy;
}

function joinPoints(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return points[0];
  if (points.length === 2) return `${points[0]} and ${points[1]}`;
  return `${points.slice(0, -1).join(", ")} and ${points[points.length - 1]}`;
}

/**
 * Score one answer against its key points.
 *
 * @param {string} response      The candidate's answer.
 * @param {string[]} keyPoints   The recruiter's key points for the question.
 * @param {string} [modelAnswer] The recruiter's model answer (used for tips only).
 * @returns {{score:number, matchedKeyPoints:string[], missingKeyPoints:string[], feedback:string, tips:string[]}}
 */
export function evaluateAnswer(response, keyPoints, modelAnswer = "") {
  const points = (Array.isArray(keyPoints) ? keyPoints : [])
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => p.trim());

  const responseTokens = tokenise(response);
  const responseWordCount = responseTokens.length;

  // Every singular/plural variant of every word the candidate wrote. A key
  // point's term counts as present when any of *its* variants lands in here.
  const responseTermSet = new Set();
  for (const token of responseTokens) {
    for (const variant of stemVariants(token)) responseTermSet.add(variant);
  }
  const hasTerm = (term) =>
    [...stemVariants(term)].some((variant) => responseTermSet.has(variant));

  // No key points to grade against — be explicit rather than inventing a score.
  if (points.length === 0) {
    return {
      score: 0,
      matchedKeyPoints: [],
      missingKeyPoints: [],
      feedback:
        "This question has no key points recorded, so it could not be scored automatically.",
      tips: [
        "Ask the recruiter who published this question to add key points so it can be graded.",
      ],
    };
  }

  if (responseWordCount === 0) {
    return {
      score: 0,
      matchedKeyPoints: [],
      missingKeyPoints: points,
      feedback: `You left this question unanswered, so none of the ${points.length} key point${
        points.length === 1 ? "" : "s"
      } were covered: ${joinPoints(points)}.`,
      tips: [
        "Answer every question, even briefly — a partial answer always scores above a blank one.",
        `Start by naming ${points[0]}.`,
      ],
    };
  }

  const matchedKeyPoints = [];
  const missingKeyPoints = [];

  for (const point of points) {
    const terms = significantTerms(point);
    if (terms.length === 0) {
      missingKeyPoints.push(point);
      continue;
    }
    const hits = terms.filter(hasTerm).length;
    if (hits >= requiredMatches(terms.length)) {
      matchedKeyPoints.push(point);
    } else {
      missingKeyPoints.push(point);
    }
  }

  const coverage = matchedKeyPoints.length / points.length;
  const factor = lengthFactor(responseWordCount, points.length);
  const score = Math.max(0, Math.min(100, Math.round(coverage * 100 * factor)));

  // ── Feedback: always names the real key points, never generic filler ──────
  const parts = [];
  parts.push(
    `You covered ${matchedKeyPoints.length} of ${points.length} key point${
      points.length === 1 ? "" : "s"
    }.`
  );

  if (matchedKeyPoints.length > 0) {
    parts.push(`Well covered: ${joinPoints(matchedKeyPoints)}.`);
  }
  if (missingKeyPoints.length > 0) {
    parts.push(`Not mentioned: ${joinPoints(missingKeyPoints)}.`);
  }
  if (factor < 0.95) {
    parts.push(
      `Your answer ran to ${responseWordCount} word${
        responseWordCount === 1 ? "" : "s"
      }, which is short for a question with ${points.length} key point${
        points.length === 1 ? "" : "s"
      } — depth was scored down accordingly.`
    );
  }

  // ── Tips: concrete, derived from what was actually missed ────────────────
  const tips = [];
  for (const point of missingKeyPoints.slice(0, 3)) {
    tips.push(`Work "${point}" into your answer and say why it matters.`);
  }
  if (factor < 0.95) {
    const expected = Math.max(12, points.length * 6);
    tips.push(
      `Aim for at least ${expected} words so each key point gets a sentence of its own.`
    );
  }
  if (missingKeyPoints.length === 0 && factor >= 0.95) {
    tips.push(
      "Full coverage — next, tighten the delivery: lead with the answer, then the reasoning."
    );
  }
  if (modelAnswer && typeof modelAnswer === "string" && modelAnswer.trim()) {
    tips.push("Compare your answer with the model answer shown below.");
  }

  return { score, matchedKeyPoints, missingKeyPoints, feedback: parts.join(" "), tips };
}

/**
 * Average the per-question scores into a single 0-100 attempt score.
 *
 * @param {Array<{score:number}>} answers
 * @returns {number}
 */
export function evaluateAttempt(answers) {
  const list = Array.isArray(answers) ? answers : [];
  const scores = list
    .map((a) => Number(a?.score))
    .filter((n) => Number.isFinite(n));

  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, n) => sum + n, 0);
  return Math.max(0, Math.min(100, Math.round(total / scores.length)));
}

// ─── Optional Claude enrichment ──────────────────────────────────────────────
// Everything below is additive. If the key is absent, the SDK is missing, or
// the call fails for any reason, the caller keeps the deterministic result.

export function isAiFeedbackEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Ask Claude for one extra coaching line per question.
 *
 * The numeric score is passed in as context and is never re-derived — Claude
 * only writes prose. Returns an array aligned with `items`, each entry a
 * string or null, or null overall when AI feedback is unavailable.
 *
 * @param {Array<{questionText:string, response:string, score:number, missingKeyPoints:string[]}>} items
 * @returns {Promise<(string|null)[]|null>}
 */
export async function generateCoachingNotes(items) {
  if (!isAiFeedbackEnabled()) return null;
  if (!Array.isArray(items) || items.length === 0) return null;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const payload = items.map((item, index) => ({
      index,
      question: item.questionText,
      answer: item.response,
      score: item.score,
      missing: item.missingKeyPoints,
    }));

    const prompt = `You are an interview coach reviewing a candidate's mock interview.

For each item below, write ONE sentence of specific, actionable coaching. Do not
restate the score, do not invent a new score, and do not use generic filler such
as "good job" or "keep practising". Refer to the candidate's actual words and the
key points they missed.

Items:
${JSON.stringify(payload, null, 2)}

Return ONLY a JSON array of objects shaped {"index": number, "note": string},
one entry per item, no other text.`;

    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message?.content?.find?.((b) => b.type === "text")?.text ?? "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return null;

    const notes = new Array(items.length).fill(null);
    for (const entry of parsed) {
      const i = Number(entry?.index);
      if (Number.isInteger(i) && i >= 0 && i < notes.length) {
        const note = typeof entry?.note === "string" ? entry.note.trim() : "";
        if (note) notes[i] = note;
      }
    }
    return notes;
  } catch (error) {
    // Never let optional enrichment break a submission.
    console.warn("[interviewEvaluator] Claude coaching unavailable:", error?.message);
    return null;
  }
}

export default {
  normalise,
  significantTerms,
  evaluateAnswer,
  evaluateAttempt,
  isAiFeedbackEnabled,
  generateCoachingNotes,
};
