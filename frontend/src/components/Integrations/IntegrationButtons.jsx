import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import axios from "axios";
import {
  Github,
  Linkedin,
  Code2,
  Link2,
  Unlink,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Clock,
} from "lucide-react";
import useIntegrations, { EMPTY_INTEGRATIONS } from "./useIntegrations";
import {
  authHeaders,
  hasNumber,
  hasText,
  formatNumber,
  formatSyncedAt,
  hasSynced,
} from "./integrationHelpers";
import { PanelSkeleton, PanelError } from "./IntegrationPanel";

/* ------------------------------------------------------------------ *
 * Owner-only connect / disconnect UI.                                  *
 *                                                                     *
 * API endpoints and request bodies are IDENTICAL to the previous       *
 * build — this is a visual rebuild only:                               *
 *   GET  /api/integrations/github/auth                                 *
 *   POST /api/integrations/leetcode/connect  { username }              *
 *   POST /api/integrations/linkedin/connect  { profileUrl, headline }  *
 *   POST /api/integrations/disconnect        { platform }              *
 *   GET  /api/integrations/profile                                     *
 *                                                                     *
 * NOTE: the former IntegrationButtons.css was deleted; all styling is  *
 * Tailwind utilities so nothing can outrank a utility class.           *
 * ------------------------------------------------------------------ */

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition " +
  "placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const LABEL_CLASS =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white " +
  "shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";

const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold " +
  "text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const DANGER_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-danger-50 px-5 py-2.5 text-sm font-semibold " +
  "text-danger-700 transition-all hover:bg-danger-500 hover:text-white active:scale-[0.98] disabled:opacity-50 " +
  "dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500 dark:hover:bg-danger-600 dark:hover:text-white";

/* ------------------------------ Modal ----------------------------- */

