import React from "react";
import {
  Github,
  Users,
  UserPlus,
  BookMarked,
  Star,
  GitCommit,
  GitPullRequest,
  ExternalLink,
  Code2,
  Activity,
} from "lucide-react";
import IntegrationPanel, {
  StatTile,
  PanelSectionTitle,
} from "./IntegrationPanel";
import {
  hasNumber,
  hasSynced,
  hasText,
  hasItems,
  formatNumber,
  toLanguageSegments,
} from "./integrationHelpers";

/* ------------------------------------------------------------------ *
 * GitHub panel.                                                       *
 *                                                                     *
 * Every number below is gated by `hasNumber` / `hasText` / `hasItems`. *
 * There is deliberately NOT a single `|| 0` fallback in this file:     *
 * a stat the API did not return is simply not rendered.                *
 * ------------------------------------------------------------------ */

const LanguageBreakdown = ({ segments }) => {
  const total = segments.reduce((sum, s) => sum + s.percentage, 0);
  if (total <= 0) return null;

  return (
    <div className="min-w-0">
      <PanelSectionTitle icon={Code2}>Language breakdown</PanelSectionTitle>

      {/* Single proportional bar — segments share one track. */}
      <div
        className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="img"
        aria-label={segments
          .map((s) => `${s.name} ${Math.round(s.percentage)}%`)
          .join(", ")}
      >
        {segments.map((seg) => (
          <div
            key={seg.name}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(seg.percentage / total) * 100}%`,
              backgroundColor: seg.color,
            }}
            title={`${seg.name} · ${Math.round(seg.percentage)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((seg) => (
          <li key={seg.name} className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-slate-900/10 dark:ring-white/10"
              style={{ backgroundColor: seg.color }}
            />
            <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              {seg.name}
            </span>
            <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {Math.round(seg.percentage)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TopRepositories = ({ repos }) => (
  <div className="min-w-0">
    <PanelSectionTitle icon={BookMarked}>Top repositories</PanelSectionTitle>
    <ul className="mt-2.5 space-y-2">
      {repos.slice(0, 4).map((repo, idx) => (
        <li key={repo.url || repo.name || idx} className="min-w-0">
          <a
            href={hasText(repo.url) ? repo.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="block min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/60 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-semibold text-brand-700 dark:text-brand-300">
                {repo.name}
              </span>
              {hasNumber(repo.stars) ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-600 tabular-nums dark:text-slate-400">
                  <Star size={13} />
                  {formatNumber(repo.stars)}
                </span>
              ) : null}
            </div>

            {hasText(repo.description) ? (
              <p className="mt-1 line-clamp-2 break-words text-xs text-slate-600 dark:text-slate-400">
                {repo.description}
              </p>
            ) : null}

            {hasText(repo.language) ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                {repo.language}
              </span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const ActivityRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
    <span className="flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
    <span className="shrink-0 text-sm font-bold text-slate-900 tabular-nums dark:text-slate-100">
      {formatNumber(value)}
    </span>
  </div>
);

const GitHubPanel = ({
  github,
  loading = false,
  error = "",
  onRetry,
  connectAction,
}) => {
  const state = loading
    ? "loading"
    : error
      ? "error"
      : github?.connected
        ? "connected"
        : "disconnected";

  const data = github?.data || {};
  // Never-synced accounts carry schema-default zeros; treat them as absent.
  const synced = hasSynced(github);
  const segments = toLanguageSegments(data.languages);
  const commits = data.commits || {};
  /* Pull-request data is optional in the API payload — rendered only if sent. */
  const pulls = data.pullRequests || data.pullRequestsSummary || {};

  const stats = !synced ? [] : [
    hasNumber(data.followers) && {
      key: "followers",
      icon: Users,
      label: "Followers",
      value: formatNumber(data.followers),
    },
    hasNumber(data.following) && {
      key: "following",
      icon: UserPlus,
      label: "Following",
      value: formatNumber(data.following),
    },
    hasNumber(data.publicRepos) && {
      key: "repos",
      icon: BookMarked,
      label: "Public repos",
      value: formatNumber(data.publicRepos),
    },
  ].filter(Boolean);

  const activity = !synced ? [] : [
    hasNumber(commits.last30Days) && {
      key: "commits30",
      icon: GitCommit,
      label: "Commits (last 30 days)",
      value: commits.last30Days,
    },
    hasNumber(commits.total) && {
      key: "commitsTotal",
      icon: GitCommit,
      label: "Total commits",
      value: commits.total,
    },
    hasNumber(pulls.last30Days) && {
      key: "prs30",
      icon: GitPullRequest,
      label: "Pull requests (last 30 days)",
      value: pulls.last30Days,
    },
    hasNumber(pulls.open) && {
      key: "prsOpen",
      icon: GitPullRequest,
      label: "Open pull requests",
      value: pulls.open,
    },
    hasNumber(pulls.merged) && {
      key: "prsMerged",
      icon: GitPullRequest,
      label: "Merged pull requests",
      value: pulls.merged,
    },
    hasNumber(pulls.total) && {
      key: "prsTotal",
      icon: GitPullRequest,
      label: "Total pull requests",
      value: pulls.total,
    },
  ].filter(Boolean);

  const hasAnyContent =
    stats.length > 0 ||
    activity.length > 0 ||
    segments.length > 0 ||
    hasItems(data.topRepos);

  return (
    <IntegrationPanel
      icon={Github}
      iconClass="bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100"
      title="GitHub"
      subtitle={hasText(github?.username) ? `@${github.username}` : "Code activity"}
      state={state}
      errorMessage={error}
      onRetry={onRetry}
      lastSync={github?.lastSync}
      emptyTitle="GitHub is not connected"
      emptyMessage="Connect GitHub to surface repositories, languages and commit activity."
      emptyAction={connectAction}
    >
      <div className="min-w-0 space-y-5">
        {hasText(data.profileUrl) ? (
          <a
            href={data.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            <ExternalLink size={16} />
            View GitHub profile
          </a>
        ) : null}

        {stats.length > 0 ? (
          <div
            className={`grid gap-3 ${
              stats.length === 1
                ? "grid-cols-1"
                : stats.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {stats.map((stat) => (
              <StatTile
                key={stat.key}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>
        ) : null}

        {segments.length > 0 ? <LanguageBreakdown segments={segments} /> : null}

        {hasItems(data.topRepos) ? (
          <TopRepositories repos={data.topRepos} />
        ) : null}

        {activity.length > 0 ? (
          <div className="min-w-0">
            <PanelSectionTitle icon={Activity}>Recent activity</PanelSectionTitle>
            <div className="mt-2.5 space-y-2">
              {activity.map((row) => (
                <ActivityRow
                  key={row.key}
                  icon={row.icon}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!hasAnyContent ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            GitHub is connected, but no activity data has been synced yet.
          </p>
        ) : null}
      </div>
    </IntegrationPanel>
  );
};

export default GitHubPanel;
