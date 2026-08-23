/**
 * Derivations for the "AI Career Action Plan" and the mock-interview widget.
 *
 * Same contract as dashboardData.js: nothing here is invented. Every action
 * item exists only because a real gap was found in the candidate's own
 * records, so an account with nothing to fix produces an empty plan rather
 * than filler advice.
 */

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === "string" ? v.trim() : "");

/** At most this many skill items, so the plan stays actionable. */
export const SKILL_ITEM_CAP = 4;

/* ── Mock interview options ──────────────────────────────────────────────
 * GET /api/mock-interview/options returns companies with nested roles. The
 * widget renders one card per company+role pair, so they are flattened here.
 *
 * NOTE: that endpoint aggregates only `companyName`, `targetRole` and a
 * question count — it exposes no difficulty for a pairing. There is therefore
 * no difficulty badge on the cards; inventing one would be a fabricated
 * attribute.
 */
export function flattenInterviewOptions(companies = []) {
  const pairs = [];

  for (const company of arr(companies)) {
    const companyName = str(company?.companyName);
    if (!companyName) continue;

    for (const role of arr(company?.roles)) {
      const targetRole = str(role?.targetRole);
      if (!targetRole) continue;

      const count = Number(role?.questionCount);
      pairs.push({
        id: `${companyName}::${targetRole}`.toLowerCase(),
        companyName,
        targetRole,
        questionCount: Number.isFinite(count) && count > 0 ? count : null,
      });
    }
  }

  return pairs;
}

/* ── Career action plan ──────────────────────────────────────────────── */

const SEVERITY_WHY = {
  high: "Flagged as a high-severity gap on the roles you've analysed.",
  medium: "Flagged as a medium-severity gap on the roles you've analysed.",
  low: "Flagged as a low-severity gap on the roles you've analysed.",
};

const PROFILE_ITEM = {
  leetcode: {
    label: "Add your LeetCode profile",
    why: "A visible problem-solving record backs up the coding skills you list.",
  },
  github: {
    label: "Add your GitHub profile",
    why: "Public repositories are the evidence recruiters look for behind a skill.",
  },
  linkedin: {
    label: "Add your LinkedIn profile",
    why: "Most recruiters open LinkedIn before they open a resume.",
  },
};

/**
 * Build the plan from data the dashboard has already fetched.
 *
 * @param {object}  input
 * @param {Array}   input.skillGaps    output of aggregateSkillGaps (pre-sorted
 *                                     high → medium → low)
 * @param {Array}   input.profiles     output of normalizeIntegrations
 * @param {object}  input.parsedResume /api/resume/parsed payload, or null
 * @param {boolean} input.hasResume    true when there is a resume worth scoring
 * @param {number}  input.examCount    assessment attempts on record
 * @returns {{id:string, label:string, why:string}[]} empty when nothing applies
 */
export function buildCareerPlan({
  skillGaps = [],
  profiles = [],
  parsedResume = null,
  hasResume = false,
  examCount = 0,
} = {}) {
  const items = [];

  // 1. Top missing skills — already ordered worst-first by aggregateSkillGaps.
  for (const gap of arr(skillGaps).slice(0, SKILL_ITEM_CAP)) {
    const name = str(gap?.name);
    if (!name) continue;
    items.push({
      id: `skill:${name.toLowerCase()}`,
      label: `Practise ${name}`,
      why: SEVERITY_WHY[gap?.severity] || SEVERITY_WHY.medium,
    });
  }

  // 2. Platforms that are genuinely not connected on this account.
  for (const profile of arr(profiles)) {
    const copy = PROFILE_ITEM[profile?.key];
    if (!copy || profile?.connected) continue;
    items.push({ id: `profile:${profile.key}`, ...copy });
  }

  // 3. Resume completeness.
  if (!hasResume) {
    items.push({
      id: "resume:upload",
      label: "Upload a resume",
      why: "Your ATS score, keyword coverage and skill gaps are all read from a parsed resume.",
    });
  } else {
    if (!str(parsedResume?.summary)) {
      items.push({
        id: "resume:summary",
        label: "Add a professional summary",
        why: "An ATS indexes the summary first — without one your resume opens with no headline.",
      });
    }
    if (arr(parsedResume?.projects).length === 0) {
      items.push({
        id: "resume:projects",
        label: "Add project details",
        why: "Projects are where the evidence for the skills you list actually lives.",
      });
    }
  }

  // 4. No assessment history yet.
  if (!(Number(examCount) > 0)) {
    items.push({
      id: "interview:first",
      label: "Take a mock interview",
      why: "You have no assessment history yet — one attempt gives you a scored baseline.",
    });
  }

  return items;
}

/* ── Plan progress persistence ───────────────────────────────────────────
 * Ticks are a personal checklist, not a candidate statistic: they live in
 * localStorage under a per-user key and never reach the API or any score.
 * Every access is guarded — Safari private mode and "block site data" make
 * localStorage throw rather than return null.
 */

export const planStorageKey = (userId) =>
  `jobportal:careerPlan:${str(userId) || "anonymous"}`;

/** @returns {string[]} completed item ids, or [] when storage is unreadable. */
export function readCompletedIds(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return arr(parsed).filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

/** Best-effort persist. A throw here must never break the widget. */
export function writeCompletedIds(key, ids) {
  try {
    window.localStorage.setItem(key, JSON.stringify(arr(ids)));
  } catch {
    // Storage disabled or full — the ticks simply stay for this session.
  }
}
