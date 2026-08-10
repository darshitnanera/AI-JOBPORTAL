import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Award,
  Dot,
  X,
} from "lucide-react";
import Toast from "../Common/Toast";
import { rolePageStyles as s } from "../../assets/dummyStyles";

const STORAGE_KEY = "savedQuestionIds";

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
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const RolePage = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const roleSlugFromUrl = params.roleSlug;
  const roleSlugFromState = location?.state?.selectedRoleSlug;

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/interview/roles");
        const data = await res.json();
        if (data.success && data.roles) {
          setRoles(data.roles);

          const initialRole =
            data.roles.find(
              (r) =>
                r._id === roleSlugFromState ||
                slugify(r.roleName) === roleSlugFromState ||
                r._id === roleSlugFromUrl ||
                slugify(r.roleName) === roleSlugFromUrl,
            ) || data.roles[0];

          if (initialRole) {
            setSelectedRoleId(initialRole._id);
          } else {
            setLoadingQuestions(false);
          }
        } else {
          setLoadingQuestions(false);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [roleSlugFromState, roleSlugFromUrl]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedRoleId) return;
      setLoadingQuestions(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/interview/role/${selectedRoleId}`,
        );
        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions);
        }
      } catch (error) {
        console.error("Error fetching role questions:", error);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [selectedRoleId]);

  useEffect(() => {
    const fetchSavedIds = async () => {
      try {
        const rawUser = localStorage.getItem("jobportal_user");
        const token = rawUser ? JSON.parse(rawUser).token : null;
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/saved", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          const qIds = [
            ...data.savedInterviewQuestions.map((q) => `company:${q._id}`),
            ...data.savedRoleQuestions.map((q) => `role:${q._id}`),
          ];
          setSavedIds(qIds);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(qIds));
        }
      } catch (error) {
        console.error("Error fetching saved questions:", error);
      }
    };

    const handler = (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          setSavedIds(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setSavedIds([]);
        }
      }
    };
    window.addEventListener("storage", handler);
    fetchSavedIds();
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleSave = async (id, openSaved = false) => {
    try {
      const rawUser = localStorage.getItem("jobportal_user");
      const token = rawUser ? JSON.parse(rawUser).token : null;
      if (!token) {
        setToast({
          show: true,
          message: "Please login to save this question.",
          type: "error",
        });
        return;
      }

      const res = await fetch(
        `http://localhost:5000/api/saved/question/${id}?type=role`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();

      if (data.success) {
        const ns = `role:${id}`;
        setSavedIds((prev) => {
          const next = prev.includes(ns)
            ? prev.filter((x) => x !== ns)
            : [...prev, ns];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });

        if (openSaved) {
          navigate("/saved", {
            state: { filterType: "role", id: selectedRoleId, focusRaw: ns },
          });
        }
      } else {
        setToast({
          show: true,
          message: data.message || "Failed to save question.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving question:", error);
      setToast({
        show: true,
        message: "An error occurred while saving.",
        type: "error",
      });
    }
  };

  return (
    <div className={s.container}>
      <div className={s.innerContainer}>
        {/* Header */}
        <div className={s.header}>
          <h1 className={s.headerTitle}>
            <span className={s.headerSpan}>Role-Ready</span> Interviews
          </h1>
          <p className={s.headerSubtitle}>
            Master your next interview with role-specific questions and company
            insights.
          </p>
        </div>

        {/* Role Selector */}
        <div className={s.roleSelector}>
          <div className={s.roleButtonsWrapper}>
            {loadingRoles ? (
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={s.roleSkeleton} />
                ))}
              </div>
            ) : (
              roles.map((role) => {
                const isActive = selectedRoleId === role._id;
                return (
                  <button
                    key={role._id}
                    onClick={() => setSelectedRoleId(role._id)}
                    className={`${s.roleButton} ${isActive ? s.roleButtonActive : s.roleButtonInactive}`}
                  >
                    <div className={s.roleImageWrapper}>
                      <img
                        src={role.image}
                        alt={role.roleName}
                        className={s.roleImage}
                      />
                    </div>

                    <span className={s.roleName}>{role.roleName}</span>

                    {isActive && (
                      <span className={s.roleActiveIndicator}>
                        <ChevronRight className={s.roleActiveIcon} />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Questions */}
        {loadingQuestions ? (
          <div className={s.questionsSkeletonGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={s.questionSkeleton} />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className={s.emptyState}>
            <Briefcase className={s.emptyStateIcon} />
            <p className={s.emptyStateText}>No questions yet for this role.</p>
          </div>
        ) : (
          <div className={s.questionsGrid}>
            {questions.map((q, index) => {
              const isSaved = savedIds.includes(`role:${q._id}`);

              return (
                <div key={q._id} className={s.questionCard}>
                  {/* Save Button */}
                  <button
                    onClick={() => toggleSave(q._id)}
                    className={`${s.saveButton} ${isSaved ? s.saveButtonActive : s.saveButtonInactive}`}
                    title={isSaved ? "Unsave" : "Save"}
                  >
                    <Bookmark className={s.saveIcon} />
                  </button>

                  {/* Question */}
                  <h3 className={s.questionTitle}>
                    {index + 1}. {q.question.replace(/^\d+\.\s*/, "")}
                  </h3>

                  {/* Answer */}
                  <div className={s.answerSection}>
                    <span className={s.answerLabel}>Answer: </span>
                    {q.answer}
                  </div>

                  {/* Key Points */}
                  {q.keyPoints && q.keyPoints.length > 0 && (
                    <div className={s.keyPointsSection}>
                      <div className={s.keyPointsLabel}>KEY POINTS</div>
                      <div className={s.keyPointsWrapper}>
                        {q.keyPoints.map((point, idx) => (
                          <span key={idx} className={s.keyPointTag}>
                            <CheckCircle2 className={s.keyPointIcon} />
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ASKED AT SECTION */}
                  <div className={s.askedAtSection}>
                    <div className={s.askedAtLabel}>
                      <Building2 className={s.askedAtIcon} />
                      Asked in
                    </div>

                    <div className={s.companiesWrapper}>
                      {Array.isArray(q.askedBy) && q.askedBy.length > 0 ? (
                        q.askedBy.map((item, idx) => {
                          const name = item?.companyName || "Unknown";
                          const date = item?.dateAsked;

                          return (
                            <div key={idx} className={s.companyTag}>
                              <span className={s.companyName}>{name}</span>

                              {date && (
                                <>
                                  <Dot className={s.companyDot} />
                                  <span className={s.companyDate}>
                                    {date.includes("-") || date.includes("/")
                                      ? timeAgo(date)
                                      : date}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className={s.noCompanyData}>No company data</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

export default RolePage;
