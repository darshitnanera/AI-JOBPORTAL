// src/components/SavePage/SavePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  AlertTriangle,
  Bookmark,
  Calendar,
  Lightbulb,
  CircleDashed,
  CheckCircle2,
  Building2,
  Award,
  Dot,
  Users,
  MapPin,
  BadgeIndianRupee,
  Briefcase,
  ExternalLink,
  RotateCcw,
  X,
  Eye,
} from "lucide-react";
import Toast from "../Common/Toast";
import { apiUrl } from "../../utils/api";

const STORAGE_USER_KEY = "jobportal_user";
const STORAGE_JOBS_KEY = "savedJobs";
const STORAGE_KEY = "savedQuestionIds";
const APPLIED_STORAGE_KEY = "appliedJobs";

/* ── Shared class strings (design system §3) ─────────────────────────────── */

const CARD_CLASS =
  "relative flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl " +
  "dark:border-slate-800 dark:bg-slate-900/80 sm:p-6";

const LABEL_CLASS =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

const SELECT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const PRIMARY_BTN_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold " +
  "text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";

const SECONDARY_BTN_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 " +
  "text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60";

const UNSAVE_BTN_CLASS =
  "absolute right-4 top-4 z-10 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center " +
  "rounded-lg bg-brand-600 text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95";

const SECTION_LABEL_CLASS =
  "mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

/* Detail badge palettes — Tailwind v4 cannot see interpolated class names,
   so every variant is spelled out in full. */
const DETAIL_TONES = {
  brand: {
    wrap: "rounded-lg bg-brand-50 p-2 dark:bg-brand-500/10",
    icon: "text-brand-600 dark:text-brand-400",
    badge:
      "inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 " +
      "ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
  },
  slate: {
    wrap: "rounded-lg bg-slate-100 p-2 dark:bg-slate-800",
    icon: "text-slate-600 dark:text-slate-300",
    badge:
      "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 " +
      "ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  },
  success: {
    wrap: "rounded-lg bg-success-50 p-2 dark:bg-success-500/10",
    icon: "text-success-600 dark:text-success-500",
    badge:
      "inline-flex items-center rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 " +
      "ring-1 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25",
  },
  warning: {
    wrap: "rounded-lg bg-warning-50 p-2 dark:bg-warning-500/10",
    icon: "text-warning-600 dark:text-warning-500",
    badge:
      "inline-flex items-center rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700 " +
      "ring-1 ring-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25",
  },
};

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "role", label: "Role" },
  { value: "company", label: "Company" },
];

