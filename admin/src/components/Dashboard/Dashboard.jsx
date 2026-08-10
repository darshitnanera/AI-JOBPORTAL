import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  Building,
  MapPin,
  TrendingUp,
  Award,
  Filter,
  Search,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardStyles as s, statColors } from "../../assets/dummyStyles";

const Dashboard = () => {
  // Filter state
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: "0",
    closedJobs: "0",
    totalApplicants: "0",
    totalCompanies: "0",
  });
  const [toast, setToast] = useState(null);
  const [jobs, setJobs] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch Stats
        const statsRes = await fetch(
          "http://localhost:5000/api/job/admin/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const statsData = await statsRes.json();
        if (statsData.success) {
          setDashboardStats(statsData.stats);
        }

        // Fetch Jobs
        const jobsRes = await fetch(
          "http://localhost:5000/api/job/admin/jobs",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const jobsData = await jobsRes.json();
        if (jobsData.success) {
          const mappedJobs = jobsData.jobs.map((j) => ({
            id: j._id,
            name: j.companyName,
            role: j.roleName,
            location: j.location,
            category: j.category,
            logo: j.companyLogo?.startsWith("http")
              ? j.companyLogo
              : `http://localhost:5000${j.companyLogo || ""}`,
            applicants: j.applicantsCount || 0,
            status: j.status || "active",
          }));
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Handle toast auto-dismiss
  useEffect(() => {
    if (toast && !toast.confirm) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCloseJob = (jobId) => {
    setToast({
      message: "Are you sure you want to close this job?",
      type: "confirm",
      confirm: true,
      jobId,
    });
  };

  const handleConfirmClose = async () => {
    const jobId = toast.jobId;
    setToast(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/job/${jobId}/close`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Job closed successfully!", type: "success" });
        // Refresh stats and jobs list
        const statsRes = await fetch(
          "http://localhost:5000/api/job/admin/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const statsData = await statsRes.json();
        if (statsData.success) setDashboardStats(statsData.stats);

        const jobsRes = await fetch(
          "http://localhost:5000/api/job/admin/jobs",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const jobsData = await jobsRes.json();
        if (jobsData.success) {
          const mappedJobs = jobsData.jobs.map((j) => ({
            id: j._id,
            name: j.companyName,
            role: j.roleName,
            location: j.location,
            category: j.category,
            logo: j.companyLogo?.startsWith("http")
              ? j.companyLogo
              : `http://localhost:5000${j.companyLogo || ""}`,
            applicants: j.applicantsCount || 0,
            status: j.status || "active",
          }));
          setJobs(mappedJobs);
        }
      }
    } catch (error) {
      console.error("Error closing job:", error);
      setToast({ message: "Failed to close job", type: "error" });
    }
  };

  const stats = [
    {
      label: "Total Jobs",
      value: dashboardStats.totalJobs,
      icon: Briefcase,
      colors: statColors.blue,
    },
    {
      label: "Closed Jobs",
      value: dashboardStats.closedJobs,
      icon: Briefcase,
      colors: statColors.rose,
    },
    {
      label: "Total Applicants",
      value: dashboardStats.totalApplicants,
      icon: Users,
      colors: statColors.emerald,
    },
    {
      label: "Active Companies",
      value: dashboardStats.totalCompanies,
      icon: Building,
      colors: statColors.amber,
    },
  ];

  // Get unique companies and roles for filter dropdowns
  const uniqueCompanies = [...new Set(jobs.map((c) => c.name))];
  const uniqueRoles = [...new Set(jobs.map((c) => c.role))];

  // Filter jobs based on selected filters
  const filteredJobs = jobs.filter((job) => {
    const matchesCompany = companyFilter === "" || job.name === companyFilter;
    const matchesRole = roleFilter === "" || job.role === roleFilter;
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesCompany && matchesRole && matchesStatus;
  });

  // Fallback for logos that fail to load
  const handleImageError = (e) => {
    e.target.style.display = "none";
    e.target.nextSibling?.classList.remove("hidden");
  };

  // Clear all filters
  const clearFilters = () => {
    setCompanyFilter("");
    setRoleFilter("");
    setStatusFilter("active");
  };

  return (
    <div className={s.container}>
      {/* Toast Notification */}
      {toast && (
        <div className={s.toastWrapper}>
          <div
            className={`${s.toastBase} ${
              toast.type === "success"
                ? s.toastSuccess
                : toast.type === "error"
                  ? s.toastError
                  : s.toastDefault
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={20} className={s.toastIconSuccess} />
            ) : (
              <XCircle
                size={20}
                className={
                  toast.type === "error" ? s.toastIconError : s.toastIconDefault
                }
              />
            )}

            <div className={s.toastFlex}>
              <p className={s.toastMessage}>{toast.message}</p>
              {toast.confirm && (
                <div className={s.toastButtonContainer}>
                  <button
                    onClick={handleConfirmClose}
                    className={s.toastConfirmBtn}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setToast(null)}
                    className={s.toastCancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {!toast.confirm && (
              <button
                onClick={() => setToast(null)}
                className={s.toastCloseBtn}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className={s.contentWrapper}>
        {/* Header with subtle animation */}
        <div className={s.headerContainer}>
          <div>
            <h1 className={s.headerTitle}>Job Portal Dashboard</h1>
            <p className={s.headerSubtitle}>
              <TrendingUp className={s.headerIcon} />
              <span>Real-time overview of jobs and applicants</span>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={s.statsGrid}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={s.statCard}>
                <div className={s.statCardOverlay} />
                <div className={s.statCardContent}>
                  <div className={s.statCardTextContainer}>
                    <p className={s.statCardLabel}>{stat.label}</p>
                    <p className={s.statCardValue}>{stat.value}</p>
                  </div>
                  <div
                    className={`${s.statCardIconWrapper} ${stat.colors.bgLight} bg-linear-to-br ${stat.colors.gradient}`}
                  >
                    <Icon className={s.statCardIcon} strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters Section */}
        <div className={s.filtersContainer}>
          <div className={s.filtersHeader}>
            <div className={s.filtersTitleContainer}>
              <Filter className={s.filtersIcon} />
              <h2 className={s.filtersTitle}>Filters</h2>
            </div>
            {(companyFilter || roleFilter || statusFilter !== "active") && (
              <button onClick={clearFilters} className={s.filtersClearBtn}>
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>

          <div className={s.filtersGrid}>
            {/* Company filter */}
            <div className={s.filterInputContainer}>
              <label className={s.filterLabel}>Filter by Company</label>
              <div className={s.filterInputWrapper}>
                <Search className={s.filterSearchIcon} />
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className={s.filterSelect}
                >
                  <option value="">All Companies</option>
                  {uniqueCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role filter */}
            <div className={s.filterInputContainer}>
              <label className={s.filterLabel}>Filter by Role</label>
              <div className={s.filterInputWrapper}>
                <Search className={s.filterSearchIcon} />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={s.filterSelect}
                >
                  <option value="">All Roles</option>
                  {uniqueRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className={s.jobsSection}>
          <div className={s.jobsHeader}>
            <h2 className={s.jobsTitle}>
              <Building className={s.jobsTitleIcon} />
              {statusFilter === "active"
                ? "Active Roles"
                : statusFilter === "closed"
                  ? "Closed Roles"
                  : "All Roles"}
            </h2>
            <div className={s.jobsFilterContainer}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={s.jobsStatusSelect}
              >
                <option value="active">Active Jobs</option>
                <option value="closed">Closed Jobs</option>
                <option value="all">All Jobs</option>
              </select>
              <div className={s.jobsCount}>
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1 ? "job" : "jobs"}
              </div>
            </div>
          </div>

          {/* Jobs Cards Grid */}
          {loading ? (
            <div className={s.loadingContainer}>
              <div className={s.loadingSpinner}></div>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className={s.jobsGrid}>
              {filteredJobs.map((job) => (
                <div key={job.id} className={s.jobCard}>
                  {/* Subtle animated background on hover */}
                  <div className={s.jobCardOverlay} />

                  {/* Inner content */}
                  <div className={s.jobCardContent}>
                    <div className={s.jobCardHeader}>
                      {/* Company logo with fallback */}
                      <div className={s.jobLogoContainer}>
                        <div className={s.jobLogoWrapper}>
                          <img
                            src={job.logo}
                            alt={job.name}
                            className={s.jobLogo}
                            onError={handleImageError}
                          />
                          <div className={s.jobLogoFallback}>
                            <Building className={s.jobLogoFallbackIcon} />
                          </div>
                        </div>
                      </div>

                      {/* Job details */}
                      <div className={s.jobDetails}>
                        <h3 className={s.jobRole}>{job.role}</h3>
                        <p className={s.jobCompany}>
                          <Building className={s.jobCompanyIcon} />
                          {job.name}
                        </p>
                        <p className={s.jobLocation}>
                          <MapPin className={s.jobLocationIcon} />
                          {job.location}
                        </p>
                      </div>
                    </div>

                    <div className={s.jobMeta}>
                      <span className={s.jobCategory}>{job.category}</span>
                      <div className={s.jobApplicants}>
                        <Users className={s.jobApplicantsIcon} />
                        <span className={s.jobApplicantsCount}>
                          {job.applicants}
                        </span>
                        <span className={s.jobApplicantsLabel}>applicants</span>
                      </div>
                    </div>

                    <div className={s.jobActions}>
                      <button
                        onClick={() =>
                          navigate("/applicants", {
                            state: {
                              jobId: job.id,
                              role: job.role,
                              companyName: job.name,
                            },
                          })
                        }
                        className={s.viewApplicantsBtn}
                      >
                        View Applicants
                      </button>
                      {job.status === "active" && (
                        <button
                          onClick={() => handleCloseJob(job.id)}
                          className={s.closeJobBtn}
                        >
                          Close Job
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={s.emptyState}>
              <Building className={s.emptyStateIcon} />
              <h3 className={s.emptyStateTitle}>No matching jobs found</h3>
              <p className={s.emptyStateText}>Try adjusting your filters</p>
              <button onClick={clearFilters} className={s.emptyStateBtn}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inject keyframe animations */}
      <style>{s.animations}</style>
    </div>
  );
};

export default Dashboard;
