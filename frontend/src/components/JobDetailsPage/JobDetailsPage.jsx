import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  IndianRupee,
  ListChecks,
  MapPin,
  RotateCcw,
  SearchX,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Toast from "../Common/Toast";
import MatchScore from "../MatchScore/MatchScore";
import { hasScore } from "../MatchScore/hasScore";
import SkillGap from "../SkillGap/SkillGap";
import {
  avatarGradient,
  companyInitial,
  formatJobType,
  formatRelativeDate,
  formatSalary,
  normalizeJob,
} from "../JobCard/jobFormat";
import { apiUrl } from "../../utils/api";

const STORAGE_USER_KEY = "jobportal_user";
const STORAGE_JOBS_KEY = "savedJobs";
const STORAGE_APPLIED_KEY = "appliedJobs";

const getToken = () => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw).token || null : null;
  } catch {
    return null;
  }
};

const readList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const Card = ({ children, className = "" }) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
  >
    {children}
  </section>
);

const SectionHeading = ({ icon: Icon, children }) => (
  <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
    {Icon && <Icon size={20} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />}
    {children}
  </h2>
);

const BulletList = ({ items }) => (
  <ul className="mt-4 space-y-2.5">
    {items.map((item, idx) => (
      <li key={idx} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400"
          aria-hidden="true"
        />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const DetailSkeleton = () => (
  <div className="mx-auto max-w-4xl space-y-6">
    <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-7 w-64 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
    {[1, 2].map((i) => (
      <div
        key={i}
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    ))}
  </div>
);

const JobDetailPage = () => {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoBroken, setLogoBroken] = useState(false);

  const [match, setMatch] = useState(null); // { score, details, skillGaps }
  const [matchLoading, setMatchLoading] = useState(false);

  const [savedJobs, setSavedJobs] = useState(() => readList(STORAGE_JOBS_KEY));
  const [appliedJobs, setAppliedJobs] = useState(() => readList(STORAGE_APPLIED_KEY));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  /* ── Job ───────────────────────────────────────────────────────────────── */

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/job/${id}`));
      const data = await res.json();
      if (!res.ok || !data.success || !data.job) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }
      setJob(normalizeJob(data.job));
      setLogoBroken(false);
    } catch (err) {
      console.error("Error fetching job details:", err);
      setJob(null);
      setError(
        err?.message === "Failed to fetch"
          ? "The server didn't respond. Check your connection and try again."
          : err?.message || "Something went wrong while loading this job.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchJob();
  }, [id, fetchJob]);

  /* ── AI match for THIS job ─────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    const fetchMatch = async () => {
      const token = getToken();
      if (!token || !id) {
        setMatch(null);
        return;
      }
      setMatchLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/job-match/${id}/match`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success && data.match) {
          setMatch({
            score: data.match.score ?? data.match.details?.matchScore ?? null,
            details: data.match.details || null,
            skillGaps: data.match.skillGaps || null,
          });
        } else {
          setMatch(null);
        }
      } catch {
        if (!cancelled) setMatch(null);
      } finally {
        if (!cancelled) setMatchLoading(false);
      }
    };
    fetchMatch();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ── Applied state ─────────────────────────────────────────────────────── */

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/application/user"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) return;
        const ids = (data.applications || [])
          .map((app) => app.job?._id || app.job)
          .filter(Boolean)
          .map(String);
        setAppliedJobs(ids);
        localStorage.setItem(STORAGE_APPLIED_KEY, JSON.stringify(ids));
      } catch (err) {
        console.error("Error fetching applied jobs:", err);
      }
    })();
  }, []);

  /* ── Actions ───────────────────────────────────────────────────────────── */

  const toggleSaveJob = async () => {
    if (!job) return;
    const token = getToken();
    if (!token) {
      setToast({ show: true, message: "Please login to save this job.", type: "error" });
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/saved/job/${job.id}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const ids = (data.savedJobs || []).map(String);
        setSavedJobs(ids);
        localStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(ids));
      } else {
        setToast({ show: true, message: data.message || "Failed to save job.", type: "error" });
      }
    } catch (err) {
      console.error("Error saving job:", err);
      setToast({ show: true, message: "An error occurred while saving.", type: "error" });
    }
  };

  const openConfirm = async () => {
    if (!job || appliedJobs.includes(String(job.id))) return;
    const token = getToken();
    if (!token) {
      setToast({ show: true, message: "Please login to apply.", type: "error" });
      return;
    }
    try {
      const res = await fetch(apiUrl("/api/user/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && (!data.user?.phone || !data.user?.resume)) {
        setToast({
          show: true,
          message: "Please complete your profile (add phone and resume) before applying.",
          type: "error",
        });
        return;
      }
    } catch (err) {
      console.error("Error checking profile:", err);
    }
    setConfirmOpen(true);
  };

  const confirmApply = async () => {
    const token = getToken();
    if (!job || !token) {
      setConfirmOpen(false);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/application/apply/${job.id}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const alreadyApplied = data.message === "You have already applied for this job";
      if (data.success || alreadyApplied) {
        setAppliedJobs((prev) => {
          const next = prev.includes(String(job.id)) ? prev : [...prev, String(job.id)];
          try {
            localStorage.setItem(STORAGE_APPLIED_KEY, JSON.stringify(next));
          } catch {
            /* storage unavailable */
          }
          return next;
        });
      }
      setToast({
        show: true,
        message: data.success
          ? "Application submitted successfully!"
          : data.message || "Failed to submit application.",
        type: data.success ? "success" : "error",
      });
    } catch (err) {
      console.error("Error applying for job:", err);
      setToast({ show: true, message: "An error occurred while applying.", type: "error" });
    } finally {
      setConfirmOpen(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  if (loading) return <DetailSkeleton />;

  if (error || !job) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            {error ? (
              <AlertTriangle size={24} className="text-danger-600" aria-hidden="true" />
            ) : (
              <SearchX size={24} className="text-slate-500" aria-hidden="true" />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {error ? "We couldn't load this job" : "Job not found"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            {error || "This posting doesn't exist any more, or the link is out of date."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {error && (
              <button
                type="button"
                onClick={fetchJob}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Try again
              </button>
            )}
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Browse all jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSaved = savedJobs.includes(String(job.id));
  const isApplied = appliedJobs.includes(String(job.id));
  const showLogo = job.logo && !logoBroken;
  const salary = formatSalary(job.salary, job.salaryType);
  const posted = formatRelativeDate(job.datePosted);

  const facts = [
    job.location && { icon: MapPin, label: "Location", value: job.location },
    job.jobType && { icon: BriefcaseBusiness, label: "Job type", value: formatJobType(job.jobType) },
    job.experience && { icon: UserRound, label: "Experience", value: job.experience },
    salary && { icon: IndianRupee, label: "Salary", value: salary },
    job.openings && {
      icon: Users,
      label: "Openings",
      value: `${job.openings} position${job.openings > 1 ? "s" : ""}`,
    },
  ].filter(Boolean);

  const matchingSkills = match?.details?.skillMatch?.matchingSkills || [];
  const hasSkillAnalysis =
    match && (matchingSkills.length > 0 || (match.skillGaps?.missingSkills || []).length > 0);

  const applyButton = (extra = "") => (
    <button
      type="button"
      onClick={openConfirm}
      disabled={isApplied}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all ${extra} ${
        isApplied
          ? "cursor-default bg-success-50 text-success-700 ring-1 ring-success-600/20 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25"
          : "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
      }`}
    >
      {isApplied ? (
        <>
          <CheckCircle2 size={18} aria-hidden="true" />
          Applied
        </>
      ) : (
        <>
          Apply Now
          <ExternalLink size={18} aria-hidden="true" />
        </>
      )}
    </button>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to job search
      </Link>

      {/* 1. Company + role header */}
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 ${
              showLogo ? "bg-white dark:bg-slate-800" : `bg-linear-to-br ${avatarGradient(job.company)}`
            }`}
          >
            {showLogo ? (
              <img
                src={job.logo}
                alt=""
                className="h-full w-full object-contain"
                onError={() => setLogoBroken(true)}
              />
            ) : (
              <span className="text-2xl font-bold text-white">{companyInitial(job.company)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{job.company}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              {job.role}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {job.category && (
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
                  {job.category}
                </span>
              )}
              {posted && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CalendarDays size={14} aria-hidden="true" />
                  {posted}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSaveJob}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Unsave job" : "Save job"}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all ${
              isSaved
                ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        {facts.length > 0 && (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact) => {
              const Icon = fact.icon;
              return (
                <div
                  key={fact.label}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <Icon
                    size={18}
                    className="shrink-0 text-brand-600 dark:text-brand-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {fact.label}
                    </dt>
                    <dd className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {fact.value}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        )}

        <div className="mt-6">{applyButton("w-full sm:w-auto")}</div>
      </Card>

      {/* 2. AI match score — rendered only when the API returned one */}
      {matchLoading ? (
        <Card>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </Card>
      ) : hasScore(match?.score) ? (
        <Card>
          <SectionHeading icon={Sparkles}>AI Match Score</SectionHeading>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            How your parsed resume compares against this specific role.
          </p>
          <div className="mt-5">
            <MatchScore
              score={match.score}
              size="large"
              showDetails
              details={match.details}
            />
          </div>
        </Card>
      ) : null}

      {/* 3. Matching & missing skills for THIS job */}
      {hasSkillAnalysis && (
        <div className="space-y-4">
          <div>
            <SectionHeading icon={ListChecks}>Your Skill Fit</SectionHeading>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Matching skills are shown in green, missing skills in amber — both computed against
              this job's requirements.
            </p>
          </div>
          <SkillGap skillGaps={match.skillGaps} matchingSkills={matchingSkills} />
        </div>
      )}

      {/* 4. Full description */}
      {job.overview && (
        <Card>
          <SectionHeading>About this role</SectionHeading>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {job.overview}
          </p>
        </Card>
      )}

      {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
        <Card>
          <SectionHeading>Responsibilities</SectionHeading>
          <BulletList items={job.responsibilities} />
        </Card>
      )}

      {/* 5. Requirements */}
      {Array.isArray(job.jobCriteria) && job.jobCriteria.length > 0 && (
        <Card>
          <SectionHeading icon={ListChecks}>Requirements</SectionHeading>
          <BulletList items={job.jobCriteria} />
        </Card>
      )}

      {job.techStack.length > 0 && (
        <Card>
          <SectionHeading>Required skills</SectionHeading>
          <ul className="mt-4 flex flex-wrap gap-2">
            {job.techStack.map((tech) => (
              <li
                key={tech}
                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
              >
                {tech}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {job.education && (Array.isArray(job.education) ? job.education.length > 0 : true) && (
        <Card>
          <SectionHeading icon={GraduationCap}>Education</SectionHeading>
          {Array.isArray(job.education) ? (
            <BulletList items={job.education} />
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {job.education}
            </p>
          )}
        </Card>
      )}

      {/* 6. Prominent apply */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {isApplied ? "You've applied to this role" : `Ready to join ${job.company}?`}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {isApplied
              ? "Track this application from your dashboard."
              : "Your saved profile and resume are sent with the application."}
          </p>
        </div>
        {applyButton()}
      </Card>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Confirm application"
          className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:right-6 sm:left-auto"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Confirm application
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Apply for <span className="font-semibold">{job.role}</span> at{" "}
                <span className="font-semibold">{job.company}</span>?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              aria-label="Close"
              className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={confirmApply}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98]"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      )}
    </div>
  );
};

export default JobDetailPage;
