/**
 * Widget — "AI Career Action Plan".
 *
 * Every row is derived from this candidate's own data (see buildCareerPlan):
 * their aggregated skill gaps, which platforms they have actually connected,
 * what their parsed resume is missing, and whether they have any assessment
 * history. Nothing is hardcoded advice.
 *
 * HONESTY NOTE — the bar below is *plan progress*, i.e. how many steps of this
 * checklist you have ticked off. It is deliberately NOT a readiness or ATS
 * percentage: ticking a checkbox does not improve a resume, so a score that
 * rose on tick would be a fabricated metric. The real ATS score is passed in
 * read-only and is never re-derived, shadowed or adjusted from checkbox state.
 */
import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ListChecks, Sparkles } from "lucide-react";

import {
  buildCareerPlan,
  planStorageKey,
  readCompletedIds,
  writeCompletedIds,
} from "./careerPlan";
import {
  Card,
  EmptyState,
  ErrorState,
  LINK_BTN,
  RowSkeleton,
  SectionHeader,
} from "./DashboardParts";

const CareerActionPlan = ({
  userId,
  skillGaps,
  profiles,
  parsedResume,
  hasResume,
  examCount,
  atsScore,
  loading,
  error,
  onRetry,
}) => {
  const items = useMemo(
    () =>
      buildCareerPlan({
        skillGaps,
        profiles,
        parsedResume,
        hasResume,
        examCount,
      }),
    [skillGaps, profiles, parsedResume, hasResume, examCount]
  );

  const storageKey = useMemo(() => planStorageKey(userId), [userId]);

  // Lazy init, so the ticks are already correct on the first paint and no
  // effect has to re-sync them. The parent keys this component by user id, so
  // a different signed-in user remounts it and re-reads their own storage
  // rather than inheriting the previous user's checklist.
  const [completed, setCompleted] = useState(
    () => new Set(readCompletedIds(storageKey))
  );

  const toggle = useCallback(
    (id) => {
      const next = new Set(completed);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCompleted(next);
      writeCompletedIds(storageKey, [...next]);
    },
    [completed, storageKey]
  );

  // Counted against the *current* plan only, so a stale id left in storage
  // from a step that no longer applies cannot inflate the progress.
  const doneCount = items.filter((item) => completed.has(item.id)).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Card>
      <SectionHeader
        icon={Sparkles}
        title="AI Career Action Plan"
        subtitle="Personalised steps to strengthen your profile"
      />

      {loading ? (
        <RowSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : total === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing outstanding right now"
          message="Your resume, linked profiles and analysed roles aren't flagging anything to act on. New steps appear here as you match against more jobs."
        />
      ) : (
        <>
          {/* Plan progress — steps ticked, never a readiness score. */}
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/60">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Plan progress
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                {doneCount} of {total} steps done
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
              role="progressbar"
              aria-label="Action plan steps completed"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuetext={`${doneCount} of ${total} steps done`}
            >
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Progress through this checklist only — ticking a step doesn't change
              any score.
            </p>
          </div>

          <ul className="space-y-3">
            {items.map((item) => {
              const checked = completed.has(item.id);
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600"
                    />
                    <span className="min-w-0">
                      <span
                        className={`block wrap-break-word text-sm font-semibold ${
                          checked
                            ? "text-slate-500 line-through dark:text-slate-500"
                            : "text-slate-900 dark:text-slate-50"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="mt-0.5 block wrap-break-word text-sm text-slate-600 dark:text-slate-400">
                        {item.why}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {/* Real ATS score, shown read-only for reference. */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {typeof atsScore === "number"
                  ? `Your ATS score: ${atsScore}/100`
                  : "No ATS score yet"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {typeof atsScore === "number"
                  ? "Your ATS score updates when you save real changes to your resume."
                  : "Upload and parse a resume and it will be scored here."}
              </p>
            </div>
            <Link to="/resume" className={`${LINK_BTN} shrink-0`}>
              <ListChecks size={16} />
              Open resume builder
            </Link>
          </div>
        </>
      )}
    </Card>
  );
};

export default CareerActionPlan;
