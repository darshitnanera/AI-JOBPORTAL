import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  Calendar,
  Building,
  ExternalLink,
  Users,
  BadgeIndianRupee,
  ArrowLeft,
  Bookmark,
  X,
} from "lucide-react";
import Toast from "../Common/Toast";
import { jobDetailPageStyles as s } from "../../assets/dummyStyles";

const STORAGE_USER_KEY = "jobportal_user";
const STORAGE_JOBS_KEY = "savedJobs";

const JobDetailPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_JOBS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/job/${id}`);
        const data = await res.json();
        if (data.success) {
          const bJob = data.job;
          setJob({
            id: bJob._id,
            role: bJob.roleName,
            company: bJob.companyName,
            techStack: bJob.techStack,
            location: bJob.location,
            experience: bJob.experience,
            salary: bJob.salary,
            salaryType: (bJob.salaryType || "").replace("/", "") || "month",
            category: bJob.category,
            jobType: bJob.jobType,
            logo: bJob.companyLogo?.startsWith("http")
              ? bJob.companyLogo
              : `http://localhost:5000${bJob.companyLogo || ""}`,
            datePosted: bJob.postDate || bJob.createdAt,
            overview: bJob.overview,
            responsibilities: bJob.responsibilities,
            jobCriteria: bJob.jobCriteria,
            education: bJob.education,
            openings: bJob.openings,
          });
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const toggleSaveJob = () => {
    if (!job) return;
    setSavedJobs((prev) => {
      const idStr = String(job.id);
      const next = prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr];
      try {
        localStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const formatDate = (dateString) => {
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

  const formatSalary = (salary, salaryType) => {
    if (salary === undefined || salary === null) return "";
    const type = (salaryType || "").toLowerCase();
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

  const getCategoryColor = (category) => {
    const colors = {
      Engineering: "bg-blue-100 text-blue-700 border-blue-200",
      IT: "bg-gray-100 text-gray-700 border-gray-200",
      "Data Science": "bg-purple-100 text-purple-700 border-purple-200",
      Design: "bg-pink-100 text-pink-700 border-pink-200",
      Product: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Marketing: "bg-green-100 text-green-700 border-green-200",
      Sales: "bg-red-100 text-red-700 border-red-200",
      Finance: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getExperienceColor = (level) => {
    const colors = {
      Junior: "bg-green-100 text-green-700 border-green-200",
      "Mid-Level": "bg-blue-100 text-blue-700 border-blue-200",
      "Mid-Senior": "bg-purple-100 text-purple-700 border-purple-200",
      Senior: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return colors[level] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getLocationColor = (location) =>
    "bg-blue-100 text-blue-700 border-blue-200";

  const getJobTypeColor = (type) => {
    const colors = {
      "Full Time": "bg-green-100 text-green-700 border-green-200",
      "Part Time": "bg-yellow-100 text-yellow-700 border-yellow-200",
      Contract: "bg-orange-100 text-orange-700 border-orange-200",
      Internship: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const renderLogo = () => {
    const logo = job?.logo;
    if (!logo)
      return <div className={s.logoText}>{job?.company?.charAt(0) || "?"}</div>;
    if (typeof logo === "string") {
      const lower = logo.toLowerCase();
      if (
        logo.startsWith("http") ||
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".svg") ||
        lower.includes("/assets/")
      ) {
        return (
          <img src={logo} alt={`${job.company} logo`} className={s.logoImage} />
        );
      }
      if (logo.length <= 3) return <div className={s.logoText}>{logo}</div>;
      return <div className={s.logoTextSmall}>{logo}</div>;
    }
    try {
      return (
        <img src={logo} alt={`${job.company} logo`} className={s.logoImage} />
      );
    } catch {
      return <div className={s.logoText}>{job?.company?.charAt(0) || "?"}</div>;
    }
  };

  const [appliedJobs, setAppliedJobs] = useState([]);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        const rawUser = localStorage.getItem(STORAGE_USER_KEY);
        const token = rawUser ? JSON.parse(rawUser).token : null;
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/application/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          const jobIds = data.applications
            .map((app) => app.job._id || app.job)
            .filter((id) => id)
            .map((id) => String(id));
          setAppliedJobs(jobIds);
          localStorage.setItem("appliedJobs", JSON.stringify(jobIds));
        }
      } catch (error) {
        console.error("Error fetching applied jobs:", error);
      }
    };
    fetchAppliedJobs();
  }, []);

  const [confirmToast, setConfirmToast] = useState({
    open: false,
    jobId: null,
    role: "",
    company: "",
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const applyJobOnce = (jobId) => {
    setAppliedJobs((prev) => {
      const idStr = String(jobId);
      if (prev.includes(idStr)) return prev;
      const next = [...prev, idStr];
      try {
        localStorage.setItem("appliedJobs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const openConfirmToast = async () => {
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
          message: "Please login to apply for this job.",
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

  if (loading) {
    return (
      <div className={s.loadingContainer}>
        <div className={s.loadingSpinner}>
          <div className={s.loadingSpinnerCircle}></div>
          <div className={s.loadingIconWrapper}>
            <Briefcase className={s.loadingIcon} />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={s.notFoundContainer}>
        <div className={s.notFoundCard}>
          <h2 className={s.notFoundTitle}>Job not found</h2>
          <p className={s.notFoundText}>
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className={s.notFoundButton}>
            <ArrowLeft className={s.notFoundIcon} /> Back to job search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.innerContainer}>
        <Link to="/jobs" className={s.backButton}>
          <ArrowLeft className={s.backIcon} />
          <span className={s.backText}>Back to Search</span>
        </Link>

        <div className={s.mainCard}>
          <div className={s.headerSection}>
            <div
              className={`${s.logoWrapper} ${job?.logo ? "" : s.logoFallback}`}
            >
              {renderLogo()}
            </div>

            <div className={s.headerContent}>
              <h1 className={s.headerTitle}>{job.role}</h1>
              <div className={s.headerCompany}>
                <Building className={s.headerCompanyIcon} />
                <span className={s.headerCompanyName}>{job.company}</span>
              </div>
            </div>

            <div className={s.saveButtonWrapper}>
              <button
                onClick={toggleSaveJob}
                className={`${s.saveButton} ${
                  savedJobs.includes(String(job.id))
                    ? s.saveButtonActive
                    : s.saveButtonInactive
                }`}
                aria-label={
                  savedJobs.includes(String(job.id)) ? "Unsave job" : "Save job"
                }
              >
                <Bookmark className={s.saveIcon} />
              </button>
            </div>
          </div>

          <div className={s.detailsGrid}>
            {[
              {
                icon: MapPin,
                color: "blue",
                label: "Location",
                value: job.location,
                colorFn: getLocationColor,
              },
              {
                icon: Users,
                color: "purple",
                label: "Experience",
                value: job.experience,
                colorFn: getExperienceColor,
              },
              {
                icon: BadgeIndianRupee,
                color: "green",
                label: "Salary",
                value: formatSalary(job.salary, job.salaryType),
                customClass: s.detailValueGreen,
              },
              {
                icon: Briefcase,
                color: "orange",
                label: "Job Type",
                value: job.jobType,
                colorFn: getJobTypeColor,
              },
              {
                icon: Users,
                color: "pink",
                label: "Openings",
                value: `${job.openings} position${job.openings > 1 ? "s" : ""}`,
                colorFn: getJobTypeColor,
                customClass: s.detailValuePink,
              },
            ].map((item, index) => (
              <div
                key={index}
                className={s.detailItem}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div
                  className={`${s.detailIconWrapper} ${index === 0 ? s.detailIconWrapperBlue : index === 1 ? s.detailIconWrapperPurple : index === 2 ? s.detailIconWrapperGreen : index === 3 ? s.detailIconWrapperOrange : s.detailIconWrapperPink}`}
                >
                  <item.icon
                    className={`${s.detailIcon} ${index === 0 ? s.detailIconBlue : index === 1 ? s.detailIconPurple : index === 2 ? s.detailIconGreen : index === 3 ? s.detailIconOrange : s.detailIconPink}`}
                  />
                </div>
                <div className={s.detailContent}>
                  <div className={s.detailLabel}>{item.label}</div>
                  <span
                    className={`${s.detailValue} ${
                      item.customClass ||
                      item.colorFn?.(item.value) ||
                      "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                    style={{ maxWidth: "22rem" }}
                  >
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className={s.categorySection}
            style={{ animationDelay: "200ms" }}
          >
            <h2 className={s.sectionTitle}>Category</h2>
            <span
              className={`${s.categoryTag} ${getCategoryColor(job.category)}`}
            >
              {job.category}
            </span>
          </div>

          {job.overview && (
            <div
              className={s.contentSection}
              style={{ animationDelay: "300ms" }}
            >
              <h2 className={s.sectionTitle}>Overview</h2>
              <p className={s.contentCard}>{job.overview}</p>
            </div>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div
              className={s.contentSection}
              style={{ animationDelay: "400ms" }}
            >
              <h2 className={s.sectionTitle}>Responsibilities</h2>
              <ul className={s.contentList}>
                {job.responsibilities.map((item, idx) => (
                  <li key={idx} className={s.contentListItem}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.jobCriteria && job.jobCriteria.length > 0 && (
            <div
              className={s.contentSection}
              style={{ animationDelay: "500ms" }}
            >
              <h2 className={s.sectionTitle}>Job Criteria</h2>
              <ul className={s.contentList}>
                {job.jobCriteria.map((item, idx) => (
                  <li key={idx} className={s.contentListItem}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.education && (
            <div
              className={s.contentSection}
              style={{ animationDelay: "600ms" }}
            >
              <h2 className={s.sectionTitle}>Education</h2>
              {Array.isArray(job.education) ? (
                <ul className={s.contentList}>
                  {job.education.map((item, idx) => (
                    <li key={idx} className={s.contentListItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.contentCard}>{job.education}</p>
              )}
            </div>
          )}

          {job.techStack && job.techStack.length > 0 && (
            <div
              className={s.contentSection}
              style={{ animationDelay: "700ms" }}
            >
              <h2 className={s.sectionTitle}>Tech Stack</h2>
              <div className={s.techStackContainer}>
                {job.techStack.map((tech, index) => (
                  <span key={index} className={s.techTag}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={s.footer} style={{ animationDelay: "800ms" }}>
            <div className={s.dateWrapper}>
              <Calendar className={s.dateIcon} />
              <span className={s.dateText}>
                Posted {formatDate(job.datePosted)}
              </span>
            </div>

            <button
              onClick={openConfirmToast}
              disabled={appliedJobs.includes(String(job.id))}
              className={`${s.applyButton} ${
                appliedJobs.includes(String(job.id))
                  ? s.applyButtonApplied
                  : s.applyButtonActive
              }`}
            >
              {appliedJobs.includes(String(job.id)) ? "Applied" : "Apply Now"}
              {!appliedJobs.includes(String(job.id)) && (
                <ExternalLink className={s.applyIcon} />
              )}
            </button>
          </div>
        </div>
      </div>

      {confirmToast.open && (
        <div className={s.confirmToast}>
          <div className={s.confirmToastCard}>
            <div className={s.confirmToastHeader}>
              <div className={s.confirmToastContent}>
                <div className={s.confirmToastIconWrapper}>
                  <ExternalLink className={s.confirmToastIcon} />
                </div>
                <div className={s.confirmToastInfo}>
                  <h4 className={s.confirmToastTitle}>Confirm Application</h4>
                  <p className={s.confirmToastMessage}>
                    Apply for {confirmToast.role} at {confirmToast.company}?
                  </p>
                </div>
              </div>
              <button
                onClick={closeConfirmToast}
                className={s.confirmToastClose}
              >
                <X className={s.confirmToastCloseIcon} />
              </button>
            </div>
            <div className={s.confirmToastActions}>
              <button onClick={confirmApply} className={s.confirmButton}>
                Confirm
              </button>
              <button onClick={closeConfirmToast} className={s.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{s.globalStyles}</style>
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default JobDetailPage;
