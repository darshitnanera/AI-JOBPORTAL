import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const BADGE_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const SMALL_BTN =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const DANGER_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-white px-3 py-2 text-sm font-semibold text-danger-600 transition-all hover:bg-danger-50 dark:border-danger-500/30 dark:bg-slate-900 dark:text-danger-500 dark:hover:bg-danger-500/10";
const SELECT =
  "rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const RecruiterJobs = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiter/jobs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch jobs");
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch {
      setError("We couldn't load your job postings.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // AuthContext hydrates from localStorage in an effect, so `user` is
    // null on first render. Redirecting before hydration completes bounced
    // every signed-in recruiter back to /login.
    if (authLoading) return;

    const type = user?.userType || user?.role;
    if (!user || type !== "recruiter") {
      navigate("/login");
      return;
    }
    fetchJobs();
  }, [user, authLoading, navigate, fetchJobs]);

  const deleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    setActionError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiter/jobs/${jobId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to delete job");
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
    } catch {
      setActionError("We couldn't delete that job. Please try again.");
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    setActionError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiter/jobs/${jobId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status");
      setJobs((prev) =>
        prev.map((job) =>
          job._id === jobId ? { ...job, status: newStatus } : job
        )
      );
    } catch {
      setActionError("We couldn't update that job's status.");
    }
  };

  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              My job postings
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Manage and monitor every role you have published.
            </p>
          </div>
          <button
            type="button"
            className={PRIMARY_BTN}
            onClick={() => navigate("/recruiter/jobs/create")}
          >
            <Plus size={18} />
            Post a job
          </button>
        </header>

        <div className="space-y-6">
          {actionError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-500/30 bg-danger-50 p-4 text-sm font-medium text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500">
              <AlertCircle size={18} />
              {actionError}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${CARD} space-y-4`}>
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-16 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-9 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-danger-500/30 bg-danger-50 p-6 dark:border-danger-500/25 dark:bg-danger-500/10">
              <p className="flex items-center gap-2 text-sm font-medium text-danger-700 dark:text-danger-500">
                <AlertCircle size={18} />
                {error}
              </p>
              <button type="button" onClick={fetchJobs} className={SECONDARY_BTN}>
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div
              className={`${CARD} flex flex-col items-center px-6 py-12 text-center`}
            >
              <span className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <Briefcase size={24} />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                No jobs posted yet
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                Publish your first opening and it will appear here with live
                application counts.
              </p>
              <button
                type="button"
                className={`${PRIMARY_BTN} mt-5`}
                onClick={() => navigate("/recruiter/jobs/create")}
              >
                <Plus size={16} />
                Post your first job
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <article
                  key={job._id}
                  className={`${CARD} flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        {job.roleName}
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                        {job.companyName}
                      </p>
                    </div>
                    <select
                      aria-label={`Status for ${job.roleName}`}
                      className={SELECT}
                      value={job.status || "active"}
                      onChange={(e) => updateJobStatus(job._id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.jobType && (
                      <span
                        className={`${BADGE_BASE} bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25`}
                      >
                        <Briefcase size={12} />
                        {job.jobType}
                      </span>
                    )}
                    {job.location && (
                      <span
                        className={`${BADGE_BASE} bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700`}
                      >
                        <MapPin size={12} />
                        {job.location}
                      </span>
                    )}
                    {job.salary != null && (
                      <span
                        className={`${BADGE_BASE} bg-success-50 text-success-700 ring-success-500/30 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25`}
                      >
                        <Wallet size={12} />
                        {Number(job.salary).toLocaleString()}
                        {job.salaryType || ""}
                      </span>
                    )}
                  </div>

                  {job.overview && (
                    <p className="mt-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                      {job.overview}
                    </p>
                  )}

                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>
                        {job.applicantsCount ?? 0}{" "}
                        {job.applicantsCount === 1 ? "application" : "applications"}
                      </span>
                    </div>
                    {formatDate(job.createdAt) && (
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        <span>Posted {formatDate(job.createdAt)}</span>
                      </div>
                    )}
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      className={SMALL_BTN}
                      onClick={() =>
                        navigate(`/recruiter/applications?jobId=${job._id}`)
                      }
                    >
                      <Users size={16} />
                      Applications
                    </button>
                    <button
                      type="button"
                      className={DANGER_BTN}
                      onClick={() => deleteJob(job._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecruiterJobs;
