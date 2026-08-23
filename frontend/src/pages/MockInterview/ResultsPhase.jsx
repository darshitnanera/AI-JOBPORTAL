import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Lightbulb,
  RotateCcw,
  Target,
  TriangleAlert,
} from "lucide-react";
import {
  BADGE_BRAND,
  BADGE_NEUTRAL,
  BADGE_SUCCESS,
  BADGE_WARNING,
  CARD,
  DIFFICULTY_BADGE,
  MUTED,
  PRIMARY_BTN,
  SECONDARY_BTN,
} from "./ui";

const formatElapsed = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

/** Colour band for a score. Presentation only — the number is the API's. */
const scoreTone = (score) => {
  if (score >= 75) return "text-success-600 dark:text-success-500";
  if (score >= 50) return "text-warning-600 dark:text-warning-500";
  return "text-danger-600 dark:text-danger-500";
};

const scoreBadge = (score) => {
  if (score >= 75) return BADGE_SUCCESS;
  if (score >= 50) return BADGE_WARNING;
  return BADGE_NEUTRAL;
};

/**
 * Phase 3 — the report. Every score, matched key point, missing key point,
 * feedback line and tip is read directly off the API response. Nothing on this
 * screen is computed in the browser.
 */
export default function ResultsPhase({ report, onPracticeAgain, onBackToSelection }) {
  const attempt = report?.attempt || {};
  const results = report?.results || [];
  const overallScore = report?.overallScore ?? attempt.overallScore ?? 0;

  return (
    <div className="space-y-6">
      {/* Overall */}
      <div className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Overall score
            </p>
            <p className={`mt-1 text-5xl font-bold ${scoreTone(overallScore)}`}>
              {overallScore}
              <span className="text-2xl font-semibold text-slate-400 dark:text-slate-500">
                /100
              </span>
            </p>
            <p className={`${MUTED} mt-2`}>
              {attempt.targetRole} at {attempt.companyName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={BADGE_BRAND}>
              <Target size={12} />
              {attempt.totalQuestions ?? results.length} question
              {(attempt.totalQuestions ?? results.length) === 1 ? "" : "s"}
            </span>
            {attempt.durationSeconds ? (
              <span className={BADGE_NEUTRAL}>
                <Clock size={12} />
                {formatElapsed(attempt.durationSeconds)}
              </span>
            ) : null}
            <span className={overallScore >= 60 ? BADGE_SUCCESS : BADGE_WARNING}>
              {overallScore >= 60 ? "Passed" : "Below pass mark"}
            </span>
          </div>
        </div>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, overallScore))}%` }}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onPracticeAgain} className={PRIMARY_BTN}>
            <RotateCcw size={16} />
            Practice again
          </button>
          <button type="button" onClick={onBackToSelection} className={SECONDARY_BTN}>
            Choose another role
          </button>
        </div>
      </div>

      {/* Per question */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Question breakdown
        </h2>

        {results.map((result, index) => (
          <article key={result.questionId || index} className={CARD}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={BADGE_NEUTRAL}>Question {index + 1}</span>
                  {result.category ? (
                    <span className={BADGE_BRAND}>{result.category}</span>
                  ) : null}
                  {result.difficulty ? (
                    <span
                      className={DIFFICULTY_BADGE[result.difficulty] || BADGE_NEUTRAL}
                    >
                      {result.difficulty}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-base font-bold leading-relaxed text-slate-900 dark:text-slate-50">
                  {result.questionText}
                </h3>
              </div>

              <span className={scoreBadge(result.score)}>{result.score}/100</span>
            </div>

            {/* Your answer */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Your answer
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                {result.response?.trim() || "You left this question unanswered."}
              </p>
            </div>

            {/* Key points */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success-700 dark:text-success-500">
                  <CheckCircle2 size={14} />
                  Covered ({(result.matchedKeyPoints || []).length})
                </p>
                {(result.matchedKeyPoints || []).length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {result.matchedKeyPoints.map((point, i) => (
                      <li
                        key={`m-${i}`}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-success-600 dark:text-success-500"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`${MUTED} mt-2`}>None on this question.</p>
                )}
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning-700 dark:text-warning-500">
                  <TriangleAlert size={14} />
                  Missed ({(result.missingKeyPoints || []).length})
                </p>
                {(result.missingKeyPoints || []).length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {result.missingKeyPoints.map((point, i) => (
                      <li
                        key={`x-${i}`}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <TriangleAlert
                          size={16}
                          className="mt-0.5 shrink-0 text-warning-600 dark:text-warning-500"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`${MUTED} mt-2`}>
                    Nothing missed — full coverage.
                  </p>
                )}
              </div>
            </div>

            {/* Feedback */}
            {result.feedback ? (
              <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/25 dark:bg-brand-500/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  Feedback
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {result.feedback}
                </p>
              </div>
            ) : null}

            {/* Tips */}
            {(result.tips || []).length > 0 ? (
              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Lightbulb size={14} />
                  How to improve
                </p>
                <ul className="mt-2 space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <li
                      key={`t-${i}`}
                      className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Model answer — safe to reveal now the session is over */}
            {result.modelAnswer ? (
              <details className="group mt-4">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                  <BookOpen size={16} />
                  Show the model answer
                </summary>
                <p className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                  {result.modelAnswer}
                </p>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
