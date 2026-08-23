/**
 * ATS readiness scoring, computed from the candidate's actual parsed resume.
 *
 * The backend exposes no ATS endpoint, so rather than display a constant this
 * derives two explainable sub-scores from real resume content:
 *
 *   Formatting — does the resume carry the sections an ATS parser expects,
 *                populated well enough to be extracted (contact details,
 *                summary, dated experience with descriptions, education)?
 *   Keywords   — how much of the candidate's skill vocabulary overlaps the
 *                requirements of the roles they are actually targeting?
 *
 * Every input is real candidate data. When there is no resume the result is
 * null, and the UI shows an empty state rather than a fabricated number.
 */

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === "string" ? v.trim() : "");

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, "")
    .trim();

/** True when the resume has any content worth scoring. */
export function hasResumeContent(parsed) {
  if (!parsed) return false;
  return (
    arr(parsed.skills).length > 0 ||
    arr(parsed.experience).length > 0 ||
    arr(parsed.education).length > 0 ||
    arr(parsed.projects).length > 0 ||
    Boolean(str(parsed.summary))
  );
}

/**
 * Structural completeness — the things that make a resume machine-readable.
 * Each check is worth a share of 100.
 */
export function formattingScore(parsed) {
  if (!parsed) return 0;

  const contact = parsed.contact || {};
  const experience = arr(parsed.experience);
  const education = arr(parsed.education);
  const skills = arr(parsed.skills);

  const checks = [
    // Contact block — an ATS cannot route a resume it cannot attribute.
    { pass: Boolean(str(contact.email)), weight: 12 },
    { pass: Boolean(str(contact.phone)), weight: 8 },
    { pass: Boolean(str(contact.location)), weight: 5 },
    { pass: Boolean(str(contact.linkedin)), weight: 5 },

    // A summary gives the parser a headline to index.
    { pass: str(parsed.summary).length >= 40, weight: 10 },

    // Experience: present, dated, and described.
    { pass: experience.length > 0, weight: 12 },
    {
      pass: experience.length > 0 && experience.every((e) => str(e.duration)),
      weight: 10,
    },
    {
      pass:
        experience.length > 0 &&
        experience.every((e) => str(e.description).length >= 30),
      weight: 10,
    },
    { pass: experience.length > 0 && experience.every((e) => str(e.role)), weight: 6 },

    // Education, with a graduation year.
    { pass: education.length > 0, weight: 8 },
    { pass: education.length > 0 && education.every((e) => str(e.year)), weight: 4 },

    // A skills section dense enough to match against.
    { pass: skills.length >= 5, weight: 6 },
    { pass: skills.length >= 10, weight: 4 },
  ];

  const earned = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0);
  return clamp(earned);
}

/**
 * Keyword alignment — resume vocabulary against the requirements of the roles
 * the candidate is targeting.
 *
 * @param {object} parsed        parsed resume
 * @param {string[]} targetTerms requirement terms drawn from real job data
 */
export function keywordScore(parsed, targetTerms = []) {
  const terms = [...new Set(arr(targetTerms).map(norm).filter(Boolean))];
  if (!terms.length) return null; // nothing to measure against — say so

  const haystack = new Set(
    [
      ...arr(parsed?.skills),
      ...arr(parsed?.experience).flatMap((e) => [e.role, e.description]),
      ...arr(parsed?.projects).flatMap((p) => [p.name, p.description, ...arr(p.tech)]),
      parsed?.summary,
    ]
      .map(norm)
      .filter(Boolean)
  );

  const blob = [...haystack].join(" ");
  const hits = terms.filter((t) => blob.includes(t));

  return { score: clamp((hits.length / terms.length) * 100), hits, terms };
}

/**
 * Combined ATS readiness.
 * @returns {{overall:number, formatting:number, keywords:number|null,
 *            matchedKeywords:string[], totalKeywords:number}|null}
 */
export function computeAtsScore(parsed, targetTerms = []) {
  if (!hasResumeContent(parsed)) return null;

  const formatting = formattingScore(parsed);
  const kw = keywordScore(parsed, targetTerms);

  // With nothing to match against, formatting alone is the honest answer.
  const overall = kw === null ? formatting : clamp(formatting * 0.6 + kw.score * 0.4);

  return {
    overall,
    formatting,
    keywords: kw === null ? null : kw.score,
    matchedKeywords: kw === null ? [] : kw.hits,
    totalKeywords: kw === null ? 0 : kw.terms.length,
  };
}

/** Collect requirement terms from real job records the candidate has seen. */
export function termsFromJobs(jobs = []) {
  return arr(jobs).flatMap((j) => {
    const job = j?.job || j;
    return [...arr(job?.techStack), ...arr(job?.jobCriteria)];
  });
}
