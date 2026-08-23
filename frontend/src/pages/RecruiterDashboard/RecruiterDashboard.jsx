import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const BADGE_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

const STATUS_TONE = {
  Applied:
    "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  Reviewing:
    "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
  Shortlisted:
    "bg-warning-50 text-warning-700 ring-warning-500/30 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25",
  Accepted:
    "bg-success-50 text-success-700 ring-success-500/30 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25",
  Rejected:
    "bg-danger-50 text-danger-700 ring-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/25",
};

const StatusBadge = ({ status }) => (
  <span className={`${BADGE_BASE} ${STATUS_TONE[status] || STATUS_TONE.Applied}`}>
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

const StatCard = ({ label, value, icon, tone = "brand" }) => {
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
const LINK_BTN =
  "inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300";

const StatCardSkeleton = () => (
  <div className={`${CARD} space-y-3`}>
    <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
  </div>
);

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [appsError, setAppsError] = useState("");

  const fetchDashboardData = useCallback(async () => {
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

    const [statsRes, appsRes] = await Promise.allSettled([
      load(`${base}/api/recruiter/dashboard/stats`),
      load(`${base}/api/recruiter/dashboard/recent-applications?limit=5`),
    ]);

    setStats(statsRes.status === "fulfilled" ? statsRes.value.stats || null : null);
    setStatsError(
      statsRes.status === "fulfilled"
        ? ""
        : "We couldn't load your dashboard stats."
    );

    setRecentApplications(
      appsRes.status === "fulfilled" ? appsRes.value.applications || [] : []
    );
    setAppsError(
      appsRes.status === "fulfilled"
        ? ""
        : "We couldn't load recent applications."
    );

    setLoading(false);
  }, [token]);

  const retry = () => {
    setLoading(true);
    fetchDashboardData();
  };

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
    fetchDashboardData();
  }, [user, authLoading, navigate, fetchDashboardData]);

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

  const quickActions = [
    {
      label: "Post a job",
      body: "Publish a new opening to the job board.",
      icon: Plus,
      onClick: () => navigate("/recruiter/jobs/create"),
    },
    {
      label: "View applications",
      body: "Review, shortlist and respond to candidates.",
      icon: Users,
      onClick: () => navigate("/recruiter/applications"),
    },
    {
      label: "Manage jobs",
      body: "Edit, close or track your existing postings.",
      icon: Briefcase,
      onClick: () => navigate("/recruiter/jobs"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {user?.recruiterProfile?.companyName
                ? `${user.recruiterProfile.companyName} — hiring overview`
                : "Your hiring overview at a glance."}
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
          {/* Stats */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : statsError ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-danger-500/30 bg-danger-50 p-6 dark:border-danger-500/25 dark:bg-danger-500/10">
              <p className="flex items-center gap-2 text-sm font-medium text-danger-700 dark:text-danger-500">
                <AlertCircle size={18} />
                {statsError}
              </p>
              <button
                type="button"
                onClick={retry}
                className={SECONDARY_BTN}
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Posted jobs"
                value={stats?.postedJobsCount ?? 0}
                icon={Briefcase}
                tone="brand"
              />
              <StatCard
                label="Total applications"
                value={stats?.totalApplications ?? 0}
                icon={Users}
                tone="accent"
              />
              <StatCard
                label="Pending review"
                value={stats?.activeApplicationsCount ?? 0}
                icon={Clock}
                tone="warning"
              />
              <StatCard
                label="Shortlisted"
                value={stats?.shortlistedCount ?? 0}
                icon={CheckCircle}
                tone="success"
              />
            </div>
          )}

          {/* Recent applications */}
          <section className={CARD}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Recent applications
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  The latest candidates who applied to your roles.
                </p>
              </div>
              <button
                type="button"
                className={LINK_BTN}
                onClick={() => navigate("/recruiter/applications")}
              >
                View all
                <ArrowRight size={16} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="w-full space-y-2">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : appsError ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:border-danger-500/25 dark:bg-danger-500/10">
                <p className="flex items-center gap-2 text-sm font-medium text-danger-700 dark:text-danger-500">
                  <AlertCircle size={18} />
                  {appsError}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className={SECONDARY_BTN}
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-700">
                <span className="rounded-xl bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Users size={20} />
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                  No applications yet
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                  Post a job to start receiving applications from candidates.
                </p>
                <button
                  type="button"
                  className={`${PRIMARY_BTN} mt-4`}
                  onClick={() => navigate("/recruiter/jobs/create")}
                >
                  <Plus size={16} />
                  Post a job
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="rounded-l-lg px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Candidate
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Job
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Applied
                      </th>
                      <th className="rounded-r-lg px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {recentApplications.map((app) => (
                      <tr
                        key={app.applicationId}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {app.candidateName || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                          {app.jobTitle || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {formatDate(app.appliedDate) || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section className={CARD}>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Jump straight to what you do most.
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const { label, body, onClick } = action;
                return (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:hover:border-brand-500/40"
                >
                  <span className="shrink-0 rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900 dark:text-slate-50">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
                      {body}
                    </span>
                  </span>
                </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RecruiterDashboard;
