import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Bookmark,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Lightbulb,
  RotateCcw,
  Search,
} from "lucide-react";
import Toast from "../Common/Toast";
import API, { apiUrl } from "../../utils/api";

const STORAGE_KEY = "savedQuestionIds";
const VISIBLE_COUNT = 10;

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

const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-5 space-y-2">
      <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
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

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const CompanyPage = () => {
  const params = useParams();
  const location = useLocation();

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedCompanyData, setSelectedCompanyData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);

  const [showAll, setShowAll] = useState(false);
  const [logoErrors, setLogoErrors] = useState({});
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const preferredId = location?.state?.companyId || params?.companyId || null;

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    setCompaniesError(null);
    try {
      const response = await API.get("/api/interview/companies");
      if (!response.data?.success) throw new Error(response.data?.message || "Request failed");
      const list = response.data.companies || [];
      setCompanies(list);
      setSelectedCompany((current) => {
        if (current && list.some((c) => c._id === current)) return current;
        if (preferredId && list.some((c) => c._id === preferredId)) return preferredId;
        return list[0]?._id || null;
      });
    } catch (err) {
      console.error("Failed to fetch companies", err);
      setCompanies([]);
      setCompaniesError(
        err?.response?.data?.message ||
          err?.message ||
          "We couldn't reach the interview hub right now.",
      );
    } finally {
      setCompaniesLoading(false);
    }
  }, [preferredId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchQuestions = useCallback(async () => {
    if (!selectedCompany) return;
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const response = await API.get(`/api/interview/company/${selectedCompany}`);
      if (!response.data?.success) throw new Error(response.data?.message || "Request failed");
      setQuestions(response.data.questions || []);
      setSelectedCompanyData(response.data.company || null);
    } catch (err) {
      console.error("Failed to fetch questions", err);
      setQuestions([]);
      setQuestionsError(
        err?.response?.data?.message ||
          err?.message ||
          "We couldn't load questions for this company.",
      );
    } finally {
      setQuestionsLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    setShowAll(false);
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
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
  }, []);

  useEffect(() => {
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
      const res = await fetch(apiUrl(`/api/saved/question/${id}?type=interview`), {
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
      const key = `company:${id}`;
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

  const visibleQuestions = showAll ? questions : questions.slice(0, VISIBLE_COUNT);

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <Building2 size={22} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Company Interview Hub
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Real interview questions and recommended answers, grouped by the company that asked them.
        </p>
      </header>

      {/* Company selector */}
      {companiesLoading ? (
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 w-36 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : companiesError ? (
        <StateCard
          icon={AlertTriangle}
          tone="danger"
          title="We couldn't load companies"
          description={companiesError}
        >
          <button type="button" onClick={fetchCompanies} className={PRIMARY_BTN}>
            <RotateCcw size={16} aria-hidden="true" />
            Try again
          </button>
        </StateCard>
      ) : companies.length === 0 ? (
        <StateCard
          icon={Building2}
          title="No companies yet"
          description="Interview questions haven't been published for any company yet. Browse open jobs in the meantime — that's where the hiring happens."
        >
          <Link to="/jobs" className={PRIMARY_BTN}>
            <Search size={16} aria-hidden="true" />
            Browse jobs
          </Link>
        </StateCard>
      ) : (
        <div className="flex flex-wrap gap-3">
          {companies.map((company) => {
            const isSelected = selectedCompany === company._id;
            const showLogo = company.logo && !logoErrors[company._id];
            return (
              <button
                key={company._id}
                type="button"
                onClick={() => setSelectedCompany(company._id)}
                aria-pressed={isSelected}
                className={`inline-flex max-w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  isSelected
                    ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                    isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {showLogo ? (
                    <img
                      src={company.logo}
                      alt=""
                      className="h-full w-full object-contain"
                      onError={() =>
                        setLogoErrors((prev) => ({ ...prev, [company._id]: true }))
                      }
                    />
                  ) : (
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {initialOf(company.companyName)}
                    </span>
                  )}
                </span>
                <span className="truncate">{company.companyName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Questions */}
      {companies.length > 0 && (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {selectedCompanyData
                ? `${selectedCompanyData.companyName} interview questions`
                : "Interview questions"}
            </h2>
            {!questionsLoading && !questionsError && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {questions.length} question{questions.length === 1 ? "" : "s"} available
              </p>
            )}
          </div>

          {questionsLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
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
              icon={Lightbulb}
              title="No questions for this company yet"
              description="Nobody has contributed interview questions for this company. Pick another company above, or explore role-based questions instead."
            >
              <Link to="/roles" className={PRIMARY_BTN}>
                Explore role questions
              </Link>
              <Link to="/jobs" className={SECONDARY_BTN}>
                Browse jobs
              </Link>
            </StateCard>
          ) : (
            <>
              <div className="grid gap-6">
                {visibleQuestions.map((question, index) => {
                  const isSaved = savedIds.includes(`company:${question._id}`);
                  const points = question.keyPoints || [];
                  return (
                    <article
                      key={question._id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {question.postDate && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <CalendarDays size={14} aria-hidden="true" />
                              {new Date(question.postDate).toLocaleDateString()}
                            </span>
                          )}
                          <h3 className="mt-2 text-lg font-bold leading-snug text-slate-900 dark:text-slate-50">
                            {index + 1}. {String(question.question).replace(/^\d+\.\s*/, "")}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSave(question._id)}
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

                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-50">
                          <Lightbulb
                            size={16}
                            className="text-warning-600"
                            aria-hidden="true"
                          />
                          Recommended answer
                        </h4>
                        {question.answer && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {question.answer}
                          </p>
                        )}
                        {points.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {points.map((point, i) => (
                              <li
                                key={i}
                                className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                              >
                                <CircleDashed
                                  size={16}
                                  className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400"
                                  aria-hidden="true"
                                />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {questions.length > VISIBLE_COUNT && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className={SECONDARY_BTN}
                  >
                    {showAll ? (
                      <>
                        <ChevronUp size={16} aria-hidden="true" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} aria-hidden="true" />
                        Show all {questions.length} questions
                      </>
                    )}
                  </button>
                </div>
              )}
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

export default CompanyPage;