const ConnectModal = ({ title, description, onClose, onSubmit, submitting, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onClick={onClose}
  >
    <div
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={SECONDARY_BTN}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Link2 size={16} />
                Connect
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);

/* --------------------------- Provider card ------------------------ */

const ProviderCard = ({
  icon: Icon,
  iconClass,
  name,
  tagline,
  connected,
  details,
  lastSync,
  onConnect,
  onDisconnect,
  connectLabel,
  profileUrl,
  busy,
}) => {
  const syncedLabel = formatSyncedAt(lastSync);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
            {name}
          </h3>
          <p className="truncate text-sm text-slate-600 dark:text-slate-400">
            {tagline}
          </p>
        </div>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        {connected ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25">
              <CheckCircle2 size={14} />
              Connected
            </span>

            {details.length > 0 ? (
              <dl className="mt-4 space-y-2">
                {details.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-3"
                  >
                    <dt className="shrink-0 text-sm text-slate-600 dark:text-slate-400">
                      {row.label}
                    </dt>
                    <dd className="min-w-0 break-words text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {syncedLabel ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Clock size={14} />
                Last synced {syncedLabel}
              </p>
            ) : null}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-950/40">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Not connected
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Recruiters won&apos;t see {name} activity on your profile yet.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {connected ? (
          <>
            {hasText(profileUrl) ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={SECONDARY_BTN}
              >
                <ExternalLink size={16} />
                View profile
              </a>
            ) : null}
            <button
              type="button"
              onClick={onDisconnect}
              disabled={busy}
              className={DANGER_BTN}
            >
              <Unlink size={16} />
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={busy}
            className={PRIMARY_BTN}
          >
            <Icon size={16} />
            {connectLabel}
          </button>
        )}
      </div>
    </div>
  );
};

/* --------------------------- Main component ----------------------- */

const IntegrationButtons = forwardRef(function IntegrationButtons(
  {
    integrations: controlledIntegrations,
    loading: controlledLoading,
    error: controlledError,
    onRefresh,
    showHeading = true,
  },
  ref,
) {
  const isControlled = controlledIntegrations !== undefined;

  const internal = useIntegrations({ enabled: !isControlled });

  const integrations = isControlled
    ? controlledIntegrations || EMPTY_INTEGRATIONS
    : internal.integrations;
  const loadError = isControlled ? controlledError || "" : internal.error;
  const isLoading = isControlled ? Boolean(controlledLoading) : internal.loading;
  const refresh = isControlled ? onRefresh : internal.refresh;

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [modal, setModal] = useState(null); // null | "leetcode" | "linkedin"
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinHeadline, setLinkedinHeadline] = useState("");

  /* --- GitHub OAuth — unchanged endpoint & redirect behaviour --- */
  const handleGitHubConnect = useCallback(async () => {
    try {
      setBusy(true);
      setActionError("");
      const response = await axios.get("/api/integrations/github/auth", {
        headers: authHeaders(),
      });
      window.location.href = response.data.authUrl;
    } catch (err) {
      setActionError(
        err?.response?.data?.message || "Failed to initiate GitHub auth",
      );
      setBusy(false);
    }
  }, []);

  const handleLeetcodeConnect = useCallback(async () => {
    if (!leetcodeUsername.trim()) {
      setActionError("Please enter a LeetCode username");
      return;
    }
    try {
      setBusy(true);
      setActionError("");
      await axios.post(
        "/api/integrations/leetcode/connect",
        { username: leetcodeUsername },
        { headers: authHeaders() },
      );
      setModal(null);
      setLeetcodeUsername("");
      await refresh?.();
    } catch (err) {
      setActionError(
        err?.response?.data?.message || "Failed to connect LeetCode",
      );
    } finally {
      setBusy(false);
    }
  }, [leetcodeUsername, refresh]);

  const handleLinkedinConnect = useCallback(async () => {
    if (!linkedinUrl.trim()) {
      setActionError("Please enter a LinkedIn profile URL");
      return;
    }
    try {
      setBusy(true);
      setActionError("");
      await axios.post(
        "/api/integrations/linkedin/connect",
        { profileUrl: linkedinUrl, headline: linkedinHeadline },
        { headers: authHeaders() },
      );
      setModal(null);
      setLinkedinUrl("");
      setLinkedinHeadline("");
      await refresh?.();
    } catch (err) {
      setActionError(
        err?.response?.data?.message || "Failed to connect LinkedIn",
      );
    } finally {
      setBusy(false);
    }
  }, [linkedinUrl, linkedinHeadline, refresh]);

  const handleDisconnect = useCallback(
    async (platform) => {
      if (
        !window.confirm(`Are you sure you want to disconnect ${platform}?`)
      ) {
        return;
      }
      try {
        setBusy(true);
        setActionError("");
        await axios.post(
          "/api/integrations/disconnect",
          { platform },
          { headers: authHeaders() },
        );
        await refresh?.();
      } catch (err) {
        setActionError(
          err?.response?.data?.message || "Failed to disconnect integration",
        );
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  /* Let a parent (the profile page) trigger the connect flows. */
  useImperativeHandle(
    ref,
    () => ({
      connectGithub: handleGitHubConnect,
      openLeetcode: () => setModal("leetcode"),
      openLinkedin: () => setModal("linkedin"),
    }),
    [handleGitHubConnect],
  );

  const github = integrations?.github || {};
  const leetcode = integrations?.leetcode || {};
  const linkedin = integrations?.linkedin || {};

  /* Detail rows — every value gated, never a `|| 0` placeholder. */
  const githubDetails = [
    hasText(github.username) && {
      label: "Username",
      value: `@${github.username}`,
    },
    // Counters default to 0 the moment an account is linked, so only show
    // them once a real sync has populated them.
    hasSynced(github) && hasNumber(github.data?.followers) && {
      label: "Followers",
      value: formatNumber(github.data.followers),
    },
    hasSynced(github) && hasNumber(github.data?.publicRepos) && {
      label: "Public repos",
      value: formatNumber(github.data.publicRepos),
    },
  ].filter(Boolean);

  const leetcodeDetails = [
    hasText(leetcode.username) && {
      label: "Username",
      value: leetcode.username,
    },
    hasNumber(leetcode.data?.totalSolved) && {
      label: "Problems solved",
      value: formatNumber(leetcode.data.totalSolved),
    },
    hasNumber(leetcode.data?.rating) &&
      leetcode.data.rating > 0 && {
        label: "Contest rating",
        value: formatNumber(Math.round(leetcode.data.rating)),
      },
  ].filter(Boolean);

  const linkedinDetails = [
    hasText(linkedin.headline) && {
      label: "Headline",
      value: linkedin.headline,
    },
  ].filter(Boolean);

  return (
    <section className="min-w-0 space-y-6">
      {showHeading ? (
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Connected accounts
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Link GitHub, LeetCode and LinkedIn so recruiters see verified
            activity on your profile.
          </p>
        </div>
      ) : null}

      {actionError ? (
        <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:border-danger-500/25 dark:bg-danger-500/10">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-danger-600 dark:text-danger-500"
          />
          <p className="min-w-0 break-words text-sm font-medium text-danger-700 dark:text-danger-500">
            {actionError}
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <PanelSkeleton />
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PanelError message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <ProviderCard
            icon={Github}
            iconClass="bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100"
            name="GitHub"
            tagline="Showcase your code and projects"
            connected={Boolean(github.connected)}
            details={githubDetails}
            lastSync={github.lastSync}
            profileUrl={github.data?.profileUrl}
            connectLabel="Connect GitHub"
            onConnect={handleGitHubConnect}
            onDisconnect={() => handleDisconnect("github")}
            busy={busy}
          />
          <ProviderCard
            icon={Code2}
            iconClass="bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500"
            name="LeetCode"
            tagline="Verify your coding skills"
            connected={Boolean(leetcode.connected)}
            details={leetcodeDetails}
            lastSync={leetcode.lastSync}
            profileUrl={
              hasText(leetcode.username)
                ? `https://leetcode.com/u/${leetcode.username}/`
                : ""
            }
            connectLabel="Connect LeetCode"
            onConnect={() => setModal("leetcode")}
            onDisconnect={() => handleDisconnect("leetcode")}
            busy={busy}
          />
          <ProviderCard
            icon={Linkedin}
            iconClass="bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            name="LinkedIn"
            tagline="Link your professional profile"
            connected={Boolean(linkedin.connected)}
            details={linkedinDetails}
            profileUrl={linkedin.profileUrl}
            connectLabel="Connect LinkedIn"
            onConnect={() => setModal("linkedin")}
            onDisconnect={() => handleDisconnect("linkedin")}
            busy={busy}
          />
        </div>
      )}

      {modal === "leetcode" ? (
        <ConnectModal
          title="Connect LeetCode"
          description="We fetch your public stats using this username."
          onClose={() => setModal(null)}
          onSubmit={handleLeetcodeConnect}
          submitting={busy}
        >
          <div>
            <label htmlFor="leetcode-username" className={LABEL_CLASS}>
              LeetCode username
            </label>
            <input
              id="leetcode-username"
              type="text"
              placeholder="Enter your LeetCode username"
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </ConnectModal>
      ) : null}

      {modal === "linkedin" ? (
        <ConnectModal
          title="Connect LinkedIn"
          description="Paste the full URL of your public LinkedIn profile."
          onClose={() => setModal(null)}
          onSubmit={handleLinkedinConnect}
          submitting={busy}
        >
          <div>
            <label htmlFor="linkedin-url" className={LABEL_CLASS}>
              LinkedIn profile URL
            </label>
            <input
              id="linkedin-url"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="linkedin-headline" className={LABEL_CLASS}>
              LinkedIn headline{" "}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                (optional)
              </span>
            </label>
            <input
              id="linkedin-headline"
              type="text"
              placeholder="Software Engineer at XYZ"
              value={linkedinHeadline}
              onChange={(e) => setLinkedinHeadline(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </ConnectModal>
      ) : null}
    </section>
  );
});

export default IntegrationButtons;
