import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  History,
  Loader2,
  MessagesSquare,
  Play,
  RefreshCw,
  Target,
} from "lucide-react";
import {
  BADGE_BRAND,
  BADGE_NEUTRAL,
  BADGE_SUCCESS,
  BADGE_WARNING,
  CARD,
  CARD_INTERACTIVE,
  INPUT,
  LABEL,
  MUTED,
  PRIMARY_BTN,
  SKELETON,
  SUBTITLE,
} from "./ui";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const OptionsSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2">
    {[0, 1, 2, 3].map((row) => (
      <div key={row} className={CARD}>
        <div className={`${SKELETON} h-4 w-1/2`} />
        <div className={`${SKELETON} mt-4 h-3 w-3/4`} />
        <div className={`${SKELETON} mt-2 h-3 w-2/3`} />
      </div>
    ))}
  </div>
);

/**
 * Phase 1 — pick a company and a role that a recruiter has actually published
 * questions for. Counts come straight from the API so the candidate knows how
 * long the session will be.
 */
export default function SelectionPhase({
  options,
  loading,
  error,
  onRetry,
  onStart,
  starting,
  startError,
  attempts,
  attemptsLoading,
}) {
  const companies = useMemo(() => options?.companies || [], [options]);

  // Only an explicit user choice is stored. The company actually shown is
  // derived, so a first render — or a refresh that drops the chosen company —
  // falls back to the first available one without an effect round-trip.
  const [chosenCompany, setChosenCompany] = useState("");

  const activeCompany = useMemo(() => {
    if (companies.length === 0) return null;
    return (
      companies.find((company) => company.companyName === chosenCompany) ||
      companies[0]
    );
  }, [companies, chosenCompany]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={CARD}>
          <div className={`${SKELETON} h-4 w-40`} />
          <div className={`${SKELETON} mt-4 h-11 w-full`} />
        </div>
        <OptionsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${CARD} text-center`}>
        <AlertCircle
          size={32}
          className="mx-auto text-danger-600 dark:text-danger-500"
        />
        <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">
          We couldn't load the practice sessions
        </h2>
        <p className={`${MUTED} mt-1`}>{error}</p>
        <button type="button" onClick={onRetry} className={`${PRIMARY_BTN} mt-5`}>
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className={`${CARD} text-center`}>
        <MessagesSquare
          size={32}
          className="mx-auto text-slate-400 dark:text-slate-500"
        />
        <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">
          No mock interviews published yet
        </h2>
        <p className={`${MUTED} mx-auto mt-1 max-w-md`}>
          Recruiters build these question sets for their own roles. As soon as
          one publishes a set, it will appear here ready to practise.
        </p>
        <button type="button" onClick={onRetry} className={`${PRIMARY_BTN} mt-5`}>
          <RefreshCw size={16} />
          Check again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {startError ? (
        <div className="flex items-start gap-2 rounded-xl border border-danger-500/40 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{startError}</span>
        </div>
      ) : null}

      {/* Company picker */}
      <div className={CARD}>
        <label className={LABEL} htmlFor="mock-company">
          Company
        </label>
        <select
          id="mock-company"
          value={activeCompany?.companyName || ""}
          onChange={(event) => setChosenCompany(event.target.value)}
          className={INPUT}
        >
          {companies.map((company) => (
            <option key={company.companyName} value={company.companyName}>
              {company.companyName} — {company.questionCount} question
              {company.questionCount === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        <p className={`${SUBTITLE}`}>
          {companies.length} compan{companies.length === 1 ? "y has" : "ies have"}{" "}
          published practice questions.
        </p>
      </div>

      {/* Role cards */}
      <div>
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Choose a role
        </h2>
        <p className={`${SUBTITLE} mb-6`}>
          Pick the role you want to rehearse for at{" "}
          {activeCompany?.companyName || "this company"}.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(activeCompany?.roles || []).map((role) => (
            <article key={role.targetRole} className={CARD_INTERACTIVE}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
                    {role.targetRole}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Building2 size={14} />
                    {activeCompany.companyName}
                  </p>
                </div>
                <span className={BADGE_BRAND}>
                  <Target size={12} />
                  {role.questionCount}
                </span>
              </div>

              <p className={`${MUTED} mt-4`}>
                {role.questionCount} question{role.questionCount === 1 ? "" : "s"}{" "}
                · answered one at a time, scored against the recruiter's key
                points.
              </p>

              <button
                type="button"
                onClick={() => onStart(activeCompany.companyName, role.targetRole)}
                disabled={starting}
                className={`${PRIMARY_BTN} mt-5 w-full`}
              >
                {starting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                Start interview
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* Past attempts */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          <History size={20} />
          Your past attempts
        </h2>
        <p className={`${SUBTITLE} mb-6`}>
          These also feed the assessment stats on your dashboard.
        </p>

        {attemptsLoading ? (
          <div className={CARD}>
            <div className={`${SKELETON} h-4 w-1/3`} />
            <div className={`${SKELETON} mt-3 h-3 w-1/2`} />
          </div>
        ) : (attempts || []).length === 0 ? (
          <div className={`${CARD} text-center`}>
            <CalendarDays
              size={28}
              className="mx-auto text-slate-400 dark:text-slate-500"
            />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-50">
              No attempts yet
            </h3>
            <p className={`${MUTED} mt-1`}>
              Finish a session above and your score history will build up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {attempts.map((attempt) => (
              <li key={attempt._id}>
                <div className={`${CARD} flex flex-wrap items-center justify-between gap-3`}>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {attempt.targetRole}
                    </p>
                    <p className={`${MUTED} mt-0.5`}>
                      {attempt.companyName}
                      {formatDate(attempt.completedAt)
                        ? ` · ${formatDate(attempt.completedAt)}`
                        : ""}
                      {" · "}
                      {attempt.totalQuestions} question
                      {attempt.totalQuestions === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={BADGE_NEUTRAL}>
                      {attempt.overallScore}/100
                    </span>
                    <span
                      className={
                        attempt.overallScore >= 60 ? BADGE_SUCCESS : BADGE_WARNING
                      }
                    >
                      {attempt.overallScore >= 60 ? "Passed" : "Keep practising"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
