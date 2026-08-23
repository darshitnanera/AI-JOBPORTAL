/**
 * Shared helpers for the developer-activity integration panels.
 *
 * DATA INTEGRITY CONTRACT (see styles/DESIGN_SYSTEM.md §7)
 * ------------------------------------------------------
 * These predicates exist so panels can ask "did the API actually return this?"
 * instead of falling back to `|| 0`. A stat is rendered ONLY when its predicate
 * returns true. Never substitute a placeholder, a zero, or sample data.
 */

/** True only when the API returned a real, finite number. */
export const hasNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

/**
 * True only once the platform has actually been fetched.
 *
 * The schema materialises counters as 0 (followers, publicRepos, commits) the
 * moment an account is linked, so a never-synced profile reports a full set of
 * hard zeros. Rendering those reads as "this candidate has 0 repositories and
 * 0 commits" — a factual claim about the person — when the truth is that we
 * have not asked GitHub yet. Gate every statistic on this, and show a
 * "not synced yet" note instead.
 */
export const hasSynced = (platform) =>
  Boolean(platform?.lastSync) || Boolean(platform?.data?.lastSync);

/** True only when the API returned a non-empty string. */
export const hasText = (value) =>
  typeof value === "string" && value.trim().length > 0;

/** True only when the API returned a non-empty array. */
export const hasItems = (value) => Array.isArray(value) && value.length > 0;

/** Locale-aware thousands separator. Callers must gate with `hasNumber` first. */
export const formatNumber = (value) =>
  new Intl.NumberFormat(undefined).format(value);

/**
 * "Last synced" label. Returns null when the API gave us no timestamp,
 * so the caller can omit the row entirely.
 */
export const formatSyncedAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Resolves the bearer token the app stores.
 *
 * The auth context persists `jobportal_user`; some older screens wrote
 * `authToken`. We check every known key so the Authorization header is
 * populated regardless of which login path the user came through.
 * The request SHAPE is unchanged — this only sources the value.
 */
export const readAuthToken = () => {
  try {
    const stored = localStorage.getItem("jobportal_user");
    const parsed = stored ? JSON.parse(stored) : null;
    if (parsed?.token) return parsed.token;
  } catch {
    /* ignore malformed JSON */
  }
  return localStorage.getItem("authToken") || localStorage.getItem("token") || "";
};

export const authHeaders = () => ({
  Authorization: `Bearer ${readAuthToken()}`,
});

/** Neutral fallback swatch for a language the API sent without a colour. */
export const LANGUAGE_FALLBACK_COLOR = "#94a3b8"; /* slate-400 */

/**
 * Normalises the language list into renderable segments.
 * Entries without a usable percentage are dropped rather than guessed.
 */
export const toLanguageSegments = (languages) => {
  if (!hasItems(languages)) return [];
  return languages
    .filter((lang) => lang && hasText(lang.name) && hasNumber(lang.percentage))
    .map((lang) => ({
      name: lang.name,
      percentage: Math.max(0, lang.percentage),
      color: hasText(lang.color) ? lang.color : LANGUAGE_FALLBACK_COLOR,
    }))
    .sort((a, b) => b.percentage - a.percentage);
};
