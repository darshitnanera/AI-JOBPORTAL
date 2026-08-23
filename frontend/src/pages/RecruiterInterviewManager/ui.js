/**
 * Class-string constants copied verbatim from src/styles/DESIGN_SYSTEM.md.
 *
 * They live in a .js file on purpose — this project is Tailwind v4 and an
 * unlayered .css file with bare element selectors would outrank every utility
 * and break the app. Styling stays as inline utility strings.
 */

export const PAGE = "min-h-screen bg-slate-50 dark:bg-slate-950";

export const MAIN = "mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8";

export const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export const CARD_INTERACTIVE = `${CARD} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`;

export const LABEL =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

export const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export const TEXTAREA = `${INPUT} min-h-28 resize-y leading-relaxed`;

export const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const SMALL_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const DANGER_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-white px-3 py-1.5 text-xs font-semibold text-danger-600 transition-all hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-danger-500/30 dark:bg-slate-900 dark:text-danger-500 dark:hover:bg-danger-500/10";

export const BADGE_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

export const BADGE_BRAND = `${BADGE_BASE} bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25`;

export const BADGE_NEUTRAL = `${BADGE_BASE} bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700`;

export const BADGE_SUCCESS = `${BADGE_BASE} bg-success-50 text-success-700 ring-success-500/30 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25`;

export const BADGE_WARNING = `${BADGE_BASE} bg-warning-50 text-warning-700 ring-warning-500/30 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25`;

export const BADGE_DANGER = `${BADGE_BASE} bg-danger-50 text-danger-700 ring-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/25`;

export const H1 =
  "text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50";

export const H2 =
  "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50";

export const SUBTITLE = "mt-1 text-sm text-slate-600 dark:text-slate-400";

export const MUTED = "text-sm text-slate-500 dark:text-slate-400";

export const SKELETON = "animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800";

/** Difficulty → badge class, so the same colour always means the same thing. */
export const DIFFICULTY_BADGE = {
  Easy: BADGE_SUCCESS,
  Medium: BADGE_WARNING,
  Hard: BADGE_DANGER,
};

export const CATEGORIES = ["Technical", "HR", "System Design", "Behavioural"];

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
