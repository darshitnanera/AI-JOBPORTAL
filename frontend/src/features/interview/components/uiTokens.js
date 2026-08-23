/**
 * Shared Tailwind class strings for the AI-suggestion feature.
 * Kept in a plain module (no components) so fast-refresh stays happy.
 * These mirror the patterns in src/styles/DESIGN_SYSTEM.md verbatim.
 */

export const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900";

export const PLAIN_CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";

export const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export const LABEL =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

/** Score → semantic colour. The number itself always comes from the API. */
export const scoreTone = (score) => {
  if (score >= 75)
    return "bg-success-50 text-success-700 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500";
  if (score >= 50)
    return "bg-warning-50 text-warning-700 ring-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500";
  return "bg-danger-50 text-danger-700 ring-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500";
};

export const severityTone = (severity) => {
  switch (severity) {
    case "high":
      return "bg-danger-50 text-danger-700 ring-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500";
    case "medium":
      return "bg-warning-50 text-warning-700 ring-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500";
    default:
      return "bg-success-50 text-success-700 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500";
  }
};
