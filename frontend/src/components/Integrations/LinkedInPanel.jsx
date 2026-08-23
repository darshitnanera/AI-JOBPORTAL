import React from "react";
import { Linkedin, ExternalLink, Users, BadgeCheck } from "lucide-react";
import IntegrationPanel, { StatTile } from "./IntegrationPanel";
import { hasNumber, hasText, formatNumber } from "./integrationHelpers";

/* ------------------------------------------------------------------ *
 * LinkedIn panel.                                                     *
 *                                                                     *
 * The backend stores only profileUrl / headline / profileVerified.    *
 * Follower counts are rendered ONLY if a payload actually carries one  *
 * — there is no fallback value.                                       *
 * ------------------------------------------------------------------ */

const LinkedInPanel = ({
  linkedin,
  loading = false,
  error = "",
  onRetry,
  connectAction,
}) => {
  const state = loading
    ? "loading"
    : error
      ? "error"
      : linkedin?.connected
        ? "connected"
        : "disconnected";

  const data = linkedin?.data || {};
  const followers = hasNumber(linkedin?.followers)
    ? linkedin.followers
    : hasNumber(data.followers)
      ? data.followers
      : null;
  const connections = hasNumber(linkedin?.connections)
    ? linkedin.connections
    : hasNumber(data.connections)
      ? data.connections
      : null;

  const headline = hasText(linkedin?.headline)
    ? linkedin.headline
    : hasText(data.headline)
      ? data.headline
      : null;

  const profileUrl = hasText(linkedin?.profileUrl)
    ? linkedin.profileUrl
    : hasText(data.profileUrl)
      ? data.profileUrl
      : null;

  const hasAnyContent =
    Boolean(headline) || Boolean(profileUrl) || followers !== null || connections !== null;

  return (
    <IntegrationPanel
      icon={Linkedin}
      iconClass="bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
      title="LinkedIn"
      subtitle="Professional profile"
      state={state}
      errorMessage={error}
      onRetry={onRetry}
      lastSync={linkedin?.lastSync}
      emptyTitle="LinkedIn is not connected"
      emptyMessage="Add a LinkedIn profile URL so recruiters can see the professional profile."
      emptyAction={connectAction}
    >
      <div className="min-w-0 space-y-5">
        {linkedin?.profileVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
            <BadgeCheck size={14} />
            Profile URL verified
          </span>
        ) : null}

        {headline ? (
          <blockquote className="rounded-xl border-l-4 border-brand-500 bg-slate-50 px-4 py-3 dark:bg-slate-950/40">
            <p className="break-words text-sm font-medium text-slate-700 dark:text-slate-300">
              {headline}
            </p>
          </blockquote>
        ) : null}

        {followers !== null || connections !== null ? (
          <div
            className={`grid gap-3 ${
              followers !== null && connections !== null
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {followers !== null ? (
              <StatTile
                icon={Users}
                label="Followers"
                value={formatNumber(followers)}
              />
            ) : null}
            {connections !== null ? (
              <StatTile
                icon={Users}
                label="Connections"
                value={formatNumber(connections)}
              />
            ) : null}
          </div>
        ) : null}

        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-2 truncate text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            <ExternalLink size={16} className="shrink-0" />
            <span className="truncate">View LinkedIn profile</span>
          </a>
        ) : null}

        {!hasAnyContent ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            LinkedIn is connected, but no profile details were returned.
          </p>
        ) : null}
      </div>
    </IntegrationPanel>
  );
};

export default LinkedInPanel;
