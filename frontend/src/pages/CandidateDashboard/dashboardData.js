/**
 * Pure derivations for the candidate dashboard.
 *
 * Nothing in here invents a value. Every function either returns something
 * computed from an API payload or returns `null` / an empty array so the UI
 * can render an honest empty state instead of a placeholder number.
 */

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

/* ── Severity ────────────────────────────────────────────────────────────
 * The backend speaks two vocabularies for the same idea:
 *   interviewReport.skillGaps[].severity  → low | medium | high
 *   skillGapAnalyzer missingSkills[].difficulty → easy | medium | hard
 * Both collapse onto the three levels the UI renders.
 */
export const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

const SEVERITY_ALIASES = {
  high: "high",
  hard: "high",
  critical: "high",
  severe: "high",
  medium: "medium",
  moderate: "medium",
  normal: "medium",
  low: "low",
  easy: "low",
  minor: "low",
};

/** Unknown / absent severity defaults to "medium" rather than guessing. */
export const normalizeSeverity = (value) =>
  SEVERITY_ALIASES[String(value ?? "").toLowerCase().trim()] || "medium";

/* ── Skill gaps ──────────────────────────────────────────────────────── */

/**
 * Every place a job record is known to carry missing skills. Each may be a
 * string[] (jobMatch.matchDetails.skillMatch) or an object[] carrying
 * `name`/`difficulty` (skillGapAnalyzer) or `skill`/`severity`
 * (interviewReport). Whichever exist are merged.
 */
const missingSkillSources = (record) => {
  const job = record?.job || {};
  return [
    record?.skillGaps?.missingSkills,
    job?.skillGaps?.missingSkills,
    record?.matchDetails?.skillMatch?.missingSkills,
    job?.matchDetails?.skillMatch?.missingSkills,
    Array.isArray(record?.skillGaps) ? record.skillGaps : null,
  ];
};

const readGapEntry = (entry) => {
  if (typeof entry === "string") {
    const name = entry.trim();
    return name ? { name, severity: "medium" } : null;
  }
  if (!entry || typeof entry !== "object") return null;

  const name = String(entry.name ?? entry.skill ?? entry.title ?? "").trim();
  if (!name) return null;

  return {
    name,
    severity: normalizeSeverity(entry.difficulty ?? entry.severity ?? entry.level),
  };
};

/**
 * Unique missing skills across every analyzed job, worst severity wins.
 * Sorted high → medium → low, then alphabetically.
 *
 * @param {Array} records recommendations and/or applications ({ job } shaped)
 * @returns {{name:string, severity:"high"|"medium"|"low"}[]}
 */
export function aggregateSkillGaps(records = []) {
  const byName = new Map();

  for (const record of arr(records)) {
    for (const source of missingSkillSources(record)) {
      for (const raw of arr(source)) {
        const gap = readGapEntry(raw);
        if (!gap) continue;

        const key = gap.name.toLowerCase();
        const existing = byName.get(key);
        if (!existing) {
          byName.set(key, gap);
        } else if (SEVERITY_RANK[gap.severity] < SEVERITY_RANK[existing.severity]) {
          existing.severity = gap.severity;
        }
      }
    }
  }

  return [...byName.values()].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.name.localeCompare(b.name)
  );
}

/* ── Job match ───────────────────────────────────────────────────────── */

const timeOf = (value) => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * The candidate's latest match score. Prefers the most recently recommended
 * role; with no usable timestamps it falls back to the highest score, which
 * is the order the API already returns.
 *
 * @returns {{score:number, roleName:string|null, companyName:string|null}|null}
 */
export function latestMatch(recommendations = []) {
  const scored = arr(recommendations)
    .map((rec) => {
      const score = num(rec?.matchScore);
      if (score === null) return null;
      return {
        score: Math.round(score),
        at: timeOf(rec?.recommendedAt ?? rec?.createdAt ?? rec?.updatedAt),
        roleName: rec?.job?.roleName ?? null,
        companyName: rec?.job?.companyName ?? null,
      };
    })
    .filter(Boolean);

  if (!scored.length) return null;

  const dated = scored.filter((s) => s.at !== null);
  const pool = dated.length ? dated : scored;
  const pick = dated.length
    ? pool.reduce((best, s) => (s.at > best.at ? s : best))
    : pool.reduce((best, s) => (s.score > best.score ? s : best));

  const { score, roleName, companyName } = pick;
  return { score, roleName, companyName };
}

/* ── Exams ───────────────────────────────────────────────────────────── */

/** Percentage for one result, normalising against `total` when present. */
export function examPercent(result) {
  const score = num(result?.score);
  if (score === null) return null;
  const total = num(result?.total);
  if (total !== null && total > 0) return Math.round((score / total) * 100);
  return Math.round(score);
}

/**
 * @returns {{count:number, average:number|null}} average is null when no
 * result carries a numeric score — never 0 as a stand-in.
 */
export function examStats(results = []) {
  const list = arr(results);
  const percents = list.map(examPercent).filter((p) => p !== null);

  return {
    count: list.length,
    average: percents.length
      ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length)
      : null,
  };
}

/* ── Integrations ────────────────────────────────────────────────────── */

/**
 * Profile URL for a platform, using only values the API actually returned
 * (plus the canonical URL pattern for a username the user themselves
 * supplied). Never a fabricated handle.
 */
const profileUrlFor = (platform, entry) => {
  const direct = entry?.profileUrl || entry?.data?.profileUrl || entry?.url;
  if (direct) return String(direct);

  const username = String(entry?.username ?? entry?.data?.username ?? "").trim();
  if (!username) return null;

  if (platform === "github") return `https://github.com/${username}`;
  if (platform === "leetcode") return `https://leetcode.com/u/${username}/`;
  return null;
};

export const PLATFORMS = [
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "leetcode", label: "LeetCode" },
];

/**
 * Normalise `{ integration | integrations }` into one row per platform.
 * A platform counts as connected only when it has a real URL to link to.
 */
export function normalizeIntegrations(payload) {
  const source = payload || {};

  return PLATFORMS.map(({ key, label }) => {
    const entry = source[key] || {};
    const url = profileUrlFor(key, entry);
    const username = String(entry?.username ?? entry?.data?.username ?? "").trim();

    return {
      key,
      label,
      connected: Boolean(entry?.connected && url),
      username: username || null,
      url,
    };
  });
}
