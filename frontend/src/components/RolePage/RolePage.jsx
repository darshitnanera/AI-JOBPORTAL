import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Bookmark,
  Building2,
  CheckCircle2,
  RotateCcw,
  Search,
  Target,
} from "lucide-react";
import Toast from "../Common/Toast";
import { apiUrl } from "../../utils/api";

const STORAGE_KEY = "savedQuestionIds";

const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const getToken = () => {
  try {
    const raw = localStorage.getItem("jobportal_user");
    return raw ? JSON.parse(raw).token || null : null;
  } catch {
    return null;
  }
};

const initialOf = (name) =>
  String(name || "?")
    .trim()
    .charAt(0)
    .toUpperCase() || "?";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const QuestionSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-5 space-y-2">
      <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="mt-5 flex gap-2">
      {[72, 88, 64].map((w, i) => (
        <div
          key={i}
          style={{ width: w }}
          className="h-6 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
  </div>
);

const StateCard = ({ icon, tone = "brand", title, description, children }) => {
  const Icon = icon;
  return (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
    <div
      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
        tone === "danger" ? "bg-danger-50 dark:bg-danger-500/10" : "bg-brand-50 dark:bg-brand-500/10"
      }`}
    >
      <Icon
        size={24}
        className={tone === "danger" ? "text-danger-600" : "text-brand-600 dark:text-brand-400"}
        aria-hidden="true"
      />
    </div>
    <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
      {title}
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
    {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
  </div>
  );
};

const RolePage = () => {
  const location = useLocation();
  const params = useParams();

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState(null);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);

  const [imageErrors, setImageErrors] = useState({});
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const roleSlug = params.roleSlug || location?.state?.selectedRoleSlug || null;

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const res = await fetch(apiUrl("/api/interview/roles"));
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `Request failed (${res.status})`);
      const list = data.roles || [];
      setRoles(list);
      setSelectedRoleId((current) => {
        if (current && list.some((r) => r._id === current)) return current;
        const matched = list.find(
          (r) => r._id === roleSlug || slugify(r.roleName) === roleSlug,
        );
        return matched?._id || list[0]?._id || null;
      });
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
      setRolesError(
        err?.message === "Failed to fetch"
          ? "The server didn't respond. Check your connection and try again."
          : err?.message || "We couldn't load roles right now.",
      );
    } finally {
      setRolesLoading(false);
    }
  }, [roleSlug]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const fetchQuestions = useCallback(async () => {
    if (!selectedRoleId) return;
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const res = await fetch(apiUrl(`/api/interview/role/${selectedRoleId}`));
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `Request failed (${res.status})`);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Error fetching role questions:", err);
      setQuestions([]);
      setQuestionsError(
        err?.message === "Failed to fetch"
          ? "The server didn't respond. Check your connection and try again."
          : err?.message || "We couldn't load questions for this role.",
      );
    } finally {
      setQuestionsLoading(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      (async () => {
        try {
          const res = await fetch(apiUrl("/api/saved"), {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!data.success) return;
          const ids = [
            ...(data.savedInterviewQuestions || []).map((q) => `company:${q._id}`),
            ...(data.savedRoleQuestions || []).map((q) => `role:${q._id}`),
          ];
          setSavedIds(ids);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch (err) {
          console.error("Error fetching saved questions:", err);
        }
      })();
    }

    const handler = (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        setSavedIds(e.newValue ? JSON.parse(e.newValue) : []);
      } catch {
        setSavedIds([]);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleSave = async (id) => {
    const token = getToken();
    if (!token) {
      setToast({ show: true, message: "Please login to save this question.", type: "error" });
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/saved/question/${id}?type=role`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        setToast({
          show: true,
          message: data.message || "Failed to save question.",
          type: "error",
        });
        return;
      }
      const key = `role:${id}`;
      setSavedIds((prev) => {
        const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error("Error saving question:", err);
      setToast({ show: true, message: "An error occurred while saving.", type: "error" });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <Target size={22} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Role-Ready Interviews
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Practice the questions that actually get asked for your target role, with model answers and
          the companies that asked them.
        </p>
      </header>

      {/* Role selector */}
      {rolesLoading ? (
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : rolesError ? (
        <StateCard
          icon={AlertTriangle}
          tone="danger"
          title="We couldn't load roles"
          description={rolesError}
        >
          <button type="button" onClick={fetchRoles} className={PRIMARY_BTN}>
            <RotateCcw size={16} aria-hidden="true" />
            Try again
          </button>
        </StateCard>
      ) : roles.length === 0 ? (
        <StateCard
          icon={Target}
          title="No roles published yet"
          description="Role-specific interview prep hasn't been added yet. Open jobs are live now — start there and come back once question sets land."
        >
          <Link to="/jobs" className={PRIMARY_BTN}>
            <Search size={16} aria-hidden="true" />
            Browse jobs
          </Link>
          <Link to="/companies" className={SECONDARY_BTN}>
            Company questions
          </Link>
        </StateCard>
      ) : (
        <div className="flex flex-wrap gap-3">
          {roles.map((role) => {
            const isActive = selectedRoleId === role._id;
            const showImage = role.image && !imageErrors[role._id];
            return (
              <button
                key={role._id}
                type="button"
                onClick={() => setSelectedRoleId(role._id)}
                aria-pressed={isActive}
                className={`inline-flex max-w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                    isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {showImage ? (
                    <img
                      src={role.image}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setImageErrors((prev) => ({ ...prev, [role._id]: true }))}
                    />
                  ) : (
                    <span
                      className={`text-xs font-bold ${
                        isActive ? "text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {initialOf(role.roleName)}
                    </span>
                  )}
                </span>
                <span className="truncate">{role.roleName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Questions */}
      {roles.length > 0 && (
        <section className="space-y-5">
          {questionsLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <QuestionSkeleton key={i} />
              ))}
            </div>
          ) : questionsError ? (
            <StateCard
              icon={AlertTriangle}
              tone="danger"
              title="We couldn't load these questions"
              description={questionsError}
            >
              <button type="button" onClick={fetchQuestions} className={PRIMARY_BTN}>
                <RotateCcw size={16} aria-hidden="true" />
                Try again
              </button>
            </StateCard>
          ) : questions.length === 0 ? (
            <StateCard
              icon={Target}
              title="No questions for this role yet"
              description="This role doesn't have a question set published. Try another role above, or look at what companies have been asking."
            >
              <Link to="/companies" className={PRIMARY_BTN}>
                Company questions
              </Link>
              <Link to="/jobs" className={SECONDARY_BTN}>
                Browse jobs
              </Link>
            </StateCard>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-slate-50">
                  {questions.length}
                </span>{" "}
                question{questions.length === 1 ? "" : "s"} for this role
              </p>
              <div className="grid gap-6">
                {questions.map((q, index) => {
                  const isSaved = savedIds.includes(`role:${q._id}`);
                  const askedBy = Array.isArray(q.askedBy) ? q.askedBy : [];
                  return (
                    <article
                      key={q._id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="min-w-0 text-lg font-bold leading-snug text-slate-900 dark:text-slate-50">
                          {index + 1}. {String(q.question).replace(/^\d+\.\s*/, "")}
                        </h3>
                        <button
                          type="button"
                          onClick={() => toggleSave(q._id)}
                          aria-pressed={isSaved}
                          aria-label={isSaved ? "Unsave question" : "Save question"}
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                            isSaved
                              ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {q.answer && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                            Recommended answer
                          </h4>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {q.answer}
                          </p>
                        </div>
                      )}

                      {Array.isArray(q.keyPoints) && q.keyPoints.length > 0 && (
                        <div className="mt-5">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                            Key points
                          </h4>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {q.keyPoints.map((point, idx) => (
                              <li
                                key={idx}
                                className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-600/20 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25"
                              >
                                <CheckCircle2
                                  size={14}
                                  className="text-success-600"
                                  aria-hidden="true"
                                />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {askedBy.length > 0 && (
                        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                            <Building2 size={14} className="text-slate-400" aria-hidden="true" />
                            Asked in
                          </h4>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {askedBy.map((item, idx) => {
                              const name = item?.companyName || "Unknown company";
                              const date = item?.dateAsked;
                              const when =
                                date && (date.includes("-") || date.includes("/"))
                                  ? timeAgo(date)
                                  : date;
                              return (
                                <li
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                                >
                                  {name}
                                  {when && (
                                    <span className="font-normal text-slate-500 dark:text-slate-400">
                                      · {when}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
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

export default RolePage;
