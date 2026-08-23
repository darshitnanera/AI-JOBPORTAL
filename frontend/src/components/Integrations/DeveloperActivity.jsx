import React from "react";
import { Link2, Activity } from "lucide-react";
import GitHubPanel from "./GitHubPanel";
import LeetCodePanel from "./LeetCodePanel";
import LinkedInPanel from "./LinkedInPanel";
import { PanelSkeleton, PanelError, PanelEmpty } from "./IntegrationPanel";

/* ------------------------------------------------------------------ *
 * Developer activity — GitHub / LeetCode / LinkedIn.                   *
 *                                                                     *
 * Renders the three panels side by side. Each panel owns its own       *
 * connected / disconnected state; a platform that is not connected     *
 * shows a "Not connected" empty state (plus a connect CTA for the      *
 * profile owner) rather than any placeholder statistic.                *
 * ------------------------------------------------------------------ */

const ConnectCta = ({ label, onClick }) =>
  onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
    >
      <Link2 size={16} />
      {label}
    </button>
  ) : null;

const DeveloperActivity = ({
  integrations,
  loading = false,
  error = "",
  onRetry,
  /** Owner-only: callbacks that open the connect flows. Omitted for recruiters. */
  onConnectGithub,
  onConnectLeetcode,
  onConnectLinkedin,
  title = "Developer activity",
  description = "Verified signals pulled straight from the connected platforms.",
  headerAction,
}) => {
  const github = integrations?.github;
  const leetcode = integrations?.leetcode;
  const linkedin = integrations?.linkedin;

  const nothingConnected =
    !loading &&
    !error &&
    !github?.connected &&
    !leetcode?.connected &&
    !linkedin?.connected;

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
        {headerAction}
      </div>

      {loading ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <PanelSkeleton />
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      ) : error ? (
        /* The integrations request itself failed — one error card, one retry. */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PanelError message={error} onRetry={onRetry} />
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <GitHubPanel
            github={github}
            connectAction={
              <ConnectCta label="Connect GitHub" onClick={onConnectGithub} />
            }
          />
          <LeetCodePanel
            leetcode={leetcode}
            connectAction={
              <ConnectCta label="Connect LeetCode" onClick={onConnectLeetcode} />
            }
          />
          <LinkedInPanel
            linkedin={linkedin}
            connectAction={
              <ConnectCta label="Connect LinkedIn" onClick={onConnectLinkedin} />
            }
          />
        </div>
      )}

      {nothingConnected ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PanelEmpty
            icon={Activity}
            title="No developer platforms connected"
            message={
              onConnectGithub
                ? "Connect GitHub, LeetCode or LinkedIn to show verified activity to recruiters."
                : "This candidate has not connected GitHub, LeetCode or LinkedIn yet."
            }
          />
        </div>
      ) : null}
    </section>
  );
};

export default DeveloperActivity;