const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = d2 - d1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "In the future";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(diffDays / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

const STORAGE_LISTENER_KEY = STORAGE_KEY;

/* ── States (design system §6) ───────────────────────────────────────────── */

const SavedCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-44 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="mt-5 space-y-2">
      <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="mt-5 flex flex-wrap gap-2">
      {[64, 52, 78].map((w, i) => (
        <div
          key={i}
          style={{ width: w }}
          className="h-6 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
  </div>
);

const EmptyState = ({ filtered, onReset }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/80">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
      <Bookmark size={24} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
      {filtered ? "Nothing saved in this filter" : "No saved items yet"}
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
      {filtered
        ? "Nothing you've saved matches the current filter. Clear it to see everything you bookmarked."
        : "Save questions on role or company pages — or save jobs on the Find Job page — to see them here."}
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {filtered ? (
        <button type="button" onClick={onReset} className={PRIMARY_BTN_CLASS}>
          <RotateCcw size={16} aria-hidden="true" />
          Clear filters
        </button>
      ) : (
        <>
          <Link to="/jobs" className={PRIMARY_BTN_CLASS}>
            <Briefcase size={16} aria-hidden="true" />
            Browse jobs
          </Link>
          <Link to="/roles" className={SECONDARY_BTN_CLASS}>
            <Users size={16} aria-hidden="true" />
            Explore roles
          </Link>
        </>
      )}
    </div>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-danger-500/30 bg-danger-50 p-8 text-center dark:bg-danger-500/10">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
      <AlertTriangle size={24} className="text-danger-600" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
      We couldn't load your saved items
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{message}</p>
    <button type="button" onClick={onRetry} className={`${PRIMARY_BTN_CLASS} mt-6`}>
      <RotateCcw size={16} aria-hidden="true" />
      Try again
    </button>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────────── */

const SavePage = () => {
  const location = useLocation();
  const stateFilter = location?.state ?? {};

  const [savedItems, setSavedItems] = useState({
    jobs: [],
    interviewQuestions: [],
    roleQuestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [uiFilter, setUiFilter] = useState(stateFilter.filterType || "all");
  const [uiFilterId, setUiFilterId] = useState(stateFilter.id || null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      const raw = localStorage.getItem(APPLIED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [confirmToast, setConfirmToast] = useState({
    open: false,
    jobId: null,
    role: "",
    company: "",
  });
  const confirmTimerRef = useRef(null);

  const [roles, setRoles] = useState([]);
  const [companiesState, setCompaniesState] = useState([]);

  const companyById = (id) =>
    companiesState.find((c) => String(c._id) === String(id));

  const roleById = (id) => roles.find((r) => String(r._id) === String(id));

  const fetchSavedItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) {
        setLoading(false);
        return;
      }

      const [savedRes, rolesRes, companiesRes] = await Promise.all([
        fetch(apiUrl("/api/saved"), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl("/api/interview/roles")),
        fetch(apiUrl("/api/interview/companies")),
      ]);

      if (!savedRes.ok) {
        throw new Error(`Request failed with status ${savedRes.status}`);
      }

      const savedData = await savedRes.json();
      const rolesData = await rolesRes.json();
      const companiesData = await companiesRes.json();

      if (rolesData.success) setRoles(rolesData.roles ?? []);
      if (companiesData.success) setCompaniesState(companiesData.companies ?? []);

      if (savedData.success) {
        // Never assume a collection is present. A response missing any of
        // these keys previously threw "Cannot read properties of undefined
        // (reading 'map')" and took the whole page down.
        const jobs = Array.isArray(savedData.savedJobs) ? savedData.savedJobs : [];
        const interviewQuestions = Array.isArray(savedData.savedInterviewQuestions)
          ? savedData.savedInterviewQuestions
          : [];
        const roleQuestions = Array.isArray(savedData.savedRoleQuestions)
          ? savedData.savedRoleQuestions
          : [];

        setSavedItems({ jobs, interviewQuestions, roleQuestions });

        localStorage.setItem(
          STORAGE_JOBS_KEY,
          JSON.stringify(jobs.map((j) => j?._id).filter(Boolean)),
        );
        const qIds = [
          ...interviewQuestions.map((q) => `company:${q?._id}`),
          ...roleQuestions.map((q) => `role:${q?._id}`),
        ].filter((id) => !id.endsWith("undefined"));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(qIds));
      }
    } catch (err) {
      console.error("Error fetching saved items:", err);
      setError(
        err?.message
          ? `${err.message}. Check your connection and try again.`
          : "Something went wrong while loading your saved items.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const availableRoles = useMemo(() => {
    const rolesMap = new Map();
    (savedItems.roleQuestions || []).forEach((q) => {
      if (q.roleId && q.roleId._id) {
        rolesMap.set(String(q.roleId._id), q.roleId.roleName);
      }
    });
    (savedItems.jobs || []).forEach((j) => {
      const found = roles.find((r) => r.roleName === j.roleName);
      if (found) rolesMap.set(String(found._id), found.roleName);
    });
    return Array.from(rolesMap.entries()).map(([id, name]) => ({
      _id: id,
      roleName: name,
    }));
  }, [savedItems, roles]);

  const availableCompanies = useMemo(() => {
    const companiesMap = new Map();
    (savedItems.interviewQuestions || []).forEach((q) => {
      if (q.company && q.company._id) {
        companiesMap.set(String(q.company._id), q.company.companyName);
      }
    });
    (savedItems.jobs || []).forEach((j) => {
      const found = companiesState.find((c) => c.companyName === j.companyName);
      if (found) companiesMap.set(String(found._id), found.companyName);
    });
    return Array.from(companiesMap.entries()).map(([id, name]) => ({
      _id: id,
      companyName: name,
    }));
  }, [savedItems, companiesState]);

  const toggleSave = async (rawId) => {
    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) return;

      const [kind, id] = rawId.includes(":")
        ? rawId.split(":")
        : ["interview", rawId];

      const res = await fetch(
        apiUrl(`/api/saved/question/${id}?type=${kind}`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        fetchSavedItems();
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const toggleSaveJob = async (jobId) => {
    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) return;

      const res = await fetch(apiUrl(`/api/saved/job/${jobId}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchSavedItems();
      }
    } catch (error) {
      console.error("Error toggling job save:", error);
    }
  };

  const persistAppliedJobs = (next) => {
    try {
      localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist applied jobs", e);
    }
  };

  const applyJobOnce = (jobId) => {
    setAppliedJobs((prev) => {
      const idStr = String(jobId);
      if (prev.includes(idStr)) return prev;
      const next = [...prev, idStr];
      persistAppliedJobs(next);
      return next;
    });
  };

  const unifiedSaved = useMemo(() => {
    const results = [];

    (savedItems.interviewQuestions || []).forEach((q) => {
      results.push({
        source: "company",
        id: q._id,
        q: {
          ...q,
          question: q.question,
          answer: q.answer,
          dateAdded: q.createdAt,
        },
        companies: q.company ? [q.company.companyName] : [],
        dateAdded: q.createdAt,
        raw: `company:${q._id}`,
      });
    });

    (savedItems.roleQuestions || []).forEach((q) => {
      results.push({
        source: "role",
        id: q._id,
        q: {
          ...q,
          question: q.question,
          answer: q.answer,
          dateAdded: q.createdAt,
          answerParagraph: q.answer,
        },
        roleId: q.roleId
          ? typeof q.roleId === "object"
            ? q.roleId.roleName
            : q.roleId
          : null,
        dateAdded: q.createdAt,
        raw: `role:${q._id}`,
      });
    });

    return results;
  }, [savedItems]);

  const jobSavedItems = useMemo(() => {
    return (savedItems.jobs || []).map((job) => ({
      source: "job",
      id: job._id,
      job: {
        ...job,
        id: job._id,
        role: job.roleName,
        company: job.companyName,
        logo: job.companyLogo?.startsWith("http")
          ? job.companyLogo
          : `${job.companyLogo || ""}`,
        datePosted: job.postDate || job.createdAt,
      },
      raw: String(job._id),
    }));
  }, [savedItems]);

  const filteredSaved = useMemo(() => {
    return unifiedSaved.filter((item) => {
      if (uiFilter === "all") return true;

      if (uiFilter === "company") {
        if (item.source !== "company") return false;
        if (!uiFilterId) return true;
        const target = availableCompanies.find(
          (c) => String(c._id) === String(uiFilterId),
        );
        if (!target) return false;
        return (
          String(item.q.company?._id || item.q.company) ===
            String(target._id) ||
          item.q.company?.companyName === target.companyName
        );
      }

      if (uiFilter === "role") {
        if (item.source !== "role") return false;
        if (!uiFilterId) return true;
        const target = availableRoles.find(
          (r) => String(r._id) === String(uiFilterId),
        );
        if (!target) return false;
        return (
          String(item.q.roleId?._id || item.q.roleId) === String(target._id) ||
          item.q.roleId?.roleName === target.roleName
        );
      }

      return true;
    });
  }, [unifiedSaved, uiFilter, uiFilterId, availableRoles, availableCompanies]);

  const parseAnswer = (answer) => {
    if (!answer) return { main: "", points: [] };
    const parts = answer.split(/Key points:/i);
    const main = parts[0] ? parts[0].trim() : "";
    const pointsPart = parts[1] ? parts[1].trim() : "";
    let points = [];
    if (pointsPart) {
      points = pointsPart
        .split(/\d+\)\s*/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (points.length === 0) {
        points = pointsPart
          .split(/[\r\n]+|•|-/)
          .map((p) => p.trim())
          .filter(Boolean);
      }
    }
    return { main, points };
  };

  const clearFilter = () => {
    setUiFilter("all");
    setUiFilterId(null);
  };

  const focusRaw = stateFilter.focusRaw || null;

  const combinedSortedDisplay = useMemo(() => {
    const questionItems = filteredSaved;

    const filteredJobs = jobSavedItems.filter((item) => {
      if (uiFilter === "all") return true;
      if (!item.job) return false;
      if (uiFilter === "company") {
        if (!uiFilterId) return true;
        const target = availableCompanies.find(
          (c) => String(c._id) === String(uiFilterId),
        );
        if (!target) return false;
        return item.job.companyName === target.companyName;
      }
      if (uiFilter === "role") {
        if (!uiFilterId) return true;
        const target = availableRoles.find(
          (r) => String(r._id) === String(uiFilterId),
        );
        if (!target) return false;
        return item.job.roleName === target.roleName;
      }
      return true;
    });

    if (focusRaw) {
      const foundQuestions = questionItems.filter(
        (it) =>
          String(it.raw) === String(focusRaw) ||
          String(it.id) === String(focusRaw),
      );
      const foundJobs = filteredJobs.filter(
        (it) =>
          String(it.raw) === String(focusRaw) ||
          String(it.id) === String(focusRaw),
      );
      const combined = [...foundJobs, ...foundQuestions];
      return combined;
    }

    const combined = [...questionItems, ...filteredJobs.map((j) => ({ ...j }))];

    combined.sort(
      (a, b) =>
        new Date(b.dateAdded || b.job?.datePosted) -
        new Date(a.dateAdded || a.job?.datePosted),
    );
    return combined;
  }, [filteredSaved, jobSavedItems, uiFilter, uiFilterId, focusRaw]);

  const openConfirmToast = async (job) => {
    if (!job) return;
    if (appliedJobs.includes(String(job.id))) return;

    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) {
        setToast({
          show: true,
          message: "Please login to apply.",
          type: "error",
        });
        return;
      }

      const res = await fetch(apiUrl("/api/user/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && (!data.user.phone || !data.user.resume)) {
        setToast({
          show: true,
          message:
            "Please complete your profile (add phone and resume) before applying.",
          type: "error",
        });
        return;
      }

      setConfirmToast({
        open: true,
        jobId: String(job.id),
        role: job.role,
        company: job.company,
      });

      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmToast((c) => ({ ...c, open: false }));
      }, 10000);
    } catch (error) {
      console.error("Error checking profile:", error);
      setConfirmToast({
        open: true,
        jobId: String(job.id),
        role: job.role,
        company: job.company,
      });
    }
  };

  const closeConfirmToast = () => {
    setConfirmToast((c) => ({ ...c, open: false }));
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  };

  const confirmApply = async () => {
    if (!confirmToast.jobId) {
      closeConfirmToast();
      return;
    }

    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) {
        setToast({
          show: true,
          message: "Please login to apply.",
          type: "error",
        });
        closeConfirmToast();
        return;
      }

      const res = await fetch(
        apiUrl(`/api/application/apply/${confirmToast.jobId}`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();

      if (data.success) {
        applyJobOnce(confirmToast.jobId);
        setToast({
          show: true,
          message: "Application submitted successfully!",
          type: "success",
        });
      } else {
        if (data.message === "You have already applied for this job") {
          applyJobOnce(confirmToast.jobId);
        }
        setToast({
          show: true,
          message: data.message || "Failed to submit application.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error applying for job:", error);
      setToast({
        show: true,
        message: "An error occurred while applying.",
        type: "error",
      });
    } finally {
      closeConfirmToast();
    }
  };

  /* ── Cards ─────────────────────────────────────────────────────────────── */

  const renderRoleCard = (item, idx) => {
    const q = item.q;
    const isSaved = true;
    const answerParagraph = q.answerParagraph || q.answer || "";
    const points = q.keyPoints || [];
    const roleName = q.roleId || "";
    const cleanedQuestion = q.question.replace(/^\d+\.\s*/, "");

    return (
      <article key={`role-${item.id}-${idx}`} className={CARD_CLASS}>
        <button
          type="button"
          onClick={() =>
            toggleSave(
              item.source && item.id ? `${item.source}:${item.id}` : item.raw,
            )
          }
          className={UNSAVE_BTN_CLASS}
          title={isSaved ? "Unsave" : "Save"}
          aria-label={isSaved ? "Unsave question" : "Save question"}
        >
          <Bookmark size={18} className={isSaved ? "fill-current" : ""} aria-hidden="true" />
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-12">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
            Role question
          </span>
          {q.isImportant && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700 ring-1 ring-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25">
              <Award size={12} aria-hidden="true" />
              Most Asked
            </span>
          )}
        </div>

        <h3 className="mt-3 wrap-break-word pr-12 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {idx + 1}. {cleanedQuestion}
        </h3>

        {roleName && (
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Role:{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {typeof roleName === "object" ? roleName.roleName : roleName}
            </span>
          </p>
        )}

        <div className="mt-4 rounded-xl border-l-4 border-brand-500 bg-brand-50/70 p-3 text-sm leading-relaxed text-slate-700 dark:bg-brand-500/10 dark:text-slate-300">
          <span className="font-semibold text-brand-700 dark:text-brand-300">Answer: </span>
          {answerParagraph}
        </div>

        {points && points.length > 0 && (
          <div className="mt-4">
            <div className={SECTION_LABEL_CLASS}>Key points</div>
            <div className="flex flex-wrap gap-2">
              {points.map((point, pIdx) => (
                <span
                  key={pIdx}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <CheckCircle2
                    size={12}
                    className="text-success-600 dark:text-success-500"
                    aria-hidden="true"
                  />
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className={SECTION_LABEL_CLASS}>
            <Building2 size={14} aria-hidden="true" />
            Asked in
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.isArray(q.askedBy) && q.askedBy.length > 0 ? (
              q.askedBy.map((entry, compIdx) => {
                const name = entry?.companyName || "Unknown";
                const date = entry?.dateAsked;
                return (
                  <div
                    key={compIdx}
                    className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span className="font-semibold">{name}</span>
                    {date && (
                      <>
                        <Dot size={14} className="text-slate-400" aria-hidden="true" />
                        <span className="text-slate-500 dark:text-slate-400">
                          {date.includes("/") || date.includes("-")
                            ? timeAgo(date)
                            : date}
                        </span>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                No company data
              </span>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderCompanyCard = (item, idx) => {
    const q = item.q;
    const isSaved = true;
    const main = q.answer || q.answerParagraph || "";
    const points = q.keyPoints || [];
    const cleanedQuestion = q.question.replace(/^\d+\.\s*/, "");

    const companyNames = (item.companies || [])
      .map((c) => {
        if (!c) return "";
        if (typeof c === "string" || typeof c === "number") return String(c);
        return c.companyName || c.name || String(c._id || c.id || "");
      })
      .filter(Boolean);

    return (
      <article key={`company-${item.id}-${idx}`} className={CARD_CLASS}>
        <button
          type="button"
          onClick={() =>
            toggleSave(
              item.source && item.id ? `${item.source}:${item.id}` : item.raw,
            )
          }
          className={UNSAVE_BTN_CLASS}
          aria-label={isSaved ? "Unsave question" : "Save question"}
        >
          <Bookmark size={18} className={isSaved ? "fill-current" : ""} aria-hidden="true" />
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-12">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
            Company question
          </span>
          {item.dateAdded && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar size={12} aria-hidden="true" />
              {new Date(item.dateAdded).toLocaleDateString()}
            </span>
          )}
        </div>

        <h3 className="mt-3 wrap-break-word pr-12 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {idx + 1}. {cleanedQuestion}
        </h3>

        <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          {companyNames.length > 0 && (
            <div className="wrap-break-word">Company: {companyNames.join(", ")}</div>
          )}
          {q.roleId && (
            <div className="mt-1 wrap-break-word">
              Role:{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {roleById(q.roleId)?.roleName ||
                  (typeof q.roleId === "object" ? q.roleId.roleName : q.roleId)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb
              size={18}
              className="text-warning-600 dark:text-warning-500"
              aria-hidden="true"
            />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Recommended Answer
            </h4>
          </div>

          <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {main || q.answer || q.answerParagraph || ""}
          </p>

          {points && points.length > 0 && (
            <ul className="mt-3 space-y-2">
              {points.map((pt, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <CircleDashed
                    size={16}
                    className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 wrap-break-word">{pt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    );
  };

  const formatSalary = (salary, salaryType) => {
    if (salary === undefined || salary === null || salary === "") return "";
    const type = (salaryType || "").toLowerCase().replace("/", "");
    const shorthands = {
      hour: "h",
      day: "d",
      week: "w",
      month: "m",
      year: "y",
    };
    const suffix = shorthands[type] || "m";
    return `$${Number(salary).toLocaleString()}/${suffix}`;
  };

  const renderJobDetail = (Icon, tone, value) => {
    if (!value) return null;
    const t = DETAIL_TONES[tone];
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className={t.wrap}>
          <Icon size={16} className={t.icon} aria-hidden="true" />
        </div>
        <span className={`${t.badge} min-w-0 truncate`}>{value}</span>
      </div>
    );
  };

  const renderJobCard = (item, idx) => {
    const job = item.job;
    const isSaved = true;
    const isApplied = appliedJobs.includes(String(job.id));

    return (
      <article key={`job-${item.id}-${idx}`} className={`group ${CARD_CLASS}`}>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800">
            {job.logo ? (
              <img
                src={job.logo}
                alt={`${job.company} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
                {job.company?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="wrap-break-word text-base font-bold tracking-tight text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400 sm:text-lg">
              {job.role}
            </h3>
            <p className="mt-1 truncate text-sm font-medium text-slate-600 dark:text-slate-400">
              {job.company}
            </p>
          </div>
        </div>

        {(job.techStack || []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(job.techStack || []).slice(0, 6).map((tech, i) => (
              <span
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/60"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {renderJobDetail(MapPin, "brand", job.location)}
          {renderJobDetail(Users, "slate", job.experience)}
          {renderJobDetail(
            BadgeIndianRupee,
            "success",
            formatSalary(job.salary, job.salaryType),
          )}
          {renderJobDetail(Briefcase, "warning", job.jobType)}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" aria-hidden="true" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {job.datePosted ? timeAgo(job.datePosted) : ""}
            </span>
          </div>
          {job.category && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
              {job.category}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={
              isApplied
                ? "inline-flex flex-1 cursor-default items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                : `${PRIMARY_BTN_CLASS} flex-1`
            }
            onClick={() => {
              if (!isApplied) openConfirmToast(job);
            }}
            aria-pressed={isApplied}
          >
            {isApplied ? "Applied" : "Apply Now"}
            <ExternalLink size={16} aria-hidden="true" />
          </button>

          <Link
            to={`/jobdetails/${job.id}`}
            aria-label="View job details"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60"
          >
            <Eye size={18} aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => toggleSaveJob(item.id)}
            title={isSaved ? "Unsave job" : "Save job"}
            aria-label={isSaved ? "Unsave job" : "Save job"}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95"
          >
            <Bookmark size={18} className={isSaved ? "fill-current" : ""} aria-hidden="true" />
          </button>
        </div>
      </article>
    );
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  const savedCount = combinedSortedDisplay.length;
  const isFiltered = uiFilter !== "all" || Boolean(uiFilterId);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Saved Questions &amp; Jobs
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Saved across roles, companies &amp; jobs
          </p>
        </div>
        {!loading && !error && savedCount > 0 && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
            <Bookmark size={12} aria-hidden="true" />
            {savedCount} saved
          </span>
        )}
      </header>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className={LABEL_CLASS}>Show</span>
            <div
              role="tablist"
              aria-label="Filter saved items"
              className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/60"
            >
              {FILTER_TABS.map((tab) => {
                const active = uiFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setUiFilter(tab.value);
                      setUiFilterId(null);
                    }}
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      active
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            {uiFilter === "role" && (
              <div className="min-w-0 sm:w-56">
                <label htmlFor="saved-role-filter" className={LABEL_CLASS}>
                  Role
                </label>
                <select
                  id="saved-role-filter"
                  value={uiFilterId || ""}
                  onChange={(e) => setUiFilterId(e.target.value || null)}
                  className={SELECT_CLASS}
                >
                  <option value="">Any role</option>
                  {availableRoles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {uiFilter === "company" && (
              <div className="min-w-0 sm:w-56">
                <label htmlFor="saved-company-filter" className={LABEL_CLASS}>
                  Company
                </label>
                <select
                  id="saved-company-filter"
                  value={uiFilterId || ""}
                  onChange={(e) => setUiFilterId(e.target.value || null)}
                  className={SELECT_CLASS}
                >
                  <option value="">Any company</option>
                  {availableCompanies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={clearFilter}
              className={SECONDARY_BTN_CLASS}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SavedCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSavedItems} />
      ) : combinedSortedDisplay.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {combinedSortedDisplay.map((item, idx) => {
            if (item.missing) {
              return (
                <div
                  key={`missing-${idx}`}
                  className="rounded-2xl border border-danger-500/30 bg-white p-5 shadow-sm dark:bg-slate-900/80 sm:p-6"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Missing question
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleSave(item.raw)}
                      aria-label="Remove from saved"
                      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      <Bookmark size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="wrap-break-word text-sm text-slate-600 dark:text-slate-400">
                    Saved id: {item.raw}
                  </p>
                  <p className="mt-2 text-sm text-danger-600">
                    This saved id no longer maps to any question in current
                    datasets.
                  </p>
                </div>
              );
            }

            if (item.source === "job") {
              return renderJobCard(item, idx);
            }

            if (item.source === "role") {
              return renderRoleCard(item, idx);
            }

            return renderCompanyCard(item, idx);
          })}
        </div>
      ) : (
        <EmptyState filtered={isFiltered} onReset={clearFilter} />
      )}

      {/* Apply confirmation */}
      {confirmToast.open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Confirm application"
          className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:left-auto sm:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-brand-50 p-2 dark:bg-brand-500/10">
              <ExternalLink
                size={18}
                className="text-brand-600 dark:text-brand-400"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Confirm Application
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmToast((c) => ({ ...c, open: false }))
                  }
                  aria-label="Close"
                  className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-1 wrap-break-word text-sm text-slate-600 dark:text-slate-300">
                Are you sure you want to apply for{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {confirmToast.role}
                </span>{" "}
                at{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {confirmToast.company}
                </span>
                ?
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={confirmApply}
                  className={`${PRIMARY_BTN_CLASS} flex-1`}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={closeConfirmToast}
                  className={`${SECONDARY_BTN_CLASS} flex-1`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() =>
            setToast({ show: false, message: "", type: "success" })
          }
        />
      )}
    </div>
  );
};

export default SavePage;
