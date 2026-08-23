/**
 * Widget — "Recommended mock interviews".
 *
 * Renders the company/role pairings a recruiter has actually published
 * (GET /api/mock-interview/options). The endpoint returns company, role and a
 * question count and nothing else, so no difficulty badge is shown — see the
 * note in careerPlan.js.
 *
 * Tailwind utilities only; every dark class is paired with a light default.
 */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, MessagesSquare } from "lucide-react";

import { flattenInterviewOptions } from "./careerPlan";
import {
  Card,
  EmptyState,
  ErrorState,
  LINK_BTN,
  PRIMARY_BTN,
  SectionHeader,
} from "./DashboardParts";

const INTERVIEW_ROUTE = "/candidate/mock-interview";

/** How many cards to show before deferring to "View all". */
const VISIBLE_CAP = 4;

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";

const CardSkeleton = () => (
  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-5 h-8 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
  </div>
);

const RecommendedInterviews = ({ companies, loading, error, onRetry }) => {
  const pairs = useMemo(
    () => flattenInterviewOptions(companies),
    [companies]
  );

  const visible = pairs.slice(0, VISIBLE_CAP);
  const hidden = pairs.length - visible.length;

  return (
    <Card>
      <SectionHeader
        icon={MessagesSquare}
        title="Recommended mock interviews"
        subtitle="Practice sets recruiters have published for these roles"
        action={
          loading || error || pairs.length === 0 ? null : (
            <Link to={INTERVIEW_ROUTE} className={LINK_BTN}>
              View all{hidden > 0 ? ` (${pairs.length})` : ""}
              <ArrowRight size={16} />
            </Link>
          )
        }
      />

      {loading ? (
        <div className={GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : pairs.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No practice sets available yet"
          message="No recruiter has published practice questions yet. Check the mock interview page for anything added since."
          action={
            <Link to={INTERVIEW_ROUTE} className={PRIMARY_BTN}>
              <MessagesSquare size={16} />
              Open mock interviews
            </Link>
          }
        />
      ) : (
        <>
          <ul className={GRID}>
            {visible.map((pair) => (
              <li
                key={pair.id}
                className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/60"
              >
                <p className="flex items-start gap-2 text-sm font-bold text-slate-900 dark:text-slate-50">
                  <Building2
                    size={16}
                    className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
                  />
                  <span className="min-w-0 wrap-break-word">{pair.companyName}</span>
                </p>
                <p className="mt-1 min-w-0 wrap-break-word text-sm text-slate-600 dark:text-slate-400">
                  {pair.targetRole}
                </p>
                {pair.questionCount === null ? null : (
                  <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {pair.questionCount}{" "}
                    {pair.questionCount === 1 ? "question" : "questions"}
                  </p>
                )}
                <Link
                  to={INTERVIEW_ROUTE}
                  className={`${PRIMARY_BTN} mt-4 w-full`}
                  aria-label={`Start the ${pair.targetRole} interview at ${pair.companyName}`}
                >
                  Start interview
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>

          {hidden > 0 ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              {hidden} more practice {hidden === 1 ? "set is" : "sets are"}{" "}
              available.{" "}
              <Link to={INTERVIEW_ROUTE} className={LINK_BTN}>
                View all
              </Link>
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
};

export default RecommendedInterviews;
