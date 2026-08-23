import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import {
  // lucide renamed the `</>` glyph from Code2 to CodeXml.
  CodeXml as Code2,
  Download,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Linkedin,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";

import { computeAtsScore, termsFromJobs } from "../../utils/atsScore";
import {
  aggregateSkillGaps,
  examPercent,
  examStats,
  latestMatch,
  normalizeIntegrations,
} from "./dashboardData";
import {
  AtsGauge,
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  LINK_BTN,
  MeterBar,
  PRIMARY_BTN,
  PassFailPill,
  ROW,
  RowSkeleton,
  SECONDARY_BTN,
  SectionHeader,
  SeverityPill,
} from "./DashboardParts";
import RecommendedInterviews from "./RecommendedInterviews";
import CareerActionPlan from "./CareerActionPlan";

const PLATFORM_ICON = { github: Github, linkedin: Linkedin, leetcode: Code2 };

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* ── Page ─────────────────────────────────────────────────────────────── */
const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [parsedResume, setParsedResume] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [interviewCompanies, setInterviewCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recsError, setRecsError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [integrationsError, setIntegrationsError] = useState("");
  const [examsError, setExamsError] = useState("");
  const [interviewsError, setInterviewsError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const base = import.meta.env.VITE_API_URL || "";

    const load = async (url, pick, fallback) => {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        // Carry the status so a 404 ("nothing here yet") can be told apart
        // from a genuine failure.
        const err = new Error(`Request failed (${res.status})`);
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      const picked = pick(data);
      return picked === undefined || picked === null ? fallback : picked;
    };

    // Promise.allSettled: one dead endpoint degrades only its own widget.
    const [apps, recs, resume, integ, exams, interviews] = await Promise.allSettled([
      // Route is `/user` — `/user-applications` does not exist and 404'd.
      load(`${base}/api/application/user`, (d) => d.applications, []),
      load(
        `${base}/api/job-match/recommendations?limit=10`,
        (d) => d.recommendations,
        []
      ),
      load(`${base}/api/resume/parsed`, (d) => d.parsedResume, null),
      // The controller returns the key in the singular; accept either.
      load(
        `${base}/api/integrations/profile`,
        (d) => d.integrations ?? d.integration,
        null
      ),
      // No backend route exists for this yet — see the 404 handling below.
      load(`${base}/api/exam/results`, (d) => d.results, []),
      // Company/role pairings a recruiter has published questions for.
      load(`${base}/api/mock-interview/options`, (d) => d.companies, []),
    ]);

    // Applications feed the skill-gap aggregate (they are analyzed jobs too);
    // a failure there simply contributes nothing.
    setApplications(apps.status === "fulfilled" ? apps.value : []);

    setRecommendations(recs.status === "fulfilled" ? recs.value : []);
    setRecsError(
      recs.status === "fulfilled" ? "" : "We couldn't load your job matches."
    );

    // 404 from /api/resume/parsed means "no resume on file", not an error.
    const resumeMissing =
      resume.status === "rejected" && resume.reason?.status === 404;
    setParsedResume(resume.status === "fulfilled" ? resume.value : null);
    setResumeError(
      resume.status === "fulfilled" || resumeMissing
        ? ""
        : "We couldn't load your parsed resume."
    );

    setIntegrations(integ.status === "fulfilled" ? integ.value : null);
    setIntegrationsError(
      integ.status === "fulfilled" ? "" : "We couldn't load your linked profiles."
    );

    // The exam portal has no backend route yet, so this 404s in production.
    // That is "no exams taken", not a failure to surface to the candidate.
    const examsMissing =
      exams.status === "rejected" && exams.reason?.status === 404;
    setExamResults(exams.status === "fulfilled" ? exams.value : []);
    setExamsError(
      exams.status === "fulfilled" || examsMissing
        ? ""
        : "We couldn't load your exam results."
    );

    // An empty options list is "no recruiter has published questions yet",
    // which the widget renders as an empty state, not an error.
    setInterviewCompanies(
      interviews.status === "fulfilled" ? interviews.value : []
    );
    setInterviewsError(
      interviews.status === "fulfilled"
        ? ""
        : "We couldn't load the available mock interviews."
    );

    setLoading(false);
    setRefreshing(false);
  }, [token]);

  const retry = useCallback(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    // AuthContext hydrates from localStorage in an effect, so `user` is null
    // on the first render. Redirecting before hydration finishes bounced
    // every signed-in candidate straight back to /login.
    if (authLoading) return;

    // Accept either field: older sessions stored only `role`.
    const type = user?.userType || user?.role;
    if (!user || (type !== "candidate" && type !== "user")) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [user, authLoading, navigate, fetchDashboardData]);

  /* ── Derived values — all computed from fetched data ───────────────── */

  // Keyword terms come from the roles the candidate is actually targeting.
  const ats = useMemo(
    () =>
      computeAtsScore(
        parsedResume,
        // Draw requirement keywords from every role the candidate has actually
        // engaged with. `recommendations` alone is populated by a batch job
        // that may not have run, and with an empty term list the score
        // silently collapses to formatting-only — which reported a headline
        // 100/100 for a well-structured resume that matched nothing.
        termsFromJobs([...recommendations, ...applications]),
      ),
    [parsedResume, recommendations, applications]
  );

  const match = useMemo(() => latestMatch(recommendations), [recommendations]);

  // "Every job you've analyzed" = recommended roles plus roles applied to.
  const skillGaps = useMemo(
    () => aggregateSkillGaps([...recommendations, ...applications]),
    [recommendations, applications]
  );

  const exams = useMemo(() => examStats(examResults), [examResults]);

  const profiles = useMemo(
    () => normalizeIntegrations(integrations),
    [integrations]
  );

  const hasResume = Boolean(ats);

  // The action plan reads from three sources; it only has nothing honest to
  // say when every one of them failed to load.
  const planError =
    recsError && resumeError && integrationsError
      ? "We couldn't load enough of your profile to build a plan."
      : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Your resume readiness, skill gaps and results — all from your own data.
          </p>
        </header>

        <div className="space-y-6">
          {/* ── 1. KPI cards ─────────────────────────────────────────── */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Shield}
              accent="blue"
              loading={loading}
              value={ats ? ats.overall : null}
              suffix={ats ? "/100" : null}
              label="Resume ATS score"
              footnote={
                !hasResume
                  ? "No resume parsed yet"
                  : ats?.keywords === null
                    ? "Formatting only — apply to roles to score keywords"
                    : null
              }
              action={
                hasResume ? null : (
                  <Link to="/resume" className={LINK_BTN}>
                    <Upload size={16} />
                    Upload a resume
                  </Link>
                )
              }
            />
            <KpiCard
              icon={TrendingUp}
              accent="violet"
              loading={loading}
              value={match ? match.score : null}
              suffix={match ? "/100" : null}
              label="Latest job match score"
              footnote={
                match?.roleName
                  ? `${match.roleName}${
                      match.companyName ? ` · ${match.companyName}` : ""
                    }`
                  : recsError
                    ? "Matches unavailable"
                    : "No matched roles yet"
              }
            />
            <KpiCard
              icon={Target}
              accent="red"
              loading={loading}
              value={skillGaps.length}
              label="Skills to work on"
              footnote={
                skillGaps.length
                  ? "Across your analyzed roles"
                  : "Nothing flagged in your analyzed roles"
              }
            />
            <KpiCard
              icon={GraduationCap}
              accent="emerald"
              loading={loading}
              value={exams.count > 0 ? exams.count : null}
              suffix={
                exams.count > 0 && exams.average !== null
                  ? `(${exams.average}% avg)`
                  : null
              }
              label="Exams taken"
              footnote={exams.count > 0 ? null : "No exam results on record"}
            />
          </div>

          {/* ── 2. Skill gap analysis ────────────────────────────────── */}
          <Card>
            <SectionHeader
              icon={Target}
              title="Skill gap analysis"
              subtitle="Aggregated across every job you've analyzed"
            />
            {loading ? (
              <RowSkeleton rows={4} />
            ) : recsError ? (
              <ErrorState message={recsError} onRetry={retry} />
            ) : skillGaps.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No skill gaps identified"
                message="Once your resume is matched against roles, the skills those roles ask for and yours doesn't mention will be listed here."
                action={
                  <button
                    type="button"
                    className={PRIMARY_BTN}
                    onClick={() => navigate("/jobs")}
                  >
                    Browse jobs to analyze
                  </button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {skillGaps.map((gap) => (
                  <li key={gap.name.toLowerCase()} className={ROW}>
                    <span className="min-w-0 wrap-break-word text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {gap.name}
                    </span>
                    <SeverityPill severity={gap.severity} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ── 2b. AI Career Action Plan ────────────────────────────── */}
          <CareerActionPlan
            // Remount per user so the checklist is read from that user's key.
            key={user?._id || user?.id || "anonymous"}
            userId={user?._id || user?.id}
            skillGaps={skillGaps}
            profiles={profiles}
            parsedResume={parsedResume}
            hasResume={hasResume}
            examCount={exams.count}
            atsScore={ats ? ats.overall : null}
            loading={loading}
            error={planError}
            onRetry={retry}
          />

          {/* ── 2c. Recommended mock interviews ──────────────────────── */}
          <RecommendedInterviews
            companies={interviewCompanies}
            loading={loading}
            error={interviewsError}
            onRetry={retry}
          />

          {/* ── 3. Two-column midsection ─────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 3a. Exam marks history */}
            <Card>
              <SectionHeader
                icon={GraduationCap}
                title="Exam marks history"
                subtitle="Every assessment you've completed"
              />
              {loading ? (
                <RowSkeleton rows={3} />
              ) : examsError ? (
                <ErrorState message={examsError} onRetry={retry} />
              ) : examResults.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No exams taken yet"
                  message="Assessment results will appear here with your score once the exam portal is available to you."
                />
              ) : (
                <ul className="space-y-3">
                  {examResults.map((exam, index) => {
                    const percent = examPercent(exam);
                    const date = formatDate(exam?.takenAt ?? exam?.createdAt);
                    const meta = [exam?.category, date].filter(Boolean).join(" · ");

                    return (
                      <li key={exam?._id || `${exam?.title}-${index}`} className={ROW}>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-50">
                            {exam?.title || "Untitled exam"}
                          </p>
                          {meta ? (
                            <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">
                              {meta}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {percent === null ? null : (
                            <span className="text-right font-bold text-slate-900 dark:text-slate-50">
                              {percent}/100
                            </span>
                          )}
                          {typeof exam?.passed === "boolean" ? (
                            <PassFailPill passed={exam.passed} />
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* 3b. Coding and professional profiles */}
            <Card>
              <SectionHeader
                icon={Code2}
                title="Coding and professional profiles"
                subtitle="Links you've connected to your account"
              />
              {loading ? (
                <RowSkeleton rows={3} />
              ) : integrationsError ? (
                <ErrorState message={integrationsError} onRetry={retry} />
              ) : (
                <ul className="space-y-3">
                  {profiles.map((profile) => {
                    const Icon = profile.connected
                      ? PLATFORM_ICON[profile.key] || Code2
                      : Code2;

                    return (
                      <li key={profile.key} className={ROW}>
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon
                            size={18}
                            className="shrink-0 text-slate-500 dark:text-slate-400"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {profile.label}
                            </p>
                            {profile.connected ? (
                              <a
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <span className="truncate">{profile.url}</span>
                                <ExternalLink size={14} className="shrink-0" />
                              </a>
                            ) : (
                              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                Not added yet
                              </p>
                            )}
                          </div>
                        </div>
                        {profile.connected ? null : (
                          <Link to="/viewprofile" className={`${LINK_BTN} shrink-0`}>
                            Add
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* ── 4. Build your resume ─────────────────────────────────── */}
          <Card>
            <SectionHeader
              icon={FileText}
              title="Build your resume"
              subtitle="ATS readiness scored from your parsed resume and the roles you're targeting"
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={PRIMARY_BTN}
                    onClick={() => navigate("/resume")}
                  >
                    <Download size={16} />
                    Build resume
                  </button>
                  <button
                    type="button"
                    className={SECONDARY_BTN}
                    onClick={refresh}
                    disabled={refreshing || loading}
                  >
                    <RefreshCw
                      size={16}
                      className={refreshing ? "animate-spin" : undefined}
                    />
                    Refresh ATS score
                  </button>
                </div>
              }
            />

            {loading ? (
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
                <div className="h-40 w-40 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="w-full space-y-6">
                  <div className="h-2 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ) : resumeError ? (
              <ErrorState message={resumeError} onRetry={retry} />
            ) : !ats ? (
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <AtsGauge value={null} caption="no resume" />
                <div className="w-full">
                  <EmptyState
                    icon={FileText}
                    title="No resume to score yet"
                    message="Upload and parse a resume and we'll score its formatting and keyword coverage against the roles you're targeting."
                    action={
                      <button
                        type="button"
                        className={PRIMARY_BTN}
                        onClick={() => navigate("/resume")}
                      >
                        <Upload size={16} />
                        Upload a resume
                      </button>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
                <AtsGauge value={ats.overall} caption="ATS readiness" />
                <div className="w-full space-y-6">
                  <MeterBar label="Formatting" value={ats.formatting} />
                  <MeterBar
                    label="Keywords"
                    value={ats.keywords}
                    emptyLabel="Not enough job data yet"
                  />
                  <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Sparkles size={16} className="mt-0.5 shrink-0" />
                    {ats.keywords === null
                      ? "Keyword coverage needs at least one matched role to compare against."
                      : `${ats.matchedKeywords.length} of ${ats.totalKeywords} requirement keywords from your matched roles appear in your resume.`}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboard;
