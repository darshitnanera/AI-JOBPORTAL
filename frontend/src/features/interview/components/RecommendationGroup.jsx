import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { CARD, PLAIN_CARD, SECONDARY_BTN } from "./uiTokens";

export const Badge = ({ className = "", children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
      className ||
      "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25"
    }`}
  >
    {children}
  </span>
);

const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  </div>
);

/**
 * One recommendation: icon chip, title, explanation and an action link.
 * `explanation` must always come from API data — never fabricated.
 */
export const RecommendationCard = ({
  icon,
  title,
  meta,
  badge,
  explanation,
  actionLabel,
  to,
  onClick,
}) => {
  const ChipIcon = icon;

  return (
    <article className={`${CARD} flex h-full flex-col`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <ChipIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          {meta && (
            <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{meta}</p>
          )}
        </div>
        {badge}
      </div>

      {explanation && (
        <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {explanation}
        </p>
      )}

      <div className="mt-5">
        {to ? (
          <Link
            to={to}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {actionLabel}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {actionLabel}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </article>
  );
};

/**
 * Section wrapper that owns the four states every data view needs:
 * loading skeletons, error + retry, empty state, loaded content.
 */
export const RecommendationGroup = ({
  icon,
  title,
  description,
  source,
  status = "ready", // loading | error | ready
  errorMessage,
  onRetry,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyBody,
  emptyAction,
  children,
}) => {
  const HeadingIcon = icon;
  const EmptyIcon = emptyIcon || icon;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <HeadingIcon size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          </div>
        </div>
        {source && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{source}</p>
        )}
      </div>

      {status === "loading" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className={`${PLAIN_CARD} flex flex-col items-center gap-3 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
            <AlertCircle size={20} />
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            Couldn&apos;t load this section
          </h3>
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">{errorMessage}</p>
          {onRetry && (
            <button type="button" className={SECONDARY_BTN} onClick={onRetry}>
              <RefreshCw size={16} />
              Try again
            </button>
          )}
        </div>
      )}

      {status === "ready" && isEmpty && (
        <div className={`${PLAIN_CARD} flex flex-col items-center gap-3 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <EmptyIcon size={20} />
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{emptyTitle}</h3>
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">{emptyBody}</p>
          {emptyAction}
        </div>
      )}

      {status === "ready" && !isEmpty && children}
    </section>
  );
};

export default RecommendationGroup;
