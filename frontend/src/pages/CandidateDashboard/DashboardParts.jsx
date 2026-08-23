/**
 * Presentational atoms for the candidate dashboard.
 *
 * Tailwind utilities only — no .css file. Every dark surface/text class is
 * paired with a light default so the page reads correctly in both themes
 * (the `dark:` variant here follows both [data-theme] and the OS preference,
 * per src/styles/globals.css).
 */
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/* ── Style constants ─────────────────────────────────────────────────── */

export const CARD =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80";

export const ROW =
  "flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/60";

export const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60";

export const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const LINK_BTN =
  "inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300";

const SKELETON = "animate-pulse rounded bg-slate-200 dark:bg-slate-800";

/* ── Card shell + section header ─────────────────────────────────────── */

export const Card = ({ className = "", children }) => (
  <section className={`${CARD} ${className}`}>{children}</section>
);

export const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {Icon ? (
          <Icon size={18} className="shrink-0 text-slate-500 dark:text-slate-400" />
        ) : null}
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
    {action}
  </div>
);

/* ── KPI card ────────────────────────────────────────────────────────── */

const ACCENT = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

/**
 * @param value    the number to render, or null → em-dash (never a stand-in)
 * @param suffix   small muted text after the value (e.g. "/100")
 * @param footnote small muted line under the label
 */
export const KpiCard = ({
  icon,
  accent = "blue",
  value,
  suffix,
  label,
  footnote,
  loading,
  action,
}) => {
  const Icon = icon;
  return (
  <div
    className={`${CARD} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
  >
    <span
      className={`inline-flex rounded-xl p-2.5 ${ACCENT[accent] || ACCENT.blue}`}
    >
      <Icon size={20} />
    </span>

    {loading ? (
      <div className="mt-4 space-y-2">
        <div className={`h-9 w-20 ${SKELETON}`} />
        <div className={`h-4 w-28 ${SKELETON}`} />
      </div>
    ) : (
      <>
        <p className="mt-4 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            {value === null || value === undefined ? "—" : value}
          </span>
          {suffix ? (
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {suffix}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{label}</p>
        {footnote ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{footnote}</p>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </>
    )}
  </div>
  );
};

/* ── States ──────────────────────────────────────────────────────────── */

export const RowSkeleton = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
      >
        <div className="w-full space-y-2">
          <div className={`h-4 w-1/3 ${SKELETON}`} />
          <div className={`h-3 w-1/4 ${SKELETON}`} />
        </div>
        <div className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon, title, message, action }) => {
  const Icon = icon;
  return (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-700">
    <span className="rounded-xl bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      <Icon size={20} />
    </span>
    <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
      {title}
    </h3>
    <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
      {message}
    </p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
  );
};

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/40">
    <p className="flex items-start gap-2 text-sm font-medium text-red-700 dark:text-red-400">
      <AlertCircle size={18} className="mt-px shrink-0" />
      {message}
    </p>
    {onRetry ? (
      <button type="button" onClick={onRetry} className={SECONDARY_BTN}>
        <RefreshCw size={16} />
        Try again
      </button>
    ) : null}
  </div>
);

/* ── Pills ───────────────────────────────────────────────────────────── */

const PILL_BASE = "shrink-0 rounded-full px-3 py-1 text-xs font-semibold";

const SEVERITY_TONE = {
  high: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/80 dark:text-red-400 dark:border-red-800/50",
  medium:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800/50",
  low: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800/50",
};

export const SeverityPill = ({ severity }) => (
  <span className={`${PILL_BASE} lowercase ${SEVERITY_TONE[severity] || SEVERITY_TONE.medium}`}>
    {severity}
  </span>
);

export const PassFailPill = ({ passed }) => (
  <span
    className={`${PILL_BASE} ${passed ? SEVERITY_TONE.low : SEVERITY_TONE.high}`}
  >
    {passed ? "Passed" : "Failed"}
  </span>
);

/* ── ATS visuals ─────────────────────────────────────────────────────── */

const GAUGE_R = 52;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

/** Circular gauge. `value === null` draws an empty ring and an em-dash. */
export const AtsGauge = ({ value, caption }) => {
  const pct = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={
          typeof value === "number"
            ? `ATS readiness ${value} out of 100`
            : "ATS readiness not available"
        }
      >
        <circle
          cx="60"
          cy="60"
          r={GAUGE_R}
          fill="none"
          strokeWidth="10"
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        {typeof value === "number" ? (
          <circle
            cx="60"
            cy="60"
            r={GAUGE_R}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={GAUGE_C}
            strokeDashoffset={GAUGE_C - (GAUGE_C * pct) / 100}
            className="stroke-blue-500 transition-all duration-700 ease-out"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-slate-900 dark:text-slate-50">
          {typeof value === "number" ? value : "—"}
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {caption || "of 100"}
        </span>
      </div>
    </div>
  );
};

/**
 * Labelled progress bar. `value === null` renders an empty track with the
 * supplied `emptyLabel` instead of a misleading 0%.
 */
export const MeterBar = ({ label, value, emptyLabel }) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {value === null ? emptyLabel || label : label}
      </span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        {value === null ? "—" : `${value}%`}
      </span>
    </div>
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value === null ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
        style={{ width: `${value === null ? 0 : value}%` }}
      />
    </div>
  </div>
);
