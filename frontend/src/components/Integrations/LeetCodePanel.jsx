import React from "react";
import { Code2, Trophy, Target, ExternalLink, BarChart3 } from "lucide-react";
import IntegrationPanel, {
  PanelSectionTitle,
  ProgressRow,
  StatTile,
} from "./IntegrationPanel";
import { hasNumber, hasText, formatNumber , hasSynced} from "./integrationHelpers";

/* ------------------------------------------------------------------ *
 * LeetCode panel.                                                     *
 *                                                                     *
 * Difficulty bars are expressed as a share of the solved problems the *
 * API actually reported — we never invent LeetCode's global problem    *
 * totals to build a denominator.                                      *
 * ------------------------------------------------------------------ */

const LeetCodePanel = ({
  leetcode,
  loading = false,
  error = "",
  onRetry,
  connectAction,
}) => {
  const state = loading
    ? "loading"
    : error
      ? "error"
      : leetcode?.connected
        ? "connected"
        : "disconnected";

  // A linked-but-never-synced LeetCode account reports 0 solved for every
  // difficulty by schema default. Presenting that as "0 problems solved"
  // is a claim about the candidate we have not verified, so suppress the
  // whole block until a real sync has happened.
  const data = hasSynced(leetcode) ? leetcode?.data || {} : {};

  const difficulties = [
    hasNumber(data.easy) && {
      key: "easy",
      label: "Easy",
      count: data.easy,
      tone: "success",
    },
    hasNumber(data.medium) && {
      key: "medium",
      label: "Medium",
      count: data.medium,
      tone: "warning",
    },
    hasNumber(data.hard) && {
      key: "hard",
      label: "Hard",
      count: data.hard,
      tone: "danger",
    },
  ].filter(Boolean);

  /* Denominator: the largest real number we were given. Never fabricated. */
  const breakdownSum = difficulties.reduce((sum, d) => sum + d.count, 0);
  const denominator = Math.max(
    breakdownSum,
    hasNumber(data.totalSolved) ? data.totalSolved : 0,
  );

  const secondaryStats = [
    hasNumber(data.rating) &&
      data.rating > 0 && {
        key: "rating",
        icon: Trophy,
        label: "Contest rating",
        value: formatNumber(Math.round(data.rating)),
      },
    hasNumber(data.ranking) &&
      data.ranking > 0 && {
        key: "ranking",
        icon: BarChart3,
        label: "Global ranking",
        value: `#${formatNumber(data.ranking)}`,
      },
    hasNumber(data.acceptanceRate) &&
      data.acceptanceRate > 0 && {
        key: "acceptance",
        icon: Target,
        label: "Acceptance rate",
        value: `${Math.round(data.acceptanceRate * 10) / 10}%`,
      },
  ].filter(Boolean);

  const hasAnyContent =
    hasNumber(data.totalSolved) ||
    difficulties.length > 0 ||
    secondaryStats.length > 0;

  const profileUrl = hasText(data.profileUrl)
    ? data.profileUrl
    : hasText(leetcode?.username)
      ? `https://leetcode.com/u/${leetcode.username}/`
      : null;

  return (
    <IntegrationPanel
      icon={Code2}
      iconClass="bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500"
      title="LeetCode"
      subtitle={
        hasText(leetcode?.username)
          ? leetcode.username
          : "Problem-solving activity"
      }
      state={state}
      errorMessage={error}
      onRetry={onRetry}
      lastSync={leetcode?.lastSync}
      emptyTitle="LeetCode is not connected"
      emptyMessage="Add a LeetCode username to show verified problem-solving stats."
      emptyAction={connectAction}
    >
      <div className="min-w-0 space-y-5">
        {hasNumber(data.totalSolved) ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-4xl font-bold leading-none text-slate-900 tabular-nums dark:text-slate-50">
              {formatNumber(data.totalSolved)}
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
              Problems solved
            </p>
          </div>
        ) : null}

        {difficulties.length > 0 ? (
          <div className="min-w-0">
            <PanelSectionTitle icon={BarChart3}>
              Difficulty breakdown
            </PanelSectionTitle>
            <div className="mt-3 space-y-3.5">
              {difficulties.map((d) => (
                <ProgressRow
                  key={d.key}
                  label={d.label}
                  count={formatNumber(d.count)}
                  percentage={denominator > 0 ? (d.count / denominator) * 100 : 0}
                  tone={d.tone}
                />
              ))}
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
              Bars show each difficulty as a share of solved problems.
            </p>
          </div>
        ) : null}

        {secondaryStats.length > 0 ? (
          <div
            className={`grid gap-3 ${
              secondaryStats.length === 1
                ? "grid-cols-1"
                : secondaryStats.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {secondaryStats.map((stat) => (
              <StatTile
                key={stat.key}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>
        ) : null}

        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            <ExternalLink size={16} />
            View LeetCode profile
          </a>
        ) : null}

        {!hasAnyContent ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            LeetCode is connected, but no statistics have been synced yet.
          </p>
        ) : null}
      </div>
    </IntegrationPanel>
  );
};

export default LeetCodePanel;
