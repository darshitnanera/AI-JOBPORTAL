import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import {
  AlertCircle,
  Briefcase,
  Download,
  Inbox,
  RefreshCw,
  User,
} from "lucide-react";

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const STATUSES = [
  "Applied",
  "Reviewing",
  "Shortlisted",
  "Rejected",
  "Accepted",
];

/** Applied=slate, Reviewing=brand, Shortlisted=warning, Accepted=success, Rejected=danger */
const STATUS_SELECT_TONE = {
  Applied:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Reviewing:
    "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300",
  Shortlisted:
    "border-warning-500/30 bg-warning-50 text-warning-700 dark:border-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500",
  Accepted:
    "border-success-500/30 bg-success-50 text-success-700 dark:border-success-500/25 dark:bg-success-500/10 dark:text-success-500",
  Rejected:
    "border-danger-500/30 bg-danger-50 text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500",
};

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const SMALL_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const SELECT =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-56";
const LABEL =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";
const CHECKBOX =
  "h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800";

const TH =
  "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const TD = "px-4 py-3 align-middle text-slate-900 dark:text-slate-100";

const RecruiterApplications = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/recruiter/applications`;
      if (filterStatus) url += `?status=${filterStatus}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      setApplications(data.applications || []);
    } catch {
      setError("We couldn't load applications.");
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

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
    fetchApplications();
  }, [user, authLoading, navigate, fetchApplications]);

  const handleStatusChange = async (applicationId, newStatus) => {
    setActionError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiter/applications/${applicationId}/status`,
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
      setApplications((prev) =>
        prev.map((app) =>
          app.applicationId === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      );
    } catch {
      setActionError("We couldn't update that application's status.");
    }
  };

  const handleSelectApplication = (appId) => {
    setSelectedApplications((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedApplications((prev) =>
      prev.size === applications.length
        ? new Set()
        : new Set(applications.map((app) => app.applicationId))
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkActionStatus || selectedApplications.size === 0) {
      setActionError("Select at least one application and a status.");
      return;
    }
    setActionError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiter/applications/bulk/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationIds: Array.from(selectedApplications),
            status: bulkActionStatus,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to update applications");
      setApplications((prev) =>
        prev.map((app) =>
          selectedApplications.has(app.applicationId)
            ? { ...app, status: bulkActionStatus }
            : app
        )
      );
      setSelectedApplications(new Set());
      setBulkActionStatus("");
    } catch {
      setActionError("We couldn't update the selected applications.");
    }
  };

  const downloadResume = (resumeUrl, candidateName) => {
    if (!resumeUrl) return;
    const link = document.createElement("a");
    link.href = resumeUrl;
    link.download = `${candidateName}-resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const allSelected =
    applications.length > 0 &&
    selectedApplications.size === applications.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Applications
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Review, shortlist and respond to candidates who applied to your
            roles.
          </p>
        </header>

        <div className="space-y-6">
          {/* Controls */}
          <section className={CARD}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <label htmlFor="status-filter" className={LABEL}>
                  Filter by status
                </label>
                <select
                  id="status-filter"
                  className={SELECT}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {selectedApplications.size > 0 && (
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label htmlFor="bulk-status" className={LABEL}>
                      Bulk status change
                    </label>
                    <select
                      id="bulk-status"
                      className={SELECT}
                      value={bulkActionStatus}
                      onChange={(e) => setBulkActionStatus(e.target.value)}
                    >
                      <option value="">Choose a status</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className={PRIMARY_BTN}
                    onClick={handleBulkStatusUpdate}
                  >
                    Apply to {selectedApplications.size} selected
                  </button>
                </div>
              )}
            </div>

            {actionError && (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-danger-500/30 bg-danger-50 p-3 text-sm font-medium text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500">
                <AlertCircle size={18} />
                {actionError}
              </p>
            )}
          </section>

          {/* Table */}
          <section className={CARD}>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, r) => (
                  <div key={r} className="flex gap-4">
                    {Array.from({ length: 5 }).map((__, c) => (
                      <div
                        key={c}
                        className="h-10 flex-1 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:border-danger-500/25 dark:bg-danger-500/10">
                <p className="flex items-center gap-2 text-sm font-medium text-danger-700 dark:text-danger-500">
                  <AlertCircle size={18} />
                  {error}
                </p>
                <button
                  type="button"
                  onClick={fetchApplications}
                  className={SECONDARY_BTN}
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
                <span className="rounded-xl bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Inbox size={22} />
                </span>
                <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  No applications found
                </h2>
                <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                  {filterStatus
                    ? "No applications match this status filter."
                    : "Applications will appear here as candidates apply to your jobs."}
                </p>
                <button
                  type="button"
                  className={`${SECONDARY_BTN} mt-4`}
                  onClick={() =>
                    filterStatus
                      ? setFilterStatus("")
                      : navigate("/recruiter/jobs/create")
                  }
                >
                  {filterStatus ? "Clear filter" : "Post a job"}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className={`${TH} rounded-l-lg`}>
                        <input
                          type="checkbox"
                          className={CHECKBOX}
                          checked={allSelected}
                          onChange={handleSelectAll}
                          aria-label="Select all applications"
                        />
                      </th>
                      <th className={TH}>Candidate</th>
                      <th className={TH}>Job title</th>
                      <th className={TH}>Applied</th>
                      <th className={TH}>Status</th>
                      <th className={`${TH} rounded-r-lg`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {applications.map((app) => (
                      <tr
                        key={app.applicationId}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className={TD}>
                          <input
                            type="checkbox"
                            className={CHECKBOX}
                            checked={selectedApplications.has(app.applicationId)}
                            onChange={() =>
                              handleSelectApplication(app.applicationId)
                            }
                            aria-label={`Select ${app.candidateName}`}
                          />
                        </td>
                        <td className={TD}>
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                              <User size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {app.candidateName || "—"}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {app.candidateEmail || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={TD}>
                          <span className="inline-flex items-center gap-2">
                            <Briefcase
                              size={16}
                              className="shrink-0 text-slate-500 dark:text-slate-400"
                            />
                            {app.jobTitle || "—"}
                          </span>
                        </td>
                        <td className={`${TD} text-slate-600 dark:text-slate-400`}>
                          {formatDate(app.appliedDate)}
                        </td>
                        <td className={TD}>
                          <select
                            aria-label={`Status for ${app.candidateName}`}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                              STATUS_SELECT_TONE[app.status] ||
                              STATUS_SELECT_TONE.Applied
                            }`}
                            value={app.status || "Applied"}
                            onChange={(e) =>
                              handleStatusChange(
                                app.applicationId,
                                e.target.value
                              )
                            }
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={TD}>
                          <div className="flex flex-wrap gap-2">
                            {app.candidateResume && (
                              <button
                                type="button"
                                className={SMALL_BTN}
                                onClick={() =>
                                  downloadResume(
                                    app.candidateResume,
                                    app.candidateName
                                  )
                                }
                              >
                                <Download size={14} />
                                Resume
                              </button>
                            )}
                            <button
                              type="button"
                              className={SMALL_BTN}
                              onClick={() =>
                                navigate(
                                  `/recruiter/applications/${app.applicationId}`
                                )
                              }
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default RecruiterApplications;
