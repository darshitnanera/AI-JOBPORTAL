import React from "react";
import { Calendar, History, RotateCcw } from "lucide-react";

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900";

const formatDate = (date) => {
  if (!date) return "Unknown date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const VersionsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-3 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-5 h-9 w-44 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    ))}
  </div>
);

const ResumeVersions = ({ versions = [], onRestore, loading, restoring = false }) => {
  if (loading) return <VersionsSkeleton />;

  if (!versions.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <History size={24} />
        </span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
          No version history yet
        </h3>
        <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
          Every time you save a section a new version is stored here, so you can
          always roll back to an earlier resume.
        </p>
      </div>
    );
  }

  const sorted = [...versions].sort((a, b) => (b.version || 0) - (a.version || 0));
  const latest = sorted[0]?.version;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Version history
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Restore any earlier snapshot of your resume. Restoring replaces the
          data on the Review &amp; Edit tab.
        </p>
      </div>

      <ol className="space-y-4">
        {sorted.map((version, index) => (
          <li key={version.version ?? index} className={CARD}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                    Version {version.version ?? index + 1}
                  </h3>
                  {version.version === latest && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
                      Latest
                    </span>
                  )}
                </div>

                <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar size={14} className="shrink-0" />
                  {formatDate(version.createdAt)}
                </p>

                {version.notes && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {version.notes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRestore?.(version.version)}
                disabled={restoring}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RotateCcw size={16} />
                Restore
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ResumeVersions;
