import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Code2,
  Download,
  Eye,
  EyeOff,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Route,
  Target,
} from "lucide-react";
import Navbar from "../../../components/Navbar/Navbar";
import { useInterview } from "../hooks/useInterview";

const PLAIN_CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const SECTIONS = [
  { id: "technical", label: "Technical questions", icon: Code2 },
  { id: "behavioral", label: "Behavioural questions", icon: MessageSquare },
  { id: "roadmap", label: "Preparation road map", icon: Route },
  { id: "report", label: "Feedback report", icon: ClipboardCheck },
];

const scoreTone = (score) => {
  if (score >= 75)
    return {
      text: "text-success-700 dark:text-success-500",
      bar: "bg-success-500",
      chip: "bg-success-50 text-success-700 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500",
    };
  if (score >= 50)
    return {
      text: "text-warning-700 dark:text-warning-500",
      bar: "bg-warning-500",
      chip: "bg-warning-50 text-warning-700 ring-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500",
    };
  return {
    text: "text-danger-700 dark:text-danger-500",
    bar: "bg-danger-500",
    chip: "bg-danger-50 text-danger-700 ring-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500",
  };
};

const severityChip = (severity) => {
  switch (severity) {
    case "high":
      return "bg-danger-50 text-danger-700 ring-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500";
    case "medium":
      return "bg-warning-50 text-warning-700 ring-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500";
    default:
      return "bg-success-50 text-success-700 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500";
  }
};

/* ---------------------------------------------------------------- states */

const InterviewSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
    <div className={`${PLAIN_CARD} space-y-3`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
    <div className="space-y-6">
      <div className={PLAIN_CARD}>
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 h-6 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-8 h-32 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------- practice view */

const PracticeSection = ({
  title,
  questions,
  answers,
  onAnswerChange,
  index,
  setIndex,
  icon,
}) => {
  const Icon = icon;
  const [revealed, setRevealed] = useState(false);

  if (!questions?.length) {
    return (
      <div className={`${PLAIN_CARD} flex flex-col items-center gap-3 text-center`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon size={20} />
        </span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
          No {title.toLowerCase()} in this plan
        </h2>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          The analysis didn&apos;t return any questions for this section. Generate a
          new plan with a fuller job description to get more.
        </p>
      </div>
    );
  }

  const safeIndex = Math.min(index, questions.length - 1);
  const question = questions[safeIndex];
  const progress = ((safeIndex + 1) / questions.length) * 100;
  const answeredCount = questions.filter((_, i) => answers[i]?.trim()).length;

  const goTo = (next) => {
    setRevealed(false);
    setIndex(Math.max(0, Math.min(questions.length - 1, next)));
  };

  return (
    <div className="space-y-6">
      {/* progress */}
      <div className={PLAIN_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Question {safeIndex + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>

        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={safeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to question ${i + 1}`}
              className={[
                "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                i === safeIndex
                  ? "bg-brand-600 text-white"
                  : answers[i]?.trim()
                    ? "bg-success-50 text-success-700 ring-1 ring-success-500/25 dark:bg-success-500/10 dark:text-success-500"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              ].join(" ")}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* question card */}
      <div className={PLAIN_CARD}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            Q{safeIndex + 1}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {question.question}
          </h3>
        </div>

        <div className="mt-6">
          <label
            htmlFor={`answer-${safeIndex}`}
            className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Your answer
          </label>
          <textarea
            id={`answer-${safeIndex}`}
            rows={7}
            value={answers[safeIndex] || ""}
            onChange={(e) => onAnswerChange(safeIndex, e.target.value)}
            placeholder="Answer out loud, then type the key points you covered…"
            className={`${INPUT} resize-y`}
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Your draft stays in this browser tab — it isn&apos;t sent anywhere or scored.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
          <button
            type="button"
            className={SECONDARY_BTN}
            onClick={() => goTo(safeIndex - 1)}
            disabled={safeIndex === 0}
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <button
            type="button"
            className={SECONDARY_BTN}
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
            {revealed ? "Hide model answer" : "Show model answer"}
          </button>
          <button
            type="button"
            className={PRIMARY_BTN}
            onClick={() => goTo(safeIndex + 1)}
            disabled={safeIndex === questions.length - 1}
          >
            Next question
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* model answer */}
      {revealed && (
        <div className="space-y-6">
          <div className={PLAIN_CARD}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10">
                <Lightbulb size={18} />
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  What the interviewer is really asking
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {question.intention}
                </p>
              </div>
            </div>
          </div>

          <div className={PLAIN_CARD}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/10">
                <ClipboardCheck size={18} />
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Model answer
                </h4>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {question.answer}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ page */

const Interview = () => {
  const [activeSection, setActiveSection] = useState("technical");
  const [techIndex, setTechIndex] = useState(0);
  const [behIndex, setBehIndex] = useState(0);
  const [techAnswers, setTechAnswers] = useState({});
  const [behAnswers, setBehAnswers] = useState({});
  const [openDay, setOpenDay] = useState(null);

  const { report, loading, error, getResumePdf, getReportById } = useInterview();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const technical = useMemo(() => report?.technicalQuestions || [], [report]);
  const behavioral = useMemo(() => report?.behavioralQuestions || [], [report]);
  const plan = useMemo(() => report?.preparationPlan || [], [report]);
  const gaps = useMemo(() => report?.skillGaps || [], [report]);

  const shell = (children) => (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );

  if (loading && !report) return shell(<InterviewSkeleton />);

  if (error && !report) {
    return shell(
      <div className={`${PLAIN_CARD} flex flex-col items-center gap-3 text-center`}>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
          <AlertCircle size={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          We couldn&apos;t load this plan
        </h1>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">{error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className={SECONDARY_BTN}
            onClick={() => getReportById(interviewId)}
          >
            <RefreshCw size={16} />
            Try again
          </button>
          <Link to="/ai-suggestion" className={PRIMARY_BTN}>
            Back to suggestions
          </Link>
        </div>
      </div>,
    );
  }

  if (!report) {
    return shell(
      <div className={`${PLAIN_CARD} flex flex-col items-center gap-3 text-center`}>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Target size={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          This plan isn&apos;t available
        </h1>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          It may have been deleted. Generate a new one from your target role.
        </p>
        <Link to="/ai-suggestion" className={PRIMARY_BTN}>
          Back to suggestions
        </Link>
      </div>,
    );
  }

  const score = typeof report.matchScore === "number" ? report.matchScore : null;
  const tone = scoreTone(score ?? 0);
  const answeredTech = Object.values(techAnswers).filter((a) => a?.trim()).length;
  const answeredBeh = Object.values(behAnswers).filter((a) => a?.trim()).length;
  const totalQuestions = technical.length + behavioral.length;

  return shell(
    <>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/ai-suggestion")}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
          >
            <ArrowLeft size={16} />
            All suggestions
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {report.title || "Interview plan"}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Mock interview practice built from this job description and your profile.
          </p>
        </div>

        <button
          type="button"
          onClick={() => getResumePdf(interviewId)}
          className={PRIMARY_BTN}
          disabled={loading}
        >
          <Download size={16} />
          Download tailored resume
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-danger-500/30 bg-danger-50 p-4 dark:bg-danger-500/10">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <p className="text-sm font-medium text-danger-700 dark:text-danger-500">{error}</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ---------------------------------------------------------- sidebar */}
        <aside className="space-y-6">
          <nav className={`${PLAIN_CARD} space-y-1`} aria-label="Plan sections">
            {SECTIONS.map(({ id, label, icon }) => {
              const Icon = icon;
              return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                aria-current={activeSection === id ? "true" : undefined}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all",
                  activeSection === id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                <Icon size={18} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </button>
              );
            })}
          </nav>

          {score !== null && (
            <div className={PLAIN_CARD}>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Match score
              </p>
              <p className={`mt-2 text-4xl font-bold tracking-tight ${tone.text}`}>
                {score}
                <span className="text-2xl">%</span>
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${tone.bar} transition-all duration-700`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Calculated by the AI analysis for this job description.
              </p>
            </div>
          )}
        </aside>

        {/* ---------------------------------------------------------- content */}
        <div className="min-w-0">
          {activeSection === "technical" && (
            <PracticeSection
              title="Technical questions"
              icon={Code2}
              questions={technical}
              answers={techAnswers}
              onAnswerChange={(i, v) => setTechAnswers((p) => ({ ...p, [i]: v }))}
              index={techIndex}
              setIndex={setTechIndex}
            />
          )}

          {activeSection === "behavioral" && (
            <PracticeSection
              title="Behavioural questions"
              icon={MessageSquare}
              questions={behavioral}
              answers={behAnswers}
              onAnswerChange={(i, v) => setBehAnswers((p) => ({ ...p, [i]: v }))}
              index={behIndex}
              setIndex={setBehIndex}
            />
          )}

          {activeSection === "roadmap" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Preparation road map
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {plan.length > 0
                    ? `A ${plan.length}-day plan generated for this role.`
                    : "No plan was returned for this role."}
                </p>
              </div>

              {plan.length === 0 ? (
                <div className={`${PLAIN_CARD} flex flex-col items-center gap-3 text-center`}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    <Route size={20} />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    No road map yet
                  </h3>
                  <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
                    Generate a new plan with a fuller job description to get a
                    day-by-day preparation schedule.
                  </p>
                  <Link to="/ai-suggestion" className={PRIMARY_BTN}>
                    Generate a new plan
                  </Link>
                </div>
              ) : (
                <ol className="space-y-4">
                  {plan.map((day) => {
                    const open = openDay === day.day;
                    return (
                      <li key={day.day} className={PLAIN_CARD}>
                        <button
                          type="button"
                          onClick={() => setOpenDay(open ? null : day.day)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                            <CalendarDays size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                              Day {day.day}
                            </span>
                            <span className="block text-base font-bold text-slate-900 dark:text-slate-50">
                              {day.focus}
                            </span>
                          </span>
                          <ChevronDown
                            size={18}
                            className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </button>

                        {open && (
                          <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                            {(day.tasks || []).map((task, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                                <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                  {task}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}

          {activeSection === "report" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Feedback report
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Scores come from the AI analysis of your profile against{" "}
                  {report.title || "this role"}.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className={PLAIN_CARD}>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Profile match
                  </p>
                  <p className={`mt-2 text-3xl font-bold tracking-tight ${tone.text}`}>
                    {score !== null ? `${score}%` : "Not scored"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Returned by the analysis for this job description.
                  </p>
                </div>

                <div className={PLAIN_CARD}>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Questions practised
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {answeredTech + answeredBeh}
                    <span className="text-xl text-slate-500 dark:text-slate-400">
                      /{totalQuestions}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {answeredTech} technical · {answeredBeh} behavioural, drafted in this
                    session.
                  </p>
                </div>

                <div className={PLAIN_CARD}>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Skill gaps found
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {gaps.length}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {gaps.filter((g) => g.severity === "high").length} high priority.
                  </p>
                </div>
              </div>

              <div className={PLAIN_CARD}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  Skill gaps
                </h3>
                {gaps.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    The analysis didn&apos;t flag any missing skills for this role.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Skills named in the job description that weren&apos;t found in your
                      profile.
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {gaps.map((gap, index) => (
                        <li key={`${gap.skill}-${index}`}>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityChip(gap.severity)}`}
                          >
                            {gap.skill}
                            <span className="opacity-70">· {gap.severity}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className={PLAIN_CARD}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  Next steps
                </h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={SECONDARY_BTN}
                    onClick={() => setActiveSection("technical")}
                  >
                    <Code2 size={16} />
                    Practise technical questions
                  </button>
                  <button
                    type="button"
                    className={SECONDARY_BTN}
                    onClick={() => setActiveSection("roadmap")}
                  >
                    <Route size={16} />
                    Follow the road map
                  </button>
                  <Link to="/resume" className={SECONDARY_BTN}>
                    Update your resume
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
  );
};

export default Interview;
