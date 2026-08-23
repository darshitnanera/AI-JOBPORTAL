import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Link2,
  RefreshCw,
} from "lucide-react";
import { formatSyncedAt } from "./integrationHelpers";

/* ------------------------------------------------------------------ *
 * Panel shell + the four required states (loading / empty / error /   *
 * loaded). Pure Tailwind utilities — no companion .css file, so no    *
 * unlayered element selector can ever outrank a utility class.        *
 * ------------------------------------------------------------------ */

export const PANEL_CARD =
  "flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl " +
  "dark:border-slate-800 dark:bg-slate-900";

/** Small pill used for "Connected" / "Not connected". */
export const ConnectionBadge = ({ connected }) =>
  connected ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25">
      <CheckCircle2 size={14} />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
      Not connected
    </span>
  );

/** Header row: brand icon + title + connection state. */
const PanelHeader = ({ icon: Icon, iconClass, title, subtitle, connected, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h3>
        {subtitle ? (
          <p className="truncate text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {typeof connected === "boolean" ? (
        <ConnectionBadge connected={connected} />
      ) : null}
      {action}
    </div>
  </div>
);

/**
 * Generic integration panel.
 *
 * state: "loading" | "error" | "disconnected" | "connected"
 */
const IntegrationPanel = ({
  icon,
  iconClass = "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
  title,
  subtitle,
  state,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction,
  lastSync,
  children,
}) => {
  if (state === "loading") {
    return <PanelSkeleton />;
  }

  const connected = state === "connected";
  const syncedLabel = connected ? formatSyncedAt(lastSync) : null;

  return (
    <section className={PANEL_CARD}>
      <PanelHeader
        icon={icon}
        iconClass={iconClass}
        title={title}
        subtitle={subtitle}
        connected={state === "error" ? undefined : connected}
      />

      <div className="mt-5 min-w-0 flex-1">
        {state === "error" ? (
          <PanelError message={errorMessage} onRetry={onRetry} />
        ) : state === "disconnected" ? (
          <PanelEmpty
            title={emptyTitle || `${title} is not connected`}
            message={emptyMessage}
            action={emptyAction}
          />
        ) : (
          children
        )}
      </div>

      {syncedLabel ? (
        <p className="mt-5 flex items-center gap-1.5 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <Clock size={14} />
          Last synced {syncedLabel}
        </p>
      ) : null}
    </section>
  );
};

/* ---------------------------- States ----------------------------- */

export const PanelSkeleton = () => (
  <section className={PANEL_CARD} aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading developer activity…</span>
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
    <div className="mt-6 grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
    <div className="mt-5 space-y-3">
      <div className="h-3 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
    </div>
  </section>
);

export const PanelError = ({ message, onRetry }) => (
  <div className="rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:border-danger-500/25 dark:bg-danger-500/10">
    <div className="flex items-start gap-3">
      <AlertCircle
        size={18}
        className="mt-0.5 shrink-0 text-danger-600 dark:text-danger-500"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-danger-700 dark:text-danger-500">
          Couldn&apos;t load this panel
        </p>
        <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
          {message || "Something went wrong while contacting the server."}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        ) : null}
      </div>
    </div>
  </div>
);

export const PanelEmpty = ({ title, message, action, icon: Icon = Link2 }) => (
  <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
      <Icon size={20} />
    </span>
    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
      {title}
    </p>
    {message ? (
      <p className="mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-400">
        {message}
      </p>
    ) : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

/* --------------------------- Building blocks ---------------------- */

/** One numeric tile. Render only after checking the value exists. */
export const StatTile = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-950/40">
    <p className="truncate text-lg font-bold text-slate-900 tabular-nums dark:text-slate-50">
      {value}
    </p>
    <p className="mt-0.5 flex items-center justify-center gap-1 truncate text-xs font-medium text-slate-600 dark:text-slate-400">
      {Icon ? <Icon size={12} className="shrink-0" /> : null}
      <span className="truncate">{label}</span>
    </p>
  </div>
);

/** Sub-heading inside a panel. */
export const PanelSectionTitle = ({ icon: Icon, children }) => (
  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
    {Icon ? <Icon size={16} className="shrink-0" /> : null}
    {children}
  </h4>
);

/** Labelled progress bar with a semantic tint. */
export const ProgressRow = ({ label, count, percentage, tone = "brand" }) => {
  const toneClasses = {
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    brand: "bg-brand-600",
  };

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="text-sm font-bold text-slate-900 tabular-nums dark:text-slate-100">
          {count}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            toneClasses[tone] || toneClasses.brand
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
};

export default IntegrationPanel;
