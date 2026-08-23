import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CheckCircle,
  FileText,
  Inbox,
  RefreshCw,
  Users,
} from "lucide-react";

/* ── Shared style atoms ───────────────────────────────────────────────── */
const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const BADGE_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

const TONE = {
  slate:
    "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  brand:
    "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
  warning:
    "bg-warning-50 text-warning-700 ring-warning-500/30 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25",
  success:
    "bg-success-50 text-success-700 ring-success-500/30 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25",
  danger:
    "bg-danger-50 text-danger-700 ring-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/25",
  accent:
    "bg-accent-500/10 text-accent-600 ring-accent-500/25 dark:text-accent-400",
};

/** Applied=slate, Reviewing=brand, Shortlisted=warning, Accepted=success, Rejected=danger */
const STATUS_TONE = {
  Applied: TONE.slate,
  Reviewing: TONE.brand,
  Shortlisted: TONE.warning,
  Accepted: TONE.success,
  Rejected: TONE.danger,
};

const StatusBadge = ({ status }) => (
  <span className={`${BADGE_BASE} ${STATUS_TONE[status] || TONE.slate}`}>
    {status || "Applied"}
  </span>
);

const CHIP_TONE = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  success:
    "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  accent:
    "bg-accent-500/10 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400",
};

const StatCard = ({ label, value, meta, icon, tone = "brand" }) => {
  const Icon = icon;
  return (
  <div
    className={`${CARD} flex items-start justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
  >
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {meta && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{meta}</p>
      )}
    </div>
    <span className={`shrink-0 rounded-xl p-2.5 ${CHIP_TONE[tone]}`}>
      <Icon size={20} />
    </span>
  </div>
  );
};

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const SMALL_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const DANGER_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger-500/40 bg-white px-3 py-1.5 text-xs font-semibold text-danger-600 transition-all hover:bg-danger-50 dark:border-danger-500/30 dark:bg-slate-900 dark:text-danger-500 dark:hover:bg-danger-500/10";
const SELECT =
  "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const LABEL =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

const TH =
  "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const TD = "px-4 py-3 align-middle text-slate-900 dark:text-slate-100";

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:border-danger-500/25 dark:bg-danger-500/10">
    <p className="flex items-center gap-2 text-sm font-medium text-danger-700 dark:text-danger-500">
      <AlertCircle size={18} />
      {message}
    </p>
    {onRetry && (
      <button type="button" onClick={onRetry} className={SECONDARY_BTN}>
        <RefreshCw size={16} />
        Try again
      </button>
    )}
  </div>
);

const EmptyState = ({ icon = Inbox, title, message }) => {
  const Icon = icon;
  return (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-700">
    <span className="rounded-xl bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      <Icon size={20} />
    </span>
    <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
      {title}
    </h3>
    <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
      {message}
    </p>
  </div>
  );
};

const TableSkeleton = ({ columns = 5, rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4">
        {Array.from({ length: columns }).map((__, c) => (
          <div
            key={c}
            className="h-8 flex-1 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    ))}
  </div>
);

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "jobs", label: "Jobs" },
  { id: "applications", label: "Applications" },
  { id: "analytics", label: "Analytics" },
];

/* ── Page ─────────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [tabError, setTabError] = useState("");

  const [userFilters, setUserFilters] = useState({
    page: 1,
    limit: 10,
    type: "",
    status: "",
  });
  const [jobFilters, setJobFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setStatsError("");
    setTabError("");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const base = import.meta.env.VITE_API_URL;

    const load = async (url) => {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    };

    try {
      const statsData = await load(`${base}/api/admin/stats`);
      setStats(statsData.stats || null);
    } catch {
      setStatsError("We couldn't load platform stats.");
    }

    try {
      if (activeTab === "users") {
        const data = await load(
          `${base}/api/admin/users?page=${userFilters.page}&limit=${userFilters.limit}&type=${userFilters.type}&status=${userFilters.status}`
        );
        setUsers(data.users || []);
      } else if (activeTab === "jobs") {
        const data = await load(
          `${base}/api/admin/jobs?page=${jobFilters.page}&limit=${jobFilters.limit}&status=${jobFilters.status}`
        );
        setJobs(data.jobs || []);
      } else if (activeTab === "applications") {
        const data = await load(
          `${base}/api/admin/applications?page=1&limit=20`
        );
        setApplications(data.applications || []);
      } else if (activeTab === "analytics") {
        const data = await load(`${base}/api/admin/analytics`);
        setAnalytics(data.analytics || null);
      }
    } catch {
      setTabError("We couldn't load this section.");
    }

    setLoading(false);
  }, [token, activeTab, userFilters, jobFilters]);

  useEffect(() => {
    // AuthContext hydrates from localStorage in an effect, so `user` is
    // null on first render. Redirecting before hydration completes bounced
    // every signed-in admin back to /login.
    if (authLoading) return;

    const type = user?.userType || user?.role;
    if (!user || type !== "admin") {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [user, authLoading, navigate, fetchDashboardData]);

  const mutate = async (url, options) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options?.headers || {}),
        },
      });
      if (!res.ok) throw new Error("Request failed");
      fetchDashboardData();
    } catch {
      setTabError("That action failed. Please try again.");
    }
  };

  const base = import.meta.env.VITE_API_URL;

  const handleUserStatusToggle = (userId, currentStatus) =>
    mutate(`${base}/api/admin/users/${userId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !currentStatus }),
    });

  const handleVerifyRecruiter = (userId) =>
    mutate(`${base}/api/admin/users/${userId}/verify-recruiter`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

  const handleDeleteUser = (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    mutate(`${base}/api/admin/users/${userId}`, { method: "DELETE" });
  };

  const handleDeleteJob = (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    mutate(`${base}/api/admin/jobs/${jobId}`, { method: "DELETE" });
  };

  const conversionRate =
    stats?.applications?.total > 0
      ? (
          ((stats.applications.shortlisted + stats.applications.accepted) /
            stats.applications.total) *
          100
        ).toFixed(1)
      : "0.0";

  const sumTrend = (series) =>
    Array.isArray(series) ? series.reduce((sum, t) => sum + (t.count || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Admin dashboard
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Platform management, moderation and analytics.
          </p>
        </header>

        <div className="space-y-6">
          {/* Platform stats */}
          {statsError ? (
            <ErrorState message={statsError} onRetry={fetchDashboardData} />
          ) : loading && !stats ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${CARD} space-y-3`}>
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total users"
                value={stats.users?.total ?? 0}
                meta={`${stats.users?.active ?? 0} active · ${stats.users?.inactive ?? 0} inactive`}
                icon={Users}
                tone="brand"
              />
              <StatCard
                label="Total jobs"
                value={stats.jobs?.total ?? 0}
                meta={`${stats.jobs?.active ?? 0} active · ${stats.jobs?.closed ?? 0} closed`}
                icon={Briefcase}
                tone="accent"
              />
              <StatCard
                label="Applications"
                value={stats.applications?.total ?? 0}
                meta={`${stats.applications?.shortlisted ?? 0} shortlisted`}
                icon={FileText}
                tone="warning"
              />
              <StatCard
                label="Conversion rate"
                value={`${conversionRate}%`}
                meta="Shortlisted + accepted"
                icon={BarChart3}
                tone="success"
              />
            </div>
          ) : null}

          {/* Tab bar */}
          <div className="overflow-x-auto">
            <div
              role="tablist"
              aria-label="Admin sections"
              className="inline-flex min-w-full gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:min-w-0"
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      active
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className={CARD}>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Quick stats
                </h2>
                {loading && !stats ? (
                  <div className="mt-5">
                    <TableSkeleton columns={2} rows={4} />
                  </div>
                ) : !stats ? (
                  <div className="mt-5">
                    <EmptyState
                      title="No stats available"
                      message="Platform statistics will appear here once data is available."
                    />
                  </div>
                ) : (
                  <dl className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
                    {[
                      ["Candidates", stats.users?.candidates],
                      ["Recruiters", stats.users?.recruiters],
                      ["Active jobs", stats.jobs?.active],
                      ["Pending applications", stats.applications?.applied],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <dt className="text-sm text-slate-600 dark:text-slate-400">
                          {label}
                        </dt>
                        <dd className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          {value ?? 0}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>

              <section className={CARD}>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  System health
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Status of the services backing this dashboard.
                </p>
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  {statsError ? (
                    <>
                      <span className="rounded-xl bg-danger-50 p-2.5 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
                        <AlertCircle size={20} />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          Admin API unreachable
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          The last stats request did not succeed.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="rounded-xl bg-success-50 p-2.5 text-success-600 dark:bg-success-500/10 dark:text-success-500">
                        <CheckCircle size={20} />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          Admin API responding
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          The most recent stats request succeeded.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <section className={CARD}>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    User management
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Activate, verify or remove platform accounts.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label htmlFor="user-type" className={LABEL}>
                      Account type
                    </label>
                    <select
                      id="user-type"
                      className={SELECT}
                      value={userFilters.type}
                      onChange={(e) =>
                        setUserFilters({
                          ...userFilters,
                          type: e.target.value,
                          page: 1,
                        })
                      }
                    >
                      <option value="">All types</option>
                      <option value="candidate">Candidates</option>
                      <option value="recruiter">Recruiters</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="user-status" className={LABEL}>
                      Status
                    </label>
                    <select
                      id="user-status"
                      className={SELECT}
                      value={userFilters.status}
                      onChange={(e) =>
                        setUserFilters({
                          ...userFilters,
                          status: e.target.value,
                          page: 1,
                        })
                      }
                    >
                      <option value="">All statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <TableSkeleton columns={5} />
              ) : tabError ? (
                <ErrorState message={tabError} onRetry={fetchDashboardData} />
              ) : users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No users found"
                  message="No accounts match the current filters. Try widening them."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className={`${TH} rounded-l-lg`}>Name</th>
                        <th className={TH}>Email</th>
                        <th className={TH}>Type</th>
                        <th className={TH}>Status</th>
                        <th className={`${TH} rounded-r-lg`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {users.map((u) => (
                        <tr
                          key={u._id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className={`${TD} font-semibold`}>{u.name}</td>
                          <td className={TD}>{u.email}</td>
                          <td className={TD}>
                            <span
                              className={`${BADGE_BASE} ${
                                u.userType === "recruiter"
                                  ? TONE.accent
                                  : TONE.brand
                              }`}
                            >
                              {u.userType}
                            </span>
                          </td>
                          <td className={TD}>
                            <span
                              className={`${BADGE_BASE} ${
                                u.isVerified ? TONE.success : TONE.slate
                              }`}
                            >
                              {u.isVerified ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className={TD}>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={SMALL_BTN}
                                onClick={() =>
                                  handleUserStatusToggle(u._id, u.isVerified)
                                }
                              >
                                {u.isVerified ? "Deactivate" : "Activate"}
                              </button>
                              {u.userType === "recruiter" &&
                                !u.recruiterProfile?.isVerified && (
                                  <button
                                    type="button"
                                    className={SMALL_BTN}
                                    onClick={() => handleVerifyRecruiter(u._id)}
                                  >
                                    Verify
                                  </button>
                                )}
                              <button
                                type="button"
                                className={DANGER_BTN}
                                onClick={() => handleDeleteUser(u._id)}
                              >
                                Delete
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
          )}

          {/* Jobs */}
          {activeTab === "jobs" && (
            <section className={CARD}>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    Job management
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Moderate postings across every recruiter account.
                  </p>
                </div>
                <div>
                  <label htmlFor="job-status" className={LABEL}>
                    Status
                  </label>
                  <select
                    id="job-status"
                    className={SELECT}
                    value={jobFilters.status}
                    onChange={(e) =>
                      setJobFilters({
                        ...jobFilters,
                        status: e.target.value,
                        page: 1,
                      })
                    }
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <TableSkeleton columns={6} />
              ) : tabError ? (
                <ErrorState message={tabError} onRetry={fetchDashboardData} />
              ) : jobs.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No jobs found"
                  message="No postings match the current filter."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className={`${TH} rounded-l-lg`}>Job title</th>
                        <th className={TH}>Company</th>
                        <th className={TH}>Posted by</th>
                        <th className={TH}>Status</th>
                        <th className={TH}>Applications</th>
                        <th className={`${TH} rounded-r-lg`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {jobs.map((job) => (
                        <tr
                          key={job._id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className={`${TD} font-semibold`}>
                            {job.roleName}
                          </td>
                          <td className={TD}>{job.companyName}</td>
                          <td className={TD}>{job.createdBy?.name || "—"}</td>
                          <td className={TD}>
                            <span
                              className={`${BADGE_BASE} ${
                                job.status === "active"
                                  ? TONE.success
                                  : job.status === "closed"
                                    ? TONE.slate
                                    : TONE.warning
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className={TD}>{job.applicationCount ?? 0}</td>
                          <td className={TD}>
                            <button
                              type="button"
                              className={DANGER_BTN}
                              onClick={() => handleDeleteJob(job._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Applications */}
          {activeTab === "applications" && (
            <section className={CARD}>
              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Application management
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  The most recent applications across the platform.
                </p>
              </div>

              {loading ? (
                <TableSkeleton columns={5} />
              ) : tabError ? (
                <ErrorState message={tabError} onRetry={fetchDashboardData} />
              ) : applications.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No applications yet"
                  message="Applications submitted by candidates will be listed here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className={`${TH} rounded-l-lg`}>Candidate</th>
                        <th className={TH}>Job</th>
                        <th className={TH}>Company</th>
                        <th className={TH}>Status</th>
                        <th className={`${TH} rounded-r-lg`}>Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {applications.map((app) => (
                        <tr
                          key={app._id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className={`${TD} font-semibold`}>
                            {app.user?.name || "—"}
                          </td>
                          <td className={TD}>{app.job?.roleName || "—"}</td>
                          <td className={TD}>{app.job?.companyName || "—"}</td>
                          <td className={TD}>
                            <StatusBadge status={app.status} />
                          </td>
                          <td className={TD}>
                            {app.createdAt
                              ? new Date(app.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <section className={CARD}>
              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Platform analytics
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Activity across the last 30 days.
                </p>
              </div>

              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              ) : tabError ? (
                <ErrorState message={tabError} onRetry={fetchDashboardData} />
              ) : !analytics ? (
                <EmptyState
                  icon={BarChart3}
                  title="No analytics available"
                  message="Trend data will appear once the platform records activity."
                />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      label: "Job postings",
                      value: sumTrend(analytics.jobTrends),
                      tone: "brand",
                    },
                    {
                      label: "Applications",
                      value: sumTrend(analytics.applicationTrends),
                      tone: "warning",
                    },
                    {
                      label: "New users",
                      value: sumTrend(analytics.userGrowth),
                      tone: "success",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {item.value}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Last 30 days
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
