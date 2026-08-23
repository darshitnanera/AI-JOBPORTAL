import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileQuestion,
  Filter,
  Loader2,
  MessagesSquare,
  Pencil,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";
import QuestionForm from "./QuestionForm";
import {
  BADGE_BRAND,
  BADGE_NEUTRAL,
  CARD,
  CARD_INTERACTIVE,
  CATEGORIES,
  DANGER_BTN,
  DIFFICULTY_BADGE,
  H1,
  INPUT,
  LABEL,
  MAIN,
  MUTED,
  PAGE,
  PRIMARY_BTN,
  SECONDARY_BTN,
  SKELETON,
  SMALL_BTN,
  SUBTITLE,
} from "./ui";

const ALL = "";

const ListSkeleton = () => (
  <div className="space-y-4">
    {[0, 1, 2].map((row) => (
      <div key={row} className={CARD}>
        <div className={`${SKELETON} h-4 w-1/3`} />
        <div className={`${SKELETON} mt-4 h-3 w-full`} />
        <div className={`${SKELETON} mt-2 h-3 w-4/5`} />
        <div className="mt-4 flex gap-2">
          <div className={`${SKELETON} h-6 w-20 rounded-full`} />
          <div className={`${SKELETON} h-6 w-16 rounded-full`} />
        </div>
      </div>
    ))}
  </div>
);

