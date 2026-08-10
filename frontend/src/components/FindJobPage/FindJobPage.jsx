import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  Calendar,
  Building,
  X,
  ExternalLink,
  Users,
  BarChart3,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Bookmark,
  Eye,
} from "lucide-react";
import Toast from "../Common/Toast";
import { findJobPageStyles as s } from "../../assets/dummyStyles";

const STORAGE_JOBS_KEY = "savedJobs";
const STORAGE_APPLIED_KEY = "appliedJobs";
const STORAGE_USER_KEY = "jobportal_user";

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
  const [jobsPerPage] = useState(6);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [imgErrors, setImgErrors] = useState({});

  const handleImgError = (jobId) => {
    setImgErrors((prev) => ({ ...prev, [jobId]: true }));
  };

  const filtersRef = useRef(null);

  const [confirmToast, setConfirmToast] = useState({
    open: false,
    jobId: null,
    role: "",
    company: "",
  });
  const confirmTimerRef = useRef(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const jobTypeOptions = [
    { value: "full-time", label: "Full Time" },
    { value: "part-time", label: "Part Time" },
    { value: "internship", label: "Internship" },
    { value: "contract", label: "Contract" },
  ];

  const normalizeJobTypeForDisplay = (value) => {
    if (!value) return "";
    const option = jobTypeOptions.find((opt) => opt.value === value);
    if (option) return option.label;
    return value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const categories = [
    "Engineering",
    "IT",
    "Data Science",
    "Design",
    "Product",
    "Marketing",
    "Sales",
    "Finance",
  ];

  const handleSearchChange = (field, value) => {
    setSearchTerm((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => {
      if (type === "jobType" || type === "category") {
        const array = prev[type];
        if (array.includes(value)) {
          return { ...prev, [type]: array.filter((item) => item !== value) };
        } else {
          return { ...prev, [type]: [...array, value] };
        }
      }
      return { ...prev, [type]: value };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ jobType: [], minSalary: "", maxSalary: "", category: [] });
    setSearchTerm({ company: "", location: "", role: "", experience: "" });
    setCurrentPage(1);
  };

  const toggleSaveJob = async (jobId) => {
    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) {
        setToast({
          show: true,
          message: "Please login to save this job.",
          type: "error",
        });
        return;
      }

      const res = await fetch(`http://localhost:5000/api/saved/job/${jobId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        const jobIds = data.savedJobs.map((id) => String(id));
        setSavedJobs(jobIds);
        localStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(jobIds));
      } else {
        setToast({
          show: true,
          message: data.message || "Failed to save job.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving job:", error);
      setToast({
        show: true,
        message: "An error occurred while saving.",
        type: "error",
      });
    }
  };

  const toggleApplyJob = (jobId) => {
    setAppliedJobs((prev) => {
      const idStr = String(jobId);
      const next = prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr];
      try {
        localStorage.setItem(STORAGE_APPLIED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const applyJobOnce = (jobId) => {
    setAppliedJobs((prev) => {
      const idStr = String(jobId);
      if (prev.includes(idStr)) return prev;
      const next = [...prev, idStr];
      try {
        localStorage.setItem(STORAGE_APPLIED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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
          localStorage.setItem(STORAGE_APPLIED_KEY, JSON.stringify(jobIds));
        }
      } catch (error) {
        console.error("Error fetching applied jobs:", error);
      }
    };

    const fetchSavedJobs = async () => {
      try {
        const rawUser = localStorage.getItem(STORAGE_USER_KEY);
        const token = rawUser ? JSON.parse(rawUser).token : null;
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/saved", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          const jobIds = data.savedJobs.map((job) => String(job._id || job));
          setSavedJobs(jobIds);
          localStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(jobIds));
        }
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

    const handler = (e) => {
      if (e.key === STORAGE_JOBS_KEY) {
        try {
          setSavedJobs(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setSavedJobs([]);
        }
      } else if (e.key === STORAGE_APPLIED_KEY) {
        try {
          setAppliedJobs(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setAppliedJobs([]);
        }
      }
    };
    window.addEventListener("storage", handler);
    fetchAppliedJobs();
    fetchSavedJobs();
    return () => window.removeEventListener("storage", handler);
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchTerm.company) params.append("companyName", searchTerm.company);
      if (searchTerm.location) params.append("location", searchTerm.location);
      if (searchTerm.role) params.append("roleName", searchTerm.role);
      if (searchTerm.experience)
        params.append("experience", searchTerm.experience);

      if (filters.jobType.length > 0)
        params.append("jobType", filters.jobType.join(","));
      if (filters.category.length > 0)
        params.append("category", filters.category.join(","));
      if (filters.minSalary) params.append("minSalary", filters.minSalary);
      if (filters.maxSalary) params.append("maxSalary", filters.maxSalary);

      const res = await fetch(
        `http://localhost:5000/api/job?${params.toString()}`,
      );
      const data = await res.json();

      if (data.success) {
        const mappedJobs = data.jobs.map((job) => {
          let logoSrc = "";
          if (job.companyLogo) {
            if (job.companyLogo.startsWith("http")) {
              logoSrc = job.companyLogo;
            } else {
              const path = job.companyLogo.startsWith("/")
                ? job.companyLogo
                : `/${job.companyLogo}`;
              logoSrc = `http://localhost:5000${path
                .split("/")
                .map((segment) => encodeURIComponent(segment))
                .join("/")}`;
            }
          }

          return {
            id: job._id,
            role: job.roleName,
            company: job.companyName,
            techStack: job.techStack,
            location: job.location,
            experience: job.experience,
            experienceLevel: job.experience,
            salary: job.salary,
            salaryType: (job.salaryType || "").replace("/", "") || "month",
            category: job.category,
            jobType: job.jobType,
            logo: logoSrc,
            datePosted: job.postDate || job.createdAt,
            ...job,
          };
        });
        setJobs(mappedJobs);
        setFilteredJobs(mappedJobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  useEffect(() => {
    let result = [...jobs];
    if (sortBy === "newest") {
      result.sort(
        (a, b) => new Date(b.datePosted || 0) - new Date(a.datePosted || 0),
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) => new Date(a.datePosted || 0) - new Date(b.datePosted || 0),
      );
    }
    setFilteredJobs(result);
  }, [sortBy, jobs]);

  useEffect(() => {
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    setDisplayedJobs(filteredJobs.slice(indexOfFirstJob, indexOfLastJob));
  }, [filteredJobs, currentPage, jobsPerPage]);

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

    return `${Number(salary).toLocaleString()}/${suffix}`;
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
    if (!type) return "bg-gray-100 text-gray-700 border-gray-200";
    const normalizedType = type
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ");

    const colors = {
      "full time": "bg-green-100 text-green-700 border-green-200",
      "part time": "bg-yellow-100 text-yellow-700 border-yellow-200",
      contract: "bg-orange-100 text-orange-700 border-orange-200",
      internship: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return (
      colors[normalizedType] || "bg-gray-100 text-gray-700 border-gray-200"
    );
  };

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 3;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 2) pages.push(1, 2, 3, "...", totalPages);
      else if (currentPage >= totalPages - 1)
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      else
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
    }
    return pages;
  };

  const activeFilterCount =
    filters.jobType.length +
    filters.category.length +
    (filters.minSalary ? 1 : 0) +
    (filters.maxSalary ? 1 : 0);

  const isSearchActive =
    searchTerm.company ||
    searchTerm.location ||
    searchTerm.role ||
    searchTerm.experience;

  const renderLogo = (job) => {
    const logoUrl = job.logo;
    const isBroken =
      imgErrors[job.id] || !logoUrl || logoUrl === "http://localhost:5000";

    const initials = job.company?.charAt(0) || "?";
    const colors = [
      "bg-linear-to-br from-blue-500 to-indigo-600",
      "bg-linear-to-br from-purple-500 to-pink-600",
      "bg-linear-to-br from-orange-500 to-red-600",
      "bg-linear-to-br from-emerald-500 to-teal-600",
      "bg-linear-to-br from-pink-500 to-rose-600",
    ];
    const colorClass = colors[job.company?.length % colors.length] || colors[0];

    return (
      <div
        className={`${s.logoFallback} ${!isBroken && logoUrl ? "" : colorClass}`}
      >
        {!isBroken && logoUrl ? (
          <img
            src={logoUrl}
            alt={`${job.company} logo`}
            className={s.logoImage}
            onError={() => handleImgError(job.id)}
          />
        ) : (
          <span className={s.logoInitial}>{initials}</span>
        )}
      </div>
    );
  };

  return (
    <div className={s.container}>
      <div className={s.relativeWrapper}>
        <div className={s.gradientOverlay} />
        <div className={s.contentContainer}>
          <div className={s.headerCenter}>
            <div className={s.headerTitleWrapper}>
              <h1 className={s.headerTitle}>Find Your Dream Job</h1>
            </div>
          </div>

          <div className={s.searchContainer}>
            <div className={s.searchCard}>
              <div className={s.searchGrid}>
                <div className={s.inputGroup}>
                  <label className={s.inputLabel}>Company</label>
                  <div className={s.inputIcon}>
                    <Building className={s.inputIconSvg} />
                  </div>
                  <input
                    type="text"
                    placeholder="Company name"
                    className={s.input}
                    value={searchTerm.company}
                    onChange={(e) =>
                      handleSearchChange("company", e.target.value)
                    }
                  />
                </div>

                <div className={s.inputGroup}>
                  <label className={s.inputLabel}>Location</label>
                  <div className={s.inputIcon}>
                    <MapPin className={s.inputIconSvg} />
                  </div>
                  <input
                    type="text"
                    placeholder="City"
                    className={s.input}
                    value={searchTerm.location}
                    onChange={(e) =>
                      handleSearchChange("location", e.target.value)
                    }
                  />
                </div>

                <div className={s.inputGroup}>
                  <label className={s.inputLabel}>Role / Keyword</label>
                  <div className={s.inputIcon}>
                    <Briefcase className={s.inputIconSvg} />
                  </div>
                  <input
                    type="text"
                    placeholder="Job title or keyword"
                    className={s.input}
                    value={searchTerm.role}
                    onChange={(e) => handleSearchChange("role", e.target.value)}
                  />
                </div>

                <div className={s.inputGroup}>
                  <label className={s.inputLabel}>Experience</label>
                  <div className={s.inputIcon}>
                    <Users className={s.inputIconSvg} />
                  </div>
                  <input
                    type="text"
                    placeholder="Experience"
                    className={s.input}
                    value={searchTerm.experience}
                    onChange={(e) =>
                      handleSearchChange("experience", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className={s.actionBar}>
                <div className="flex items-center gap-3">
                  {(isSearchActive || activeFilterCount > 0) && (
                    <button onClick={clearFilters} className={s.clearButton}>
                      <X className={s.clearIcon} />
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={s.mainContent}>
        <div className={s.contentGrid}>
          {/* Filters sidebar */}
          <div className={s.sidebar} ref={filtersRef}>
            <div className={s.sidebarSticky}>
              <div className={s.filterCard}>
                <div className={s.filterHeader}>
                  <div className={s.filterTitle}>
                    <Filter className={s.filterIcon} />
                    <h2 className={s.filterTitleText}>Filters</h2>
                  </div>
                  <div className={s.filterActions}>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className={s.clearFiltersText}
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className={s.mobileCloseButton}
                    >
                      <X className={s.mobileCloseIcon} />
                    </button>
                  </div>
                </div>

                <div className={s.filterSection}>
                  <h3 className={s.filterSectionTitle}>
                    <BriefcaseBusiness className={s.filterSectionIcon} />
                    Job Type
                  </h3>
                  <div className={s.jobTypeGrid}>
                    {jobTypeOptions.map((type) => (
                      <button
                        key={type.value}
                        onClick={() =>
                          handleFilterChange("jobType", type.value)
                        }
                        className={`${s.jobTypeButton} ${
                          filters.jobType.includes(type.value)
                            ? s.jobTypeButtonActive
                            : s.jobTypeButtonInactive
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={s.filterSection}>
                  <h3 className={s.filterSectionTitle}>
                    <BadgeIndianRupee className={s.filterSectionIcon} />
                    Salary Range
                  </h3>
                  <div className={s.salaryGrid}>
                    <div>
                      <label className={s.salaryLabel}>Minimum Salary</label>
                      <div className={s.salaryInputWrapper}>
                        <input
                          type="number"
                          placeholder="3000"
                          className={s.salaryInput}
                          value={filters.minSalary}
                          onChange={(e) =>
                            handleFilterChange("minSalary", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className={s.salaryLabel}>Maximum Salary</label>
                      <div className={s.salaryInputWrapper}>
                        <input
                          type="number"
                          placeholder="15000"
                          className={s.salaryInput}
                          value={filters.maxSalary}
                          onChange={(e) =>
                            handleFilterChange("maxSalary", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={s.filterSection}>
                  <h3 className={s.filterSectionTitle}>
                    <BarChart3 className={s.filterSectionIcon} />
                    Category
                  </h3>
                  <div className={s.categoryGrid}>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleFilterChange("category", category)}
                        className={`${s.categoryButton} ${
                          filters.category.includes(category)
                            ? s.categoryButtonActive
                            : s.categoryButtonInactive
                        }`}
                      >
                        <span>{category}</span>
                        <span
                          className={`${s.categoryCount} ${
                            filters.category.includes(category)
                              ? s.categoryCountActive
                              : s.categoryCountInactive
                          }`}
                        >
                          {
                            jobs.filter((job) => job.category === category)
                              .length
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className={s.activeFiltersSection}>
                    <h4 className={s.activeFiltersTitle}>Active Filters</h4>
                    <div className={s.activeFiltersWrapper}>
                      {filters.jobType.map((type) => (
                        <span
                          key={type}
                          className={`${s.filterTag} ${s.filterTagBlue}`}
                        >
                          {normalizeJobTypeForDisplay(type)}
                          <button
                            onClick={() => handleFilterChange("jobType", type)}
                            className={s.filterTagClose}
                          >
                            <X className={s.filterTagCloseIcon} />
                          </button>
                        </span>
                      ))}
                      {filters.category.map((cat) => (
                        <span
                          key={cat}
                          className={`${s.filterTag} ${s.filterTagGreen}`}
                        >
                          {cat}
                          <button
                            onClick={() => handleFilterChange("category", cat)}
                            className={s.filterTagClose}
                          >
                            <X className={s.filterTagCloseIcon} />
                          </button>
                        </span>
                      ))}
                      {filters.minSalary && (
                        <span className={`${s.filterTag} ${s.filterTagYellow}`}>
                          Min: {filters.minSalary}
                          <button
                            onClick={() => handleFilterChange("minSalary", "")}
                            className={s.filterTagClose}
                          >
                            <X className={s.filterTagCloseIcon} />
                          </button>
                        </span>
                      )}
                      {filters.maxSalary && (
                        <span className={`${s.filterTag} ${s.filterTagYellow}`}>
                          Max: {filters.maxSalary}
                          <button
                            onClick={() => handleFilterChange("maxSalary", "")}
                            className={s.filterTagClose}
                          >
                            <X className={s.filterTagCloseIcon} />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job cards */}
          <div className={s.jobCardsContainer}>
            <div className={s.jobCardsGrid}>
              {displayedJobs.map((job) => (
                <div key={job.id} className={s.jobCard}>
                  <div className={s.jobCardContent}>
                    <div className={s.jobCardHeader}>
                      <div className={s.logoContainer}>{renderLogo(job)}</div>
                      <div className={s.jobInfo}>
                        <h3 className={s.jobTitle}>{job.role}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={s.companyName}>{job.company}</p>
                        </div>
                      </div>
                    </div>

                    <div className={s.techStackContainer}>
                      {(job.techStack || []).slice(0, 6).map((tech, index) => (
                        <span key={index} className={s.techTag}>
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className={s.jobDetailsGrid}>
                      <div className={s.detailItem}>
                        <div
                          className={`${s.detailIconWrapper} ${s.detailIconWrapperBlue}`}
                        >
                          <MapPin
                            className={`${s.detailIcon} ${s.detailIconBlue}`}
                          />
                        </div>
                        <div>
                          <span className={`${s.detailTag} ${s.detailTagBlue}`}>
                            {job.location}
                          </span>
                        </div>
                      </div>

                      <div className={s.detailItem}>
                        <div
                          className={`${s.detailIconWrapper} ${s.detailIconWrapperPurple}`}
                        >
                          <Users
                            className={`${s.detailIcon} ${s.detailIconPurple}`}
                          />
                        </div>
                        <div>
                          <span
                            className={`${s.detailTag} ${getExperienceColor(job.experienceLevel)}`}
                          >
                            {job.experience}
                          </span>
                        </div>
                      </div>

                      <div className={s.detailItem}>
                        <div
                          className={`${s.detailIconWrapper} ${s.detailIconWrapperGreen}`}
                        >
                          <BadgeIndianRupee
                            className={`${s.detailIcon} ${s.detailIconGreen}`}
                          />
                        </div>
                        <div>
                          <span
                            className={`${s.detailTag} ${s.detailTagGreen}`}
                          >
                            {formatSalary(job.salary, job.salaryType)}
                          </span>
                        </div>
                      </div>

                      <div className={s.detailItem}>
                        <div
                          className={`${s.detailIconWrapper} ${s.detailIconWrapperOrange}`}
                        >
                          <Briefcase
                            className={`${s.detailIcon} ${s.detailIconOrange}`}
                          />
                        </div>
                        <div>
                          <span
                            className={`${s.detailTag} ${getJobTypeColor(job.jobType)}`}
                          >
                            {normalizeJobTypeForDisplay(job.jobType)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={s.jobFooter}>
                      <div className={s.dateWrapper}>
                        <Calendar className={s.dateIcon} />
                        <span className={s.dateText}>
                          {formatDate(job.datePosted)}
                        </span>
                      </div>
                      <span
                        className={`${s.categoryTag} ${getCategoryColor(job.category)}`}
                      >
                        {job.category}
                      </span>
                    </div>

                    <div className={s.actionButtons}>
                      <a
                        className={`${s.applyButton} ${
                          appliedJobs.includes(String(job.id))
                            ? s.applyButtonApplied
                            : s.applyButtonActive
                        }`}
                        onClick={(e) => {
                          e?.preventDefault?.();
                          if (!appliedJobs.includes(String(job.id))) {
                            openConfirmToast(job);
                          }
                        }}
                      >
                        {appliedJobs.includes(String(job.id))
                          ? "Applied"
                          : "Apply Now"}
                        <ExternalLink className={s.applyIcon} />
                      </a>

                      <div className={s.actionIcons}>
                        <Link
                          to={`/jobdetails/${job.id}`}
                          className={s.viewButton}
                          aria-label="View job details"
                        >
                          <Eye className={s.viewIcon} />
                        </Link>

                        <button
                          onClick={() => toggleSaveJob(job.id)}
                          aria-label={
                            savedJobs.includes(String(job.id))
                              ? "Unsave job"
                              : "Save job"
                          }
                          className={`${s.saveButton} ${
                            savedJobs.includes(String(job.id))
                              ? s.saveButtonActive
                              : s.saveButtonInactive
                          }`}
                        >
                          <Bookmark className={s.saveIcon} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && !loading && (
              <div className={s.emptyState}>
                <div className={s.emptyStateIconWrapper}>
                  <Search className={s.emptyStateIcon} />
                </div>
                <h3 className={s.emptyStateTitle}>No matching jobs found</h3>
                <p className={s.emptyStateText}>
                  Try adjusting your search terms or filters to find what you're
                  looking for.
                </p>
                <button onClick={clearFilters} className={s.resetButton}>
                  Reset All Filters
                </button>
              </div>
            )}

            {filteredJobs.length > jobsPerPage && (
              <div className={s.paginationWrapper}>
                <div className={s.paginationContainer}>
                  <div className={s.paginationInner}>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={s.paginationButton}
                    >
                      Previous
                    </button>

                    <div className={s.pageNumbers}>
                      {getPageNumbers().map((pageNum, index) =>
                        pageNum === "..." ? (
                          <span key={`dots-${index}`} className={s.pageDots}>
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`${s.pageNumber} ${
                              currentPage === pageNum
                                ? s.pageNumberActive
                                : s.pageNumberInactive
                            }`}
                          >
                            {pageNum}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={s.paginationButton}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation toast */}
      {confirmToast.open && (
        <div role="dialog" aria-modal="false" className={s.confirmToast}>
          <div className={s.confirmToastContent}>
            <div className={s.confirmToastIcon}>
              <ExternalLink className={s.confirmToastIconSvg} />
            </div>
            <div className={s.confirmToastBody}>
              <h4 className={s.confirmToastTitle}>Confirm Application</h4>
              <p className={s.confirmToastMessage}>
                Are you sure you want to apply for{" "}
                <span className="font-medium">{confirmToast.role}</span> at{" "}
                <span className="font-medium">{confirmToast.company}</span>?
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
                  className={s.closeToastButton}
                >
                  <X className={s.closeToastIcon} />
                </button>
              </div>
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

export default FindJobPage;
