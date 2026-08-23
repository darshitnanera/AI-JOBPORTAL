/**
 * Shared formatting helpers for job/company discovery surfaces.
 * Every helper returns "" / null when the underlying data is absent —
 * callers must not render a placeholder value the API never supplied.
 */

export const JOB_TYPE_OPTIONS = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

export const JOB_CATEGORIES = [
  "Engineering",
  "IT",
  "Data Science",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Finance",
];

export const formatJobType = (value) => {
  if (!value) return "";
  const option = JOB_TYPE_OPTIONS.find(
    (opt) => opt.value === String(value).toLowerCase(),
  );
  if (option) return option.label;
  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const SALARY_SUFFIX = { hour: "hr", day: "day", week: "wk", month: "mo", year: "yr" };

export const formatSalary = (salary, salaryType) => {
  if (salary === undefined || salary === null || salary === "") return "";
  const amount = Number(salary);
  if (!Number.isFinite(amount)) return "";
  const type = String(salaryType || "")
    .toLowerCase()
    .replace("/", "");
  const suffix = SALARY_SUFFIX[type] || "mo";
  return `₹${amount.toLocaleString("en-IN")}/${suffix}`;
};

export const formatRelativeDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Just posted";
  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted 1 day ago";
  if (diffDays < 30) return `Posted ${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Posted ${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `Posted ${years} year${years === 1 ? "" : "s"} ago`;
};

const AVATAR_GRADIENTS = [
  "from-brand-500 to-accent-500",
  "from-sky-500 to-brand-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-fuchsia-500 to-rose-600",
];

export const avatarGradient = (name = "") => {
  const seed = String(name)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[seed % AVATAR_GRADIENTS.length];
};

export const companyInitial = (name) =>
  String(name || "?")
    .trim()
    .charAt(0)
    .toUpperCase() || "?";

/** Normalize a raw backend job document into the shape the UI renders. */
export const normalizeJob = (job = {}) => {
  let logo = "";
  if (job.companyLogo) {
    logo = /^https?:\/\//i.test(job.companyLogo)
      ? job.companyLogo
      : `/${String(job.companyLogo).replace(/^\/+/, "")}`;
  }

  return {
    ...job,
    id: job._id || job.id,
    role: job.roleName || job.role || "",
    company: job.companyName || job.company || "",
    techStack: Array.isArray(job.techStack) ? job.techStack : [],
    location: job.location || "",
    experience: job.experience || "",
    salary: job.salary,
    salaryType: job.salaryType || "month",
    category: job.category || "",
    jobType: job.jobType || "",
    logo,
    datePosted: job.postDate || job.createdAt || null,
  };
};
