import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
} from "lucide-react";
import { viewApplicantsPageStyles as s } from "../../assets/dummyStyles";

const ViewApplicantsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobId, role, companyName } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/application/${jobId}/applicants`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (data.success) {
          const mapped = data.applicants.map((app) => ({
            id: app.applicationId,
            name: app.name,
            email: app.email,
            phone: app.phone,
            appliedForRole: role || data.jobName,
            appliedAt: app.appliedDate,
            resumeFile: app.resume,
            userId: app._id,
          }));
          setFiltered(mapped);
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [jobId, role]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleViewResume = (resumeUrl, userId) => {
    if (!resumeUrl) return;
    const fullUrl = `http://localhost:5000/api/user/resume/${userId}`;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={s.pageContainer}>
      <button
        onClick={() => navigate(-1)}
        className={s.backButton}
        aria-label="Back"
      >
        <ArrowLeft className={s.backIcon} />
      </button>

      <div className={s.contentWrapper}>
        <div className={s.headerWrapper}>
          <h1 className={s.headerTitle}>
            <Users className={s.headerIcon} />
            <span className={s.headerText}>
              {role ? `${role} — Applicants` : "All Applicants"}
            </span>
          </h1>
        </div>

        {companyName && (
          <div className={s.companyWrapper}>
            <div className={s.companyBadge}>
              <span className={s.companyName}>{companyName}</span>
              <span className={s.activeBadge}>
                <span className={s.activeDot}></span>
                active
              </span>
            </div>
          </div>
        )}

        <div className={s.containerCard}>
          {loading ? (
            <div className={s.loadingWrapper}>
              <div className={s.spinner}></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={s.emptyWrapper}>
              <div className={s.emptyIconCircle}>
                <Users className={s.emptyIcon} />
              </div>
              <p className={s.emptyTitle}>No applicants found</p>
              <p className={s.emptySubtitle}>
                Try going back or clear filters on the dashboard
              </p>
            </div>
          ) : (
            <div className={s.grid}>
              {filtered.map((app, index) => (
                <div
                  key={app.id}
                  className={s.cardBase}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={s.cardInner}>
                    <p className={s.applicantName}>{app.name}</p>

                    <div className={s.contactInfo}>
                      <div className={s.contactRow}>
                        <Mail className={s.emailIcon} />
                        <span className={s.emailText}>{app.email}</span>
                      </div>
                      <div className={s.contactRow}>
                        <Phone className={s.phoneIcon} />
                        <span>{app.phone}</span>
                      </div>
                    </div>

                    <div className={s.detailsWrapper}>
                      <div className={s.roleRow}>
                        <Briefcase className={s.roleIcon} />
                        <span className={s.roleBadge}>
                          {app.appliedForRole}
                        </span>
                      </div>
                      <div className={s.dateRow}>
                        <Calendar className={s.dateIcon} />
                        <span className={s.dateBadge}>
                          {formatDate(app.appliedAt)}
                        </span>
                      </div>
                    </div>

                    <div className={s.buttonWrapper}>
                      {app.resumeFile ? (
                        <button
                          onClick={() =>
                            handleViewResume(app.resumeFile, app.userId)
                          }
                          className={s.resumeButton}
                        >
                          <span className={s.resumeButtonInner}>
                            <svg
                              className={s.resumeIcon}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span>View Resume</span>
                          </span>
                        </button>
                      ) : (
                        <span className={s.noResumeText}>
                          No resume provided
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gentleFadeUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .group { animation: gentleFadeUp 0.45s ease-out forwards; opacity: 0; }
      `}</style>
    </div>
  );
};

export default ViewApplicantsPage;
