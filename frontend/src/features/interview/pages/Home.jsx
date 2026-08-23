import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Award,
  Briefcase,
  Compass,
  FileText,
  Loader2,
  Sparkles,
  Target,
  Upload,
  Wrench,
} from "lucide-react";
import Navbar from "../../../components/Navbar/Navbar";
import { useInterview } from "../hooks/useInterview";
import { getJobRecommendations, getParsedResume } from "../services/interview.api";
import RecommendationGroup, {
  Badge,
  RecommendationCard,
} from "../components/RecommendationGroup";
import {
  INPUT,
  LABEL,
  PLAIN_CARD,
  PRIMARY_BTN,
  SECONDARY_BTN,
  scoreTone,
  severityTone,
} from "../components/uiTokens";

const RESUME_SECTIONS = [
  { key: "summary", label: "Professional summary" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
];

const isSectionEmpty = (resume, key) => {
  const value = resume?.[key];
  if (Array.isArray(value)) return value.length === 0;
  return !value;
};

const Home = () => {
  const navigate = useNavigate();
  const { loading, error, generateReport, reports, getReports } = useInterview();

  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [formError, setFormError] = useState("");
  const [generating, setGenerating] = useState(false);
  const resumeInputRef = useRef(null);

  const [jobRecs, setJobRecs] = useState([]);
  const [jobRecsStatus, setJobRecsStatus] = useState("loading");
  const [jobRecsError, setJobRecsError] = useState("");

  const [parsedResume, setParsedResume] = useState(null);
  const [resumeStatus, setResumeStatus] = useState("loading");
  const [resumeError, setResumeError] = useState("");

  /* -------------------------------------------------------------- fetches */

  const loadJobRecs = useCallback(async () => {
    try {
      setJobRecs(await getJobRecommendations(6));
      setJobRecsError("");
      setJobRecsStatus("ready");
    } catch (err) {
      // 403 simply means this account isn't a candidate — treat as empty.
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        setJobRecs([]);
        setJobRecsStatus("ready");
        return;
      }
      setJobRecsError(
        err?.response?.data?.message || "We couldn't load your job matches.",
      );
      setJobRecsStatus("error");
    }
  }, []);

  const loadParsedResume = useCallback(async () => {
    try {
      setParsedResume(await getParsedResume());
      setResumeError("");
      setResumeStatus("ready");
    } catch (err) {
      if (err?.response?.status === 404) {
        setParsedResume(null);
        setResumeStatus("ready");
        return;
      }
      setResumeError(
        err?.response?.data?.message || "We couldn't load your parsed resume.",
      );
      setResumeStatus("error");
    }
  }, []);

  useEffect(() => {
    loadJobRecs();
    loadParsedResume();
  }, [loadJobRecs, loadParsedResume]);

  const retryJobRecs = () => {
    setJobRecsStatus("loading");
    loadJobRecs();
  };

  const retryParsedResume = () => {
    setResumeStatus("loading");
    loadParsedResume();
  };

  /* -------------------------------------------------------------- derived */

  const sortedReports = [...(reports || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  const latestReport = sortedReports[0] || null;

  const emptyResumeSections = parsedResume
    ? RESUME_SECTIONS.filter((s) => isSectionEmpty(parsedResume, s.key))
    : [];

  /* --------------------------------------------------------------- submit */

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!jobDescription.trim()) {
      setFormError("Paste the job description for the role you're targeting.");
      return;
    }
    const resumeFile = resumeInputRef.current?.files?.[0];
    if (!resumeFile && !selfDescription.trim()) {
      setFormError("Add a resume file or a short self-description so we have your profile.");
      return;
    }

    setGenerating(true);
    const data = await generateReport({ jobDescription, selfDescription, resumeFile });
    setGenerating(false);

    if (data?._id) {
      navigate(`/ai-suggestion/${data._id}`);
    }
  };

  const busy = generating || loading;

  /* ------------------------------------------------------------------ ui */

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            AI suggestions
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Everything below is built from your own profile, resume and target
            role — nothing is generic.
          </p>
        </header>

        {/* ------------------------------------------------- target role form */}
        <section className="mt-8">
          <form onSubmit={handleGenerateReport} className={PLAIN_CARD}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <Target size={18} />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Set your target role
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Paste a job description and add your profile. We analyse the two
                  together to produce your match score, skill gaps and interview plan.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:bg-danger-500/10">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
                <p className="text-sm font-medium text-danger-700 dark:text-danger-500">
                  {formError}
                </p>
              </div>
            )}

            {error && !formError && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:bg-danger-500/10">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
                <p className="text-sm font-medium text-danger-700 dark:text-danger-500">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="job-description" className={LABEL}>
                  Job description <span className="text-danger-600">*</span>
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  maxLength={5000}
                  rows={10}
                  placeholder="Paste the full job description here…"
                  className={`${INPUT} resize-y`}
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {jobDescription.length.toLocaleString()} / 5,000 characters
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <span className={LABEL}>Your resume</span>
                  <label
                    htmlFor="ai-resume"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:bg-brand-500/10"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      <Upload size={18} />
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {resumeName || "Choose a PDF or DOCX"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Best results — we read your real experience
                    </span>
                    <input
                      ref={resumeInputRef}
                      id="ai-resume"
                      name="resume"
                      type="file"
                      accept=".pdf,.docx"
                      className="visually-hidden"
                      onChange={(e) => setResumeName(e.target.files?.[0]?.name || "")}
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="self-description" className={LABEL}>
                    …or a short self-description
                  </label>
                  <textarea
                    id="self-description"
                    value={selfDescription}
                    onChange={(e) => setSelfDescription(e.target.value)}
                    rows={4}
                    placeholder="Briefly describe your experience and key skills…"
                    className={`${INPUT} resize-y`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A resume <strong className="font-semibold">or</strong> a
                self-description is required.
              </p>
              <button type="submit" className={PRIMARY_BTN} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analysing…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate suggestions
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ------------------------------------------------------ groups */}
        <div className="mt-12 space-y-12">
          {/* 1 — job recommendations */}
          <RecommendationGroup
            icon={Briefcase}
            title="Job recommendations"
            description="Open roles our matching engine scored against your profile."
            source="Source: your job-match results"
            status={jobRecsStatus}
            errorMessage={jobRecsError}
            onRetry={retryJobRecs}
            isEmpty={jobRecs.length === 0}
            emptyTitle="No job matches yet"
            emptyBody="Matches appear once your resume has been parsed and scored against live job posts."
            emptyAction={
              <Link to="/resume" className={PRIMARY_BTN}>
                <FileText size={16} />
                Add your resume
              </Link>
            }
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobRecs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  icon={Briefcase}
                  title={rec.job?.roleName || rec.job?.title || "Untitled role"}
                  meta={[rec.job?.companyName, rec.job?.location]
                    .filter(Boolean)
                    .join(" · ")}
                  badge={
                    typeof rec.matchScore === "number" ? (
                      <Badge className={scoreTone(rec.matchScore)}>
                        {rec.matchScore}% match
                      </Badge>
                    ) : null
                  }
                  explanation={
                    rec.reason ||
                    "The matching engine returned this role without a written explanation."
                  }
                  actionLabel="View job"
                  to={`/jobdetails/${rec.jobId}`}
                />
              ))}
            </div>
          </RecommendationGroup>

          {/* 2 — skill recommendations */}
          <RecommendationGroup
            icon={Wrench}
            title="Skill recommendations"
            description={
              latestReport
                ? `Gaps found between your profile and “${latestReport.title}”.`
                : "Gaps between your profile and your target role."
            }
            source="Source: your latest AI analysis"
            status={loading && !reports.length ? "loading" : "ready"}
            isEmpty={!latestReport?.skillGaps?.length}
            emptyIcon={Wrench}
            emptyTitle={
              latestReport ? "No skill gaps returned" : "No target role analysed yet"
            }
            emptyBody={
              latestReport
                ? "The analysis for your latest target role didn't flag any missing skills."
                : "Paste a job description above and we'll list the skills that are missing for it."
            }
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestReport?.skillGaps?.map((gap, index) => (
                <RecommendationCard
                  key={`${gap.skill}-${index}`}
                  icon={Wrench}
                  title={gap.skill}
                  meta={`Missing for ${latestReport.title}`}
                  badge={
                    <Badge className={severityTone(gap.severity)}>
                      {gap.severity} priority
                    </Badge>
                  }
                  explanation={`This skill appears in the job description for ${latestReport.title} but wasn't found in the profile you submitted. Your preparation road map includes focused tasks for it.`}
                  actionLabel="Open preparation plan"
                  to={`/ai-suggestion/${latestReport._id}`}
                />
              ))}
            </div>
          </RecommendationGroup>

          {/* 3 — resume recommendations */}
          <RecommendationGroup
            icon={FileText}
            title="Resume recommendations"
            description="Based on the sections we actually extracted from your resume."
            source="Source: your parsed resume"
            status={resumeStatus}
            errorMessage={resumeError}
            onRetry={retryParsedResume}
            isEmpty={!parsedResume || (emptyResumeSections.length === 0 && !latestReport)}
            emptyIcon={FileText}
            emptyTitle={parsedResume ? "Your resume looks complete" : "No parsed resume yet"}
            emptyBody={
              parsedResume
                ? "Every section we extract has content. Keep it current as you take on new work."
                : "Upload a resume and we'll tell you exactly which sections are missing."
            }
            emptyAction={
              <Link to="/resume" className={PRIMARY_BTN}>
                <FileText size={16} />
                Open resume workspace
              </Link>
            }
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {emptyResumeSections.map((section) => (
                <RecommendationCard
                  key={section.key}
                  icon={FileText}
                  title={`Add your ${section.label.toLowerCase()}`}
                  meta="Section is empty"
                  badge={
                    <Badge className="bg-warning-50 text-warning-700 ring-warning-500/25 dark:bg-warning-500/10 dark:text-warning-500">
                      Empty
                    </Badge>
                  }
                  explanation={`We didn't extract any ${section.label.toLowerCase()} content from your resume. Recruiters filter on this section, so fill it in on the Review & Edit tab.`}
                  actionLabel="Edit resume"
                  to="/resume"
                />
              ))}

              {latestReport && (
                <RecommendationCard
                  icon={Award}
                  title="Download a resume tailored to this role"
                  meta={latestReport.title}
                  explanation={`We can generate a resume PDF from the profile you submitted for “${latestReport.title}”, restructured around that job description.`}
                  actionLabel="Open the plan"
                  to={`/ai-suggestion/${latestReport._id}`}
                />
              )}
            </div>
          </RecommendationGroup>

          {/* 4 — career / role recommendations */}
          <RecommendationGroup
            icon={Compass}
            title="Career & role recommendations"
            description="Every role you've analysed, ranked by the match score we calculated."
            source="Source: your saved analyses"
            status={loading && !reports.length ? "loading" : "ready"}
            isEmpty={sortedReports.length === 0}
            emptyIcon={Compass}
            emptyTitle="No roles analysed yet"
            emptyBody="Analyse a job description above and each target role will be tracked here with its match score."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...sortedReports]
                .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
                .map((report) => (
                  <RecommendationCard
                    key={report._id}
                    icon={Compass}
                    title={report.title || "Untitled position"}
                    meta={
                      report.createdAt
                        ? `Analysed ${new Date(report.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : undefined
                    }
                    badge={
                      typeof report.matchScore === "number" ? (
                        <Badge className={scoreTone(report.matchScore)}>
                          {report.matchScore}% match
                        </Badge>
                      ) : null
                    }
                    explanation={
                      typeof report.matchScore === "number"
                        ? `Your profile scored ${report.matchScore}% against this job description. The plan includes ${report.technicalQuestions?.length ?? 0} technical and ${report.behavioralQuestions?.length ?? 0} behavioural questions to practise.`
                        : "Open the plan to see the full analysis."
                    }
                    actionLabel="Open plan"
                    to={`/ai-suggestion/${report._id}`}
                  />
                ))}
            </div>
          </RecommendationGroup>
        </div>

        {reports.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button type="button" className={SECONDARY_BTN} onClick={getReports}>
              Refresh suggestions
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
