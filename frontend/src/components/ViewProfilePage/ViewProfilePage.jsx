import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { AlertCircle, RefreshCw, CheckCircle2, X, Eye } from "lucide-react";

import { apiUrl } from "../../utils/api";
import DeveloperActivity from "../Integrations/DeveloperActivity";
import IntegrationButtons from "../Integrations/IntegrationButtons";
import useIntegrations, {
  EMPTY_INTEGRATIONS,
} from "../Integrations/useIntegrations";
import { authHeaders } from "../Integrations/integrationHelpers";

import ProfileHeaderCard, {
  ProfileHeaderSkeleton,
} from "./ProfileHeaderCard";
import EditProfileModal from "./EditProfileModal";
import {
  PersonalDetailsSection,
  SkillsSection,
  TargetRolesSection,
  EducationSection,
  ProjectsSection,
  CertificationsSection,
  AchievementsSection,
  ResumeSection,
  ContactSection,
  SectionSkeleton,
} from "./ProfileSections";
import { normaliseProfile } from "./profileModel";

/* ------------------------------------------------------------------ *
 * Candidate profile surface.                                          *
 *                                                                     *
 * Two modes:                                                          *
 *  - OWNER      /viewprofile          → GET /api/user/profile          *
 *                                       + GET /api/integrations/profile*
 *  - RECRUITER  /viewprofile?candidateId=<id>                          *
 *                → GET /api/integrations/candidate/:candidateId        *
 *                                                                     *
 * In recruiter mode the developer-activity panels sit directly under   *
 * the header, and every owner-only affordance (edit / connect /        *
 * disconnect) is hidden.                                               *
 * ------------------------------------------------------------------ */

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("jobportal_user")) || null;
  } catch {
    return null;
  }
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === "error";

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div
        role="status"
        className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg ${
          isError
            ? "border-danger-500/30 bg-danger-50 dark:border-danger-500/25 dark:bg-danger-500/10"
            : "border-success-500/30 bg-success-50 dark:border-success-500/25 dark:bg-success-500/10"
        }`}
      >
        {isError ? (
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-danger-600 dark:text-danger-500"
          />
        ) : (
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-success-600 dark:text-success-500"
          />
        )}
        <p className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const PageError = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
      <AlertCircle size={22} />
    </span>
    <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
      We couldn&apos;t load this profile
    </h2>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
      {message || "Something went wrong while contacting the server."}
    </p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    ) : null}
  </div>
);

const ViewProfilePage = () => {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get("candidateId") || searchParams.get("id");

  const viewer = useMemo(readStoredUser, []);
  const viewerId = viewer?._id || viewer?.id || null;
  const isRecruiterView = Boolean(candidateId) && candidateId !== viewerId;

  const [rawUser, setRawUser] = useState(null);
  const [recruiterIntegrations, setRecruiterIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const integrationsRef = useRef(null);

  /* Owner mode fetches its own integrations; recruiter mode gets them
     bundled with the candidate payload. */
  const ownerIntegrations = useIntegrations({ enabled: !isRecruiterView });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isRecruiterView) {
        const response = await axios.get(
          `/api/integrations/candidate/${candidateId}`,
          { headers: authHeaders() },
        );
        setRawUser(response.data?.candidate?.user || null);
        setRecruiterIntegrations(
          response.data?.candidate?.integrations || EMPTY_INTEGRATIONS,
        );
      } else {
        const response = await fetch(apiUrl("/api/user/profile"), {
          headers: authHeaders(),
        });
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Please sign in again to view your profile."
              : `Request failed with status ${response.status}`,
          );
        }
        const data = await response.json();
        setRawUser(data?.user || null);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load this profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [candidateId, isRecruiterView]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const integrations = isRecruiterView
    ? recruiterIntegrations
    : ownerIntegrations.integrations;

  const profile = useMemo(
    () => normaliseProfile(rawUser, integrations),
    [rawUser, integrations],
  );

  /* ------------------------- Actions ------------------------------ */

  const handleDownloadResume = useCallback(() => {
    if (!profile.resume) return;
    const targetId = profile.id;
    const href =
      typeof profile.resume === "string" && /^https?:\/\//i.test(profile.resume)
        ? profile.resume
        : targetId
          ? apiUrl(`/api/user/resume/${targetId}`)
          : null;
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  }, [profile.resume, profile.id]);

  const handleSave = useCallback(
    async (form) => {
      setSaving(true);
      try {
        /* Unchanged request shape: multipart PUT /api/user/profile */
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("email", form.email);
        formData.append("phone", form.phone);
        if (form.resume instanceof File) {
          formData.append("resume", form.resume);
        }

        const response = await fetch(apiUrl("/api/user/profile"), {
          method: "PUT",
          headers: authHeaders(),
          body: formData,
        });
        if (!response.ok) throw new Error("Update failed");

        const data = await response.json();
        setRawUser((prev) => ({ ...(prev || {}), ...(data?.user || {}) }));
        setEditing(false);
        setToast({ message: "Profile updated.", type: "success" });
      } catch (err) {
        setToast({
          message: err?.message || "Update failed",
          type: "error",
        });
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const openEdit = useCallback(() => setEditing(true), []);

  /* Connect CTAs are owner-only — recruiters get no connect affordances. */
  const connectHandlers = isRecruiterView
    ? {}
    : {
        onConnectGithub: () => integrationsRef.current?.connectGithub(),
        onConnectLeetcode: () => integrationsRef.current?.openLeetcode(),
        onConnectLinkedin: () => integrationsRef.current?.openLinkedin(),
      };

  /* --------------------------- Render ----------------------------- */

  if (loading) {
    return (
      <div className="min-w-0 space-y-6">
        <ProfileHeaderSkeleton />
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <SectionSkeleton rows={5} />
            <SectionSkeleton rows={3} />
          </div>
          <div className="min-w-0 space-y-6">
            <SectionSkeleton rows={2} />
            <SectionSkeleton rows={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !rawUser) {
    return (
      <PageError
        message={error || "This profile could not be found."}
        onRetry={loadProfile}
      />
    );
  }

  const developerActivity = (
    <DeveloperActivity
      integrations={integrations}
      loading={!isRecruiterView && ownerIntegrations.loading}
      error={isRecruiterView ? "" : ownerIntegrations.error}
      onRetry={isRecruiterView ? loadProfile : ownerIntegrations.refresh}
      description={
        isRecruiterView
          ? "GitHub, LeetCode and LinkedIn signals for this candidate. Only values returned by the platforms are shown."
          : "What recruiters see from your connected platforms. Only real, synced values are shown."
      }
      {...connectHandlers}
    />
  );

  return (
    <div className="min-w-0 space-y-6">
      {isRecruiterView ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-accent-600 ring-1 ring-accent-500/25 dark:text-accent-400">
          <Eye size={14} />
          Recruiter view — read only
        </p>
      ) : null}

      <ProfileHeaderCard
        profile={profile}
        isRecruiterView={isRecruiterView}
        onEdit={openEdit}
        onDownloadResume={handleDownloadResume}
      />

      {/* Recruiters see developer activity first — right under the header. */}
      {isRecruiterView ? developerActivity : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <PersonalDetailsSection
            profile={profile}
            isRecruiterView={isRecruiterView}
          />
          <EducationSection profile={profile} />
          <ProjectsSection profile={profile} />
          <CertificationsSection profile={profile} />
          <AchievementsSection profile={profile} />
        </div>

        <aside className="min-w-0 space-y-6">
          <SkillsSection
            profile={profile}
            onEdit={isRecruiterView ? null : openEdit}
          />
          <TargetRolesSection
            profile={profile}
            onEdit={isRecruiterView ? null : openEdit}
          />
          <ResumeSection
            profile={profile}
            isRecruiterView={isRecruiterView}
            onDownload={handleDownloadResume}
            onEdit={isRecruiterView ? null : openEdit}
          />
          {!isRecruiterView ? <ContactSection profile={profile} /> : null}
        </aside>
      </div>

      {/* Owner sees developer activity plus the connect UI below the fold. */}
      {!isRecruiterView ? (
        <>
          {developerActivity}
          <IntegrationButtons
            ref={integrationsRef}
            integrations={ownerIntegrations.integrations}
            loading={ownerIntegrations.loading}
            error={ownerIntegrations.error}
            onRefresh={ownerIntegrations.refresh}
          />
        </>
      ) : null}

      {editing ? (
        <EditProfileModal
          initial={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            resume: profile.resume,
          }}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
        />
      ) : null}

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  );
};

export default ViewProfilePage;
