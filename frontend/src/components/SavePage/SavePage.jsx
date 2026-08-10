// src/pages/SavePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
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
  X,
  Eye,
} from "lucide-react";
import Toast from "../Common/Toast";
import { savePageStyles as s } from "../../assets/dummyStyles";

const STORAGE_USER_KEY = "jobportal_user";
const STORAGE_JOBS_KEY = "savedJobs";
const STORAGE_KEY = "savedQuestionIds";
const APPLIED_STORAGE_KEY = "appliedJobs";

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

const SavePage = () => {
  const location = useLocation();
  const stateFilter = location?.state ?? {};

  const [savedItems, setSavedItems] = useState({
    jobs: [],
    interviewQuestions: [],
    roleQuestions: [],
  });
  const [loading, setLoading] = useState(true);

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
    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) {
        setLoading(false);
        return;
      }

      const [savedRes, rolesRes, companiesRes] = await Promise.all([
        fetch("http://localhost:5000/api/saved", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/interview/roles"),
        fetch("http://localhost:5000/api/interview/companies"),
      ]);

      const savedData = await savedRes.json();
      const rolesData = await rolesRes.json();
      const companiesData = await companiesRes.json();

      if (rolesData.success) setRoles(rolesData.roles);
      if (companiesData.success) setCompaniesState(companiesData.companies);

      if (savedData.success) {
        setSavedItems({
          jobs: savedData.savedJobs,
          interviewQuestions: savedData.savedInterviewQuestions,
          roleQuestions: savedData.savedRoleQuestions,
        });

        localStorage.setItem(
          STORAGE_JOBS_KEY,
          JSON.stringify(savedData.savedJobs.map((j) => j._id)),
        );
        const qIds = [
          ...savedData.savedInterviewQuestions.map((q) => `company:${q._id}`),
          ...savedData.savedRoleQuestions.map((q) => `role:${q._id}`),
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(qIds));
      }
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const availableRoles = useMemo(() => {
    const rolesMap = new Map();
    savedItems.roleQuestions.forEach((q) => {
      if (q.roleId && q.roleId._id) {
        rolesMap.set(String(q.roleId._id), q.roleId.roleName);
      }
    });
    savedItems.jobs.forEach((j) => {
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
    savedItems.interviewQuestions.forEach((q) => {
      if (q.company && q.company._id) {
        companiesMap.set(String(q.company._id), q.company.companyName);
      }
    });
    savedItems.jobs.forEach((j) => {
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
        `http://localhost:5000/api/saved/question/${id}?type=${kind}`,
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

      const res = await fetch(`http://localhost:5000/api/saved/job/${jobId}`, {
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

    savedItems.interviewQuestions.forEach((q) => {
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

    savedItems.roleQuestions.forEach((q) => {
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
    return savedItems.jobs.map((job) => ({
      source: "job",
      id: job._id,
      job: {
        ...job,
        id: job._id,
        role: job.roleName,
        company: job.companyName,
        logo: job.companyLogo?.startsWith("http")
          ? job.companyLogo
          : `http://localhost:5000${job.companyLogo || ""}`,
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

      const res = await fetch("http://localhost:5000/api/user/profile", {
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
        `http://localhost:5000/api/application/apply/${confirmToast.jobId}`,
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

  const renderRoleCard = (item, idx) => {
    const q = item.q;
    const isSaved = true;
    const answerParagraph = q.answerParagraph || q.answer || "";
    const points = q.keyPoints || [];
    const roleName = q.roleId || "";
    const cleanedQuestion = q.question.replace(/^\d+\.\s*/, "");

    return (
      <div
        key={`role-${item.id}-${idx}`}
        className={s.roleCard}
        style={{ animationDelay: `${idx * 60}ms` }}
      >
        <button
          onClick={() =>
            toggleSave(
              item.source && item.id ? `${item.source}:${item.id}` : item.raw,
            )
          }
          className={s.roleSaveButton(isSaved)}
          title={isSaved ? "Unsave" : "Save"}
        >
          <Bookmark className="h-5 w-5" />
        </button>

        {q.isImportant && (
          <div className={s.roleMostAskedBadge}>
            <Award className={s.roleAwardIcon} />
            Most Asked
          </div>
        )}

        <h3 className={s.roleTitle}>
          {idx + 1}. {cleanedQuestion}
        </h3>

        {roleName && (
          <div className={s.roleNameText}>
            Role:{" "}
            <span className="font-medium">
              {typeof roleName === "object" ? roleName.roleName : roleName}
            </span>
          </div>
        )}

        <div className={s.roleAnswerContainer}>
          <span className={s.roleAnswerLabel}>Answer: </span>
          {answerParagraph}
        </div>

        {points && points.length > 0 && (
          <div className="mb-4">
            <div className={s.roleKeyPointsHeading}>KEY POINTS</div>
            <div className={s.roleKeyPointsWrapper}>
              {points.map((point, pIdx) => (
                <span key={pIdx} className={s.roleKeyPointTag}>
                  <CheckCircle2 className={s.roleKeyPointIcon} />
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className={s.roleAskedInHeading}>
            <Building2 className={s.roleAskedInIcon} />
            Asked in
          </div>

          <div className={s.roleCompanyTagsWrapper}>
            {Array.isArray(q.askedBy) && q.askedBy.length > 0 ? (
              q.askedBy.map((item, compIdx) => {
                const name = item?.companyName || "Unknown";
                const date = item?.dateAsked;
                return (
                  <div key={compIdx} className={s.roleCompanyTag}>
                    <span className={s.roleCompanyName}>{name}</span>
                    {date && (
                      <>
                        <Dot className={s.roleCompanyDot} />
                        <span className={s.roleCompanyDate}>
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
              <span className={s.roleNoCompanyText}>No company data</span>
            )}
          </div>
        </div>
      </div>
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
      <div
        key={`company-${item.id}-${idx}`}
        className={s.companyCard}
        style={{ animationDelay: `${idx * 60}ms` }}
      >
        <button
          onClick={() =>
            toggleSave(
              item.source && item.id ? `${item.source}:${item.id}` : item.raw,
            )
          }
          className={s.companySaveButton(isSaved)}
          aria-label={isSaved ? "Unsave question" : "Save question"}
        >
          <Bookmark className="w-5 h-5" />
        </button>

        <div className={s.companyCardInner}>
          <div className="flex items-start justify-between mb-3 gap-4">
            <div>
              <div className={s.companyDateWrapper}>
                <Calendar className={s.companyDateIcon} />
                {item.dateAdded
                  ? new Date(item.dateAdded).toLocaleDateString()
                  : ""}
              </div>

              <h3 className={s.companyTitle}>
                {idx + 1}. {cleanedQuestion}
              </h3>

              <div className={s.companyInfo}>
                {companyNames.length > 0 && (
                  <div>Company: {companyNames.join(", ")}</div>
                )}
                {q.roleId && (
                  <div className="mt-1">
                    Role:{" "}
                    <span className="font-medium">
                      {roleById(q.roleId)?.roleName ||
                        (typeof q.roleId === "object"
                          ? q.roleId.roleName
                          : q.roleId)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={s.companyAnswerBox}>
            <div className={s.companyLightbulbWrapper}>
              <Lightbulb className={s.companyLightbulbIcon} />
              <h4 className={s.companyAnswerHeading}>Recommended Answer</h4>
            </div>

            {main ? (
              <p className={s.companyAnswerText}>{main}</p>
            ) : (
              <p className={s.companyAnswerText}>
                {q.answer || q.answerParagraph || ""}
              </p>
            )}

            {points && points.length > 0 && (
              <ul className={s.companyPointsList}>
                {points.map((pt, i) => (
                  <li key={i} className={s.companyPointItem}>
                    <CircleDashed className={s.companyPointIcon} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
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

  const renderJobCard = (item, idx) => {
    const job = item.job;
    const isSaved = true;
    const isApplied = appliedJobs.includes(String(job.id));

    return (
      <div
        key={`job-${item.id}-${idx}`}
        className={s.jobCard}
        style={{ animationDelay: `${idx * 60}ms` }}
      >
        <div className={s.jobHeader}>
          <div className={s.jobLogoContainer(!!job.logo)}>
            {job.logo ? (
              <img
                src={job.logo}
                alt={`${job.company} logo`}
                className={s.jobLogoImage}
              />
            ) : (
              <div className={s.jobLogoFallback}>
                {job.company?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className={s.jobTitle}>{job.role}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className={s.jobCompany}>{job.company}</p>
            </div>
          </div>
        </div>

        <div className={s.techStackWrapper}>
          {(job.techStack || []).slice(0, 6).map((tech, i) => (
            <span key={i} className={s.techStackTag}>
              {tech}
            </span>
          ))}
        </div>

        <div className={s.jobDetailsGrid}>
          <div className={s.jobDetailItem}>
            <div className={s.jobDetailIconWrapper("blue")}>
              <MapPin className={s.jobDetailIcon("blue")} />
            </div>
            <div>
              <span className={s.jobDetailBadge("blue")}>{job.location}</span>
            </div>
          </div>

          <div className={s.jobDetailItem}>
            <div className={s.jobDetailIconWrapper("purple")}>
              <Users className={s.jobDetailIcon("purple")} />
            </div>
            <div>
              <span className={s.jobDetailBadge("green")}>
                {job.experience}
              </span>
            </div>
          </div>

          <div className={s.jobDetailItem}>
            <div className={s.jobDetailIconWrapper("green")}>
              <BadgeIndianRupee className={s.jobDetailIcon("green")} />
            </div>
            <div>
              <span className={s.jobDetailBadge("green")}>
                {formatSalary(job.salary, job.salaryType)}
              </span>
            </div>
          </div>

          <div className={s.jobDetailItem}>
            <div className={s.jobDetailIconWrapper("orange")}>
              <Briefcase className={s.jobDetailIcon("orange")} />
            </div>
            <div>
              <span className={s.jobDetailBadge("orange")}>{job.jobType}</span>
            </div>
          </div>
        </div>

        <div className={s.jobFooter}>
          <div className={s.jobDateWrapper}>
            <Calendar className={s.jobDateIcon} />
            <span className={s.jobDateText}>
              {job.datePosted ? timeAgo(job.datePosted) : ""}
            </span>
          </div>
          <span className={s.jobCategoryBadge}>{job.category}</span>
        </div>

        <div className={s.jobActions}>
          <button
            className={s.applyButton(isApplied)}
            onClick={() => {
              if (!isApplied) openConfirmToast(job);
            }}
            aria-pressed={isApplied}
          >
            {isApplied ? "Applied" : "Apply Now"}
            <ExternalLink className={s.applyButtonIcon} />
          </button>

          <Link
            to={`/jobdetails/${job.id}`}
            aria-label="View job details"
            className={s.viewButton}
          >
            <Eye className={s.viewButtonIcon} />
          </Link>

          <button
            onClick={() => toggleSaveJob(item.id)}
            title={isSaved ? "Unsave job" : "Save job"}
            className={s.jobSaveButton(isSaved)}
          >
            <Bookmark className={s.jobSaveIcon} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={s.pageContainer}>
      <div className={s.innerContainer}>
        <div className={s.filterSection}>
          <div className={s.filterTitleWrapper}>
            <div>
              <h1 className={s.filterTitle}>Saved Questions & Jobs</h1>
              <p className={s.filterSubtitle}>
                Saved across roles, companies & jobs
              </p>
            </div>
          </div>

          <div className={s.filterControls}>
            <select
              value={uiFilter}
              onChange={(e) => {
                setUiFilter(e.target.value);
                setUiFilterId(null);
              }}
              className={s.filterSelect}
            >
              <option value="all">All</option>
              <option value="role">Role</option>
              <option value="company">Company</option>
            </select>

            {uiFilter === "role" && (
              <select
                value={uiFilterId || ""}
                onChange={(e) => setUiFilterId(e.target.value || null)}
                className={s.filterSelect}
              >
                <option value="">Any role</option>
                {availableRoles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            )}

            {uiFilter === "company" && (
              <select
                value={uiFilterId || ""}
                onChange={(e) => setUiFilterId(e.target.value || null)}
                className={s.filterSelect}
              >
                <option value="">Any company</option>
                {availableCompanies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            )}

            <button onClick={clearFilter} className={s.filterClearButton}>
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className={s.loadingContainer}>
            <p className={s.loadingText}>Loading saved items...</p>
          </div>
        ) : combinedSortedDisplay.length > 0 ? (
          <div className={s.grid}>
            {combinedSortedDisplay.map((item, idx) => {
              if (item.missing) {
                return (
                  <div key={`missing-${idx}`} className={s.missingCard}>
                    <div className={s.missingHeader}>
                      <h3 className={s.missingTitle}>Missing question</h3>
                      <button
                        onClick={() => toggleSave(item.raw)}
                        className={s.missingSaveButton}
                      >
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>
                    <p className={s.missingIdText}>Saved id: {item.raw}</p>
                    <p className={s.missingErrorText}>
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
          <div className={s.emptyStateContainer}>
            <div className={s.emptyStateCard}>
              <div className={s.emptyStateIconWrapper}>
                <Bookmark className={s.emptyStateIcon} />
              </div>
              <h3 className={s.emptyStateTitle}>No saved items</h3>
              <p className={s.emptyStateText}>
                Save questions on role or company pages — or save jobs on the
                Find Job page — to see them here.
              </p>
            </div>
          </div>
        )}
      </div>

      {confirmToast.open && (
        <div
          role="dialog"
          aria-modal="false"
          className={s.confirmToastContainer}
        >
          <div className={s.confirmToastInner}>
            <div className={s.confirmToastIconWrapper}>
              <ExternalLink className={s.confirmToastIcon} />
            </div>
            <div className={s.confirmToastContent}>
              <h4 className={s.confirmToastTitle}>Confirm Application</h4>
              <p className={s.confirmToastMessage}>
                Are you sure you want to apply for{" "}
                <span className={s.confirmToastRole}>{confirmToast.role}</span>{" "}
                at{" "}
                <span className={s.confirmToastCompany}>
                  {confirmToast.company}
                </span>
                ?
              </p>
              <div className={s.confirmToastActions}>
                <button onClick={confirmApply} className={s.confirmButton}>
                  Confirm
                </button>
                <button onClick={closeConfirmToast} className={s.cancelButton}>
                  Cancel
                </button>
                <button
                  onClick={() =>
                    setConfirmToast((c) => ({ ...c, open: false }))
                  }
                  aria-label="Close"
                  className={s.closeButton}
                >
                  <X className="w-4 h-4" />
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
      <style>{s.globalStyles}</style>
    </div>
  );
};

export default SavePage;