export default function RecruiterInterviewManager() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    roles: [],
    categories: CATEGORIES,
  });
  const [filters, setFilters] = useState({ company: ALL, role: ALL, category: ALL });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/api/mock-interview/questions", {
        params: {
          company: filters.company || undefined,
          role: filters.role || undefined,
          category: filters.category || undefined,
        },
      });
      setQuestions(data?.questions || []);
      if (data?.filters) {
        setFilterOptions({
          companies: data.filters.companies || [],
          roles: data.filters.roles || [],
          categories: data.filters.categories || CATEGORIES,
        });
      }
    } catch (fetchError) {
      setError(
        fetchError?.response?.data?.message ||
          "We couldn't load your interview questions."
      );
    } finally {
      setLoading(false);
    }
  }, [filters.company, filters.role, filters.category]);

  useEffect(() => {
    // AuthContext hydrates from localStorage in an effect, so `user` is null
    // on the very first render — redirecting before that lands would bounce
    // every signed-in recruiter to /login.
    if (authLoading) return;

    const type = user?.userType || user?.role;
    if (!user || type !== "recruiter") {
      navigate("/login");
      return;
    }
    fetchQuestions();
  }, [user, authLoading, navigate, fetchQuestions]);

  const flashNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  };

  const handleCreate = async (payload) => {
    const { data } = await API.post("/api/mock-interview/questions", payload);
    setQuestions((prev) => [data.question, ...prev]);
    setFilterOptions((prev) => ({
      ...prev,
      companies: [...new Set([...prev.companies, data.question.companyName])].sort(),
      roles: [...new Set([...prev.roles, data.question.targetRole])].sort(),
    }));
    flashNotice("Question published to the candidate practice bank.");
  };

  const handleUpdate = (id) => async (payload) => {
    const { data } = await API.put(`/api/mock-interview/questions/${id}`, payload);
    setQuestions((prev) =>
      prev.map((question) => (question._id === id ? data.question : question))
    );
    setEditingId(null);
    flashNotice("Question updated.");
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setActionError("");
    try {
      await API.delete(`/api/mock-interview/questions/${id}`);
      setQuestions((prev) => prev.filter((question) => question._id !== id));
      setConfirmingId(null);
      flashNotice("Question deleted.");
    } catch (deleteError) {
      setActionError(
        deleteError?.response?.data?.message ||
          "We couldn't delete that question."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = Boolean(filters.company || filters.role || filters.category);

  const totalQuestions = useMemo(() => questions.length, [questions]);

  return (
    <div className={PAGE}>
      <Navbar />

      <main className={MAIN}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={H1}>Mock interview question bank</h1>
            <p className={SUBTITLE}>
              Questions you publish here power the candidate mock interview
              simulator. Every answer is scored against the key points you
              provide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={BADGE_BRAND}>
              <MessagesSquare size={14} />
              {totalQuestions} question{totalQuestions === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={fetchQuestions}
              disabled={loading}
              className={SECONDARY_BTN}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        {notice ? (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-success-500/40 bg-success-50 px-4 py-3 text-sm font-medium text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-500">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* ── Create form ─────────────────────────────────────────────── */}
          <section id="create-question" className="lg:sticky lg:top-6 lg:self-start">
            <div className={CARD}>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Add a question
              </h2>
              <p className={`${SUBTITLE} mb-5`}>
                Candidates see the question, category and difficulty — never the
                model answer or key points.
              </p>
              <QuestionForm idPrefix="create" onSubmit={handleCreate} />
            </div>
          </section>

          {/* ── List ────────────────────────────────────────────────────── */}
          <section className="space-y-6">
            {/* Filters */}
            <div className={CARD}>
              <div className="mb-4 flex items-center gap-2">
                <Filter size={18} className="text-slate-500 dark:text-slate-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Filter your questions
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={LABEL} htmlFor="filter-company">
                    Company
                  </label>
                  <select
                    id="filter-company"
                    value={filters.company}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, company: event.target.value }))
                    }
                    className={INPUT}
                  >
                    <option value={ALL}>All companies</option>
                    {filterOptions.companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL} htmlFor="filter-role">
                    Role
                  </label>
                  <select
                    id="filter-role"
                    value={filters.role}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, role: event.target.value }))
                    }
                    className={INPUT}
                  >
                    <option value={ALL}>All roles</option>
                    {filterOptions.roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL} htmlFor="filter-category">
                    Category
                  </label>
                  <select
                    id="filter-category"
                    value={filters.category}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                    className={INPUT}
                  >
                    <option value={ALL}>All categories</option>
                    {filterOptions.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => setFilters({ company: ALL, role: ALL, category: ALL })}
                  className={`${SMALL_BTN} mt-4`}
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            {actionError ? (
              <div className="flex items-start gap-2 rounded-xl border border-danger-500/40 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            ) : null}

            {/* Loading */}
            {loading ? (
              <ListSkeleton />
            ) : error ? (
              /* Error */
              <div className={`${CARD} text-center`}>
                <AlertCircle
                  size={32}
                  className="mx-auto text-danger-600 dark:text-danger-500"
                />
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">
                  Something went wrong
                </h3>
                <p className={`${MUTED} mt-1`}>{error}</p>
                <button
                  type="button"
                  onClick={fetchQuestions}
                  className={`${PRIMARY_BTN} mt-5`}
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : questions.length === 0 ? (
              /* Empty */
              <div className={`${CARD} text-center`}>
                <FileQuestion
                  size={32}
                  className="mx-auto text-slate-400 dark:text-slate-500"
                />
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {hasFilters
                    ? "No questions match these filters"
                    : "Your question bank is empty"}
                </h3>
                <p className={`${MUTED} mt-1`}>
                  {hasFilters
                    ? "Try widening the filters, or add a question for this company and role."
                    : "Add your first question and candidates can start practising for your roles straight away."}
                </p>
                <a href="#create-question" className={`${PRIMARY_BTN} mt-5`}>
                  <MessagesSquare size={16} />
                  Add a question
                </a>
              </div>
            ) : (
              /* Loaded */
              <ul className="space-y-4">
                {questions.map((question) => {
                  const isEditing = editingId === question._id;
                  const isConfirming = confirmingId === question._id;

                  return (
                    <li key={question._id}>
                      <article className={isEditing ? CARD : CARD_INTERACTIVE}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={BADGE_NEUTRAL}>
                                <Building2 size={12} />
                                {question.companyName}
                              </span>
                              <span className={BADGE_NEUTRAL}>
                                <UserRound size={12} />
                                {question.targetRole}
                              </span>
                              <span className={BADGE_BRAND}>{question.category}</span>
                              <span
                                className={
                                  DIFFICULTY_BADGE[question.difficulty] || BADGE_NEUTRAL
                                }
                              >
                                {question.difficulty}
                              </span>
                              {!question.isActive ? (
                                <span className={BADGE_NEUTRAL}>Hidden</span>
                              ) : null}
                            </div>

                            <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                              {question.questionText}
                            </p>
                          </div>

                          {!isEditing ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(question._id);
                                  setConfirmingId(null);
                                }}
                                className={SMALL_BTN}
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(question._id)}
                                className={DANGER_BTN}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {!isEditing ? (
                          <>
                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Key points used for scoring
                              </p>
                              <ul className="mt-2 flex flex-wrap gap-2">
                                {(question.keyPoints || []).map((point, index) => (
                                  <li key={`${question._id}-kp-${index}`}>
                                    <span className={BADGE_BRAND}>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {question.modelAnswer ? (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Model answer
                                </p>
                                <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                                  {question.modelAnswer}
                                </p>
                              </div>
                            ) : null}
                          </>
                        ) : null}

                        {/* Delete confirmation */}
                        {isConfirming && !isEditing ? (
                          <div className="mt-4 rounded-xl border border-danger-500/40 bg-danger-50 p-4 dark:border-danger-500/30 dark:bg-danger-500/10">
                            <p className="text-sm font-semibold text-danger-700 dark:text-danger-500">
                              Delete this question permanently?
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              Candidates will no longer see it in the{" "}
                              {question.targetRole} session for {question.companyName}.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleDelete(question._id)}
                                disabled={deletingId === question._id}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-danger-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId === question._id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                                Yes, delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                disabled={deletingId === question._id}
                                className={SMALL_BTN}
                              >
                                Keep it
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {/* Inline edit */}
                        {isEditing ? (
                          <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Editing question
                            </h3>
                            <QuestionForm
                              idPrefix={`edit-${question._id}`}
                              compact
                              initial={{
                                companyName: question.companyName,
                                targetRole: question.targetRole,
                                questionText: question.questionText,
                                category: question.category,
                                difficulty: question.difficulty,
                                modelAnswer: question.modelAnswer || "",
                                keyPoints: question.keyPoints || [],
                              }}
                              submitLabel="Save changes"
                              onSubmit={handleUpdate(question._id)}
                              onCancel={() => setEditingId(null)}
                            />
                          </div>
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
