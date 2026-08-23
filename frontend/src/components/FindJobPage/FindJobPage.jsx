import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BadgeIndianRupee,
  Building2,
  BriefcaseBusiness,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import Toast from "../Common/Toast";
import JobCard from "../JobCard/JobCard";
import {
  JOB_CATEGORIES,
  JOB_TYPE_OPTIONS,
  formatJobType,
  normalizeJob,
} from "../JobCard/jobFormat";
import { apiUrl } from "../../utils/api";

const STORAGE_JOBS_KEY = "savedJobs";
const STORAGE_APPLIED_KEY = "appliedJobs";
const STORAGE_USER_KEY = "jobportal_user";
const JOBS_PER_PAGE = 6;

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900 shadow-sm transition " +
  "placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

const LABEL_CLASS =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

const getToken = () => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw).token || null : null;
  } catch {
    return null;
  }
};

/* ── States (design system §6) ───────────────────────────────────────────── */

const JobCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-48 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="mt-5 flex flex-wrap gap-3">
      {[64, 80, 56, 72].map((w, i) => (
        <div
          key={i}
          style={{ width: w }}
          className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {[56, 48, 64].map((w, i) => (
        <div
          key={i}
          style={{ width: w }}
          className="h-6 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
    <div className="mt-6 flex items-center justify-between">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  </div>
);

const EmptyState = ({ onReset, hasQuery }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
      <Search size={24} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
      {hasQuery ? "No jobs match your search" : "No jobs posted yet"}
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
      {hasQuery
        ? "Try broadening your keywords, clearing a filter, or searching a different location."
        : "New opportunities appear here as soon as recruiters publish them. Check back soon."}
    </p>
    {hasQuery && (
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Clear search & filters
      </button>
    )}
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-danger-500/30 bg-danger-50 p-8 text-center dark:border-danger-500/30 dark:bg-danger-500/10">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
      <AlertTriangle size={24} className="text-danger-600" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
      We couldn't load jobs
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
    >
      <RotateCcw size={16} aria-hidden="true" />
      Try again
    </button>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────────── */

const FindJobPage = () => {
  const [searchTerm, setSearchTerm] = useState({
    company: "",
    location: "",
    role: "",
    experience: "",
  });
  const [filters, setFilters] = useState({
    jobType: [],
    minSalary: "",
    maxSalary: "",
    category: [],
  });

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState(null);
  const [matchScores, setMatchScores] = useState({});

  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_JOBS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_APPLIED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [confirm, setConfirm] = useState({ open: false, jobId: null, role: "", company: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const confirmTimerRef = useRef(null);

  /* ── Data fetching ─────────────────────────────────────────────────────── */

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm.company) params.append("companyName", searchTerm.company);
    if (searchTerm.location) params.append("location", searchTerm.location);
    if (searchTerm.role) params.append("roleName", searchTerm.role);
    if (searchTerm.experience) params.append("experience", searchTerm.experience);
    if (filters.jobType.length) params.append("jobType", filters.jobType.join(","));
    if (filters.category.length) params.append("category", filters.category.join(","));
    if (filters.minSalary) params.append("minSalary", filters.minSalary);
    if (filters.maxSalary) params.append("maxSalary", filters.maxSalary);
    return params;
  }, [searchTerm, filters]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/job?${buildParams().toString()}`));
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }
      const mapped = (data.jobs || []).map(normalizeJob);
      setJobs(mapped);

      // Category counts are only meaningful when no category filter narrows
      // the result set — otherwise keep the last known counts.
      if (filters.category.length === 0) {
        const counts = {};
        mapped.forEach((job) => {
          if (job.category) counts[job.category] = (counts[job.category] || 0) + 1;
        });
        setCategoryCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setJobs([]);
      setError(
        err?.message === "Failed to fetch"
          ? "The server didn't respond. Check your connection and try again."
          : err?.message || "Something went wrong while loading jobs.",
      );
    } finally {
      setLoading(false);
    }
  }, [buildParams, filters.category.length]);

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 400);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  // AI match scores — only for authenticated candidates whose resume is parsed.
  // Any failure simply means no badges are shown (never a fabricated score).
  useEffect(() => {
    let cancelled = false;
    const fetchScores = async () => {
      const token = getToken();
      if (!token) {
        setMatchScores({});
        return;
      }
      try {
        const res = await fetch(apiUrl("/api/job-match/search?limit=50"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.success) return;
        const map = {};
        (data.jobs || []).forEach((job) => {
          const id = String(job._id || job.id);
          if (id && Number.isFinite(Number(job.matchScore))) {
            map[id] = Number(job.matchScore);
          }
        });
        setMatchScores(map);
      } catch {
        /* no scores available — render none */
      }
    };
    fetchScores();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const load = async (path, pick, storageKey, setter) => {
      try {
        const res = await fetch(apiUrl(path), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) return;
        const ids = pick(data);
        setter(ids);
        localStorage.setItem(storageKey, JSON.stringify(ids));
      } catch (err) {
        console.error(`Error loading ${path}:`, err);
      }
    };

    load(
      "/api/application/user",
      (d) =>
        (d.applications || [])
          .map((app) => app.job?._id || app.job)
          .filter(Boolean)
          .map(String),
      STORAGE_APPLIED_KEY,
      setAppliedJobs,
    );
    load(
      "/api/saved",
      (d) => (d.savedJobs || []).map((job) => String(job._id || job)),
      STORAGE_JOBS_KEY,
      setSavedJobs,
    );
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_JOBS_KEY || e.key === STORAGE_APPLIED_KEY) {
        const setter = e.key === STORAGE_JOBS_KEY ? setSavedJobs : setAppliedJobs;
        try {
          setter(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setter([]);
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  /* ── Derived data ──────────────────────────────────────────────────────── */

  const sortedJobs = useMemo(() => {
    const result = [...jobs];
    if (sortBy === "match") {
      result.sort(
        (a, b) => (matchScores[String(b.id)] ?? -1) - (matchScores[String(a.id)] ?? -1),
      );
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.datePosted || 0) - new Date(b.datePosted || 0));
    } else {
      result.sort((a, b) => new Date(b.datePosted || 0) - new Date(a.datePosted || 0));
    }
    return result;
  }, [jobs, sortBy, matchScores]);

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / JOBS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const displayedJobs = sortedJobs.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);

  const activeFilterCount =
    filters.jobType.length +
    filters.category.length +
    (filters.minSalary ? 1 : 0) +
    (filters.maxSalary ? 1 : 0);

  const isSearchActive = Object.values(searchTerm).some(Boolean);
  const hasAnyQuery = isSearchActive || activeFilterCount > 0;
  const hasMatchScores = Object.keys(matchScores).length > 0;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 2) return [1, 2, 3, "…", totalPages];
    if (page >= totalPages - 1) return [1, "…", totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  }, [page, totalPages]);

  /* ── Handlers ──────────────────────────────────────────────────────────── */

  const handleSearchChange = (field, value) => {
    setSearchTerm((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => {
      if (type === "jobType" || type === "category") {
        const list = prev[type];
        return {
          ...prev,
          [type]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
        };
      }
      return { ...prev, [type]: value };
    });
    setCurrentPage(1);
  };

  const clearAll = () => {
    setFilters({ jobType: [], minSalary: "", maxSalary: "", category: [] });
    setSearchTerm({ company: "", location: "", role: "", experience: "" });
    setCurrentPage(1);
  };

  const toggleSaveJob = async (jobId) => {
    const token = getToken();
    if (!token) {
      setToast({ show: true, message: "Please login to save this job.", type: "error" });
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/saved/job/${jobId}`), {
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

  const markApplied = (jobId) => {
    setAppliedJobs((prev) => {
      const id = String(jobId);
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_APPLIED_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  const openConfirm = async (job) => {
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

    setConfirm({ open: true, jobId: String(job.id), role: job.role, company: job.company });
    clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(
      () => setConfirm((c) => ({ ...c, open: false })),
      12000,
    );
  };

  const closeConfirm = () => {
    setConfirm((c) => ({ ...c, open: false }));
    clearTimeout(confirmTimerRef.current);
  };

  const confirmApply = async () => {
    if (!confirm.jobId) return closeConfirm();
    const token = getToken();
    if (!token) {
      setToast({ show: true, message: "Please login to apply for this job.", type: "error" });
      return closeConfirm();
    }
    try {
      const res = await fetch(apiUrl(`/api/application/apply/${confirm.jobId}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        markApplied(confirm.jobId);
        setToast({ show: true, message: "Application submitted successfully!", type: "success" });
      } else {
        if (data.message === "You have already applied for this job") markApplied(confirm.jobId);
        setToast({
          show: true,
          message: data.message || "Failed to submit application.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error applying for job:", err);
      setToast({ show: true, message: "An error occurred while applying.", type: "error" });
    } finally {
      closeConfirm();
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  const searchFields = [
    { key: "company", label: "Company", placeholder: "e.g. Quick Dry Cleaning", icon: Building2 },
    { key: "location", label: "Location", placeholder: "e.g. Ahmedabad", icon: MapPin },
    { key: "role", label: "Role / Keyword", placeholder: "e.g. Frontend Engineer", icon: BriefcaseBusiness },
    { key: "experience", label: "Experience", placeholder: "e.g. 2-4 years", icon: UserRound },
  ];

  const filterPanel = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
          <Filter size={18} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold text-brand-700 transition hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Job type */}
      <fieldset className="mt-6">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          <BriefcaseBusiness size={16} className="text-slate-400" aria-hidden="true" />
          Job Type
        </legend>
        <div className="space-y-2">
          {JOB_TYPE_OPTIONS.map((type) => (
            <label
              key={type.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={filters.jobType.includes(type.value)}
                onChange={() => handleFilterChange("jobType", type.value)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Salary */}
      <fieldset className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          <BadgeIndianRupee size={16} className="text-slate-400" aria-hidden="true" />
          Salary Range
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="minSalary" className={LABEL_CLASS}>
              Min
            </label>
            <input
              id="minSalary"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              value={filters.minSalary}
              onChange={(e) => handleFilterChange("minSalary", e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="maxSalary" className={LABEL_CLASS}>
              Max
            </label>
            <input
              id="maxSalary"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Any"
              value={filters.maxSalary}
              onChange={(e) => handleFilterChange("maxSalary", e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </fieldset>

      {/* Category */}
      <fieldset className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          <BarChart3 size={16} className="text-slate-400" aria-hidden="true" />
          Category
        </legend>
        <div className="space-y-2">
          {JOB_CATEGORIES.map((category) => {
            const count = categoryCounts?.[category];
            return (
              <label
                key={category}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={filters.category.includes(category)}
                  onChange={() => handleFilterChange("category", category)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {category}
                </span>
                {/* Count is rendered only when the API data actually provides one */}
                {count > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {count}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {activeFilterCount > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Active
          </h3>
          <div className="flex flex-wrap gap-2">
            {filters.jobType.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleFilterChange("jobType", type)}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25"
              >
                {formatJobType(type)}
                <X size={12} aria-hidden="true" />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
            {filters.category.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleFilterChange("category", cat)}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25"
              >
                {cat}
                <X size={12} aria-hidden="true" />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
            {filters.minSalary && (
              <button
                type="button"
                onClick={() => handleFilterChange("minSalary", "")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
              >
                Min {filters.minSalary}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {filters.maxSalary && (
              <button
                type="button"
                onClick={() => handleFilterChange("maxSalary", "")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
              >
                Max {filters.maxSalary}
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Find your next role
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Every result pairs the company and the role in one card, with your AI match score when
          your resume has been analysed.
        </p>
      </header>

      {/* Search card */}
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setCurrentPage(1);
          fetchJobs();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {searchFields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key}>
                <label htmlFor={`search-${field.key}`} className={LABEL_CLASS}>
                  {field.label}
                </label>
                <div className="relative">
                  <Icon
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id={`search-${field.key}`}
                    type="text"
                    placeholder={field.placeholder}
                    value={searchTerm[field.key]}
                    onChange={(e) => handleSearchChange(field.key, e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <Search size={18} aria-hidden="true" />
            Search Jobs
          </button>
          {hasAnyQuery && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <X size={16} aria-hidden="true" />
              Clear All
            </button>
          )}
        </div>
      </form>

      {/* Two-column layout — filters never overlap the results */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="min-w-0">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            {showFilters ? "Hide filters" : "Show filters"}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className={`${showFilters ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}>
            {filterPanel}
          </div>
        </aside>

        <section className="min-w-0">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {loading ? (
                "Loading opportunities…"
              ) : error ? (
                "—"
              ) : (
                <>
                  <span className="font-bold text-slate-900 dark:text-slate-50">
                    {sortedJobs.length}
                  </span>{" "}
                  {sortedJobs.length === 1 ? "opportunity" : "opportunities"} found
                </>
              )}
            </p>
            <div className="flex items-center gap-3">
              <label
                htmlFor="sortBy"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Sort by
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                {hasMatchScores && <option value="match">Best AI match</option>}
              </select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchJobs} />
          ) : sortedJobs.length === 0 ? (
            <EmptyState onReset={clearAll} hasQuery={hasAnyQuery} />
          ) : (
            <>
              <div className="grid gap-6">
                {displayedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchScore={matchScores[String(job.id)] ?? null}
                    isSaved={savedJobs.includes(String(job.id))}
                    isApplied={appliedJobs.includes(String(job.id))}
                    onSave={toggleSaveJob}
                    onApply={openConfirm}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-8 flex flex-wrap items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  {pageNumbers.map((num, idx) =>
                    num === "…" ? (
                      <span
                        key={`gap-${idx}`}
                        className="px-2 text-sm text-slate-500 dark:text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCurrentPage(num)}
                        aria-current={page === num ? "page" : undefined}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                          page === num
                            ? "bg-brand-600 text-white shadow-sm"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        {num}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      {/* Apply confirmation */}
      {confirm.open && (
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
                Apply for <span className="font-semibold">{confirm.role}</span> at{" "}
                <span className="font-semibold">{confirm.company}</span>?
              </p>
            </div>
            <button
              type="button"
              onClick={closeConfirm}
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
              onClick={closeConfirm}
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

export default FindJobPage;
