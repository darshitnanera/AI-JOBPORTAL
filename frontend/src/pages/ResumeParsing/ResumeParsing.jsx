import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  PenLine,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import FileUploadArea from "./components/FileUploadArea";
import ParsedResumeDisplay from "./components/ParsedResumeDisplay";
import ResumePreviewModal from "./components/ResumePreviewModal";
import ResumeVersions from "./components/ResumeVersions";
import { printResumeToPDF } from "../../utils/resumeDocument";

// VITE_API_URL holds the bare backend origin (no /api suffix), matching the
// rest of the app; the /api segment is appended here. Reading it as if the
// suffix were included produced requests to /resume/parsed, which 404'd.
const API_ORIGIN = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_ORIGIN}/api`;

const TABS = [
  { id: "upload", label: "Upload & extract", icon: Upload },
  { id: "review", label: "Review & edit", icon: FileText },
  { id: "versions", label: "Versions", icon: History },
];

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const SECTION_KEYS = [
  "contact",
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
];

/** The shape every section editor expects — valid, and completely empty. */
const blankResume = () => ({
  contact: {},
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
});

const hasResumeContent = (resume) =>
  Boolean(
    resume &&
      (String(resume.summary || "").trim() ||
        resume.skills?.some((s) => String(s || "").trim()) ||
        resume.experience?.length ||
        resume.education?.length ||
        resume.projects?.length ||
        resume.certifications?.length ||
        (resume.contact &&
          Object.values(resume.contact).some((v) => String(v || "").trim()))),
  );

/**
 * Collapses a value to its meaningful content: strings are trimmed, empty
 * strings / arrays / objects become `undefined`, and object keys are sorted.
 * Used to tell a real edit apart from cosmetic differences between what the
 * server stored and what the form holds (blank rows, absent optional keys).
 */
const canonical = (value) => {
  if (Array.isArray(value)) {
    const items = value.map(canonical).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value)
      .sort()
      .forEach((key) => {
        const item = canonical(value[key]);
        if (item !== undefined) out[key] = item;
      });
    return Object.keys(out).length ? out : undefined;
  }
  if (typeof value === "string") return value.trim() || undefined;
  return value === null ? undefined : value;
};

const fingerprint = (resume) =>
  JSON.stringify(SECTION_KEYS.map((key) => canonical(resume?.[key]) ?? null));

/* ------------------------------------------------------------- skeletons */

const ReviewSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((__, j) => (
            <div
              key={j}
              className="h-11 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ page */

/** Name to head the generated resume with. */
const storedUserName = () => {
  try {
    return JSON.parse(localStorage.getItem("jobportal_user") || "{}")?.name || "";
  } catch {
    return "";
  }
};

const ResumeParsing = () => {
  const [parsedResume, setParsedResume] = useState(null);
  const [versions, setVersions] = useState([]);
  const displayName = storedUserName();

  // Live form state, pushed up by the editor, so the preview and the PDF
  // fallback render what the user is currently looking at.
  const [liveDraft, setLiveDraft] = useState(null);
  // True once the user chose "Start from scratch" — the seeded resume is empty,
  // so content checks alone cannot tell "blank on purpose" from "nothing yet".
  const [scratchMode, setScratchMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("upload");

  const flashSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 5000);
  };

  /** Server data replaced the working copy — drop the stale live draft. */
  const adoptResume = (resume, { scratch = false } = {}) => {
    setParsedResume(resume);
    setLiveDraft(null);
    setScratchMode(scratch);
  };

  // What the user is actually looking at: the live form state once the editor
  // has reported one, the saved resume otherwise.
  const workingResume = liveDraft || parsedResume;
  const hasUnsavedEdits = useMemo(
    () => Boolean(liveDraft) && fingerprint(liveDraft) !== fingerprint(parsedResume),
    [liveDraft, parsedResume],
  );

  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/resume/versions`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    setInitialLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`${API_URL}/resume/parsed`, {
        headers: authHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        adoptResume(data.parsedResume || null);
        setActiveTab(hasResumeContent(data.parsedResume) ? "review" : "upload");
      } else if (response.status === 404) {
        adoptResume(null);
        setActiveTab("upload");
      } else {
        setLoadError("We couldn't load your saved resume.");
      }

      await fetchVersions();
    } catch (err) {
      console.error("Error fetching parsed resume:", err);
      setLoadError(
        "We couldn't reach the resume service. Check your connection and try again.",
      );
    } finally {
      setInitialLoading(false);
    }
  }, [fetchVersions]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  /* ----------------------------------------------------------- mutations */

  const handleFileUpload = async (file) => {
    setParsing(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(`${API_URL}/resume/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        adoptResume(data.parsedResume);
        flashSuccess("Resume parsed. Review every section before downloading.");
        setActiveTab("review");
        fetchVersions();
      } else {
        setError(data.message || "We couldn't parse that file.");
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleExtractText = async (text) => {
    setParsing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/resume/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ resumeText: text }),
      });
      const data = await response.json();

      if (response.ok) {
        adoptResume(data.parsedResume);
        flashSuccess("Resume text extracted. Review every section for accuracy.");
        setActiveTab("review");
        fetchVersions();
      } else {
        setError(data.message || "We couldn't extract that text.");
      }
    } catch (err) {
      setError(`Extraction failed: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleStartFromScratch = () => {
    setError("");
    setParsedResume(blankResume());
    setLiveDraft(null);
    setScratchMode(true);
    setActiveTab("review");
    flashSuccess("Blank resume ready. Fill in a section and save it.");
  };

  const handleDiscardScratch = () => {
    if (
      !window.confirm("Discard this blank resume? Anything you typed will be lost.")
    ) {
      return;
    }
    setParsedResume(null);
    setLiveDraft(null);
    setScratchMode(false);
    setActiveTab("upload");
  };

  const handleUpdateSection = async (section, data) => {
    // The API rejects an empty payload with "Section and data are required",
    // which reads like a bug rather than a rule. Say what it actually means.
    if (typeof data === "string" && !data.trim()) {
      setError(
        "Write a summary before saving — an empty summary can't be stored. Leave it untouched to keep it off your resume.",
      );
      return;
    }

    setSavingSection(section);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/resume/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ section, data }),
      });
      const responseData = await response.json();

      if (response.ok) {
        setParsedResume(responseData.parsedResume);
        flashSuccess(`${section} saved.`);
        fetchVersions();
      } else {
        setError(responseData.message || "We couldn't save that section.");
      }
    } catch (err) {
      setError(`Update failed: ${err.message}`);
    } finally {
      setSavingSection(null);
    }
  };

  const handleDownloadPDF = async () => {
    setExporting(true);
    setError("");

    // The browser print pipeline emits a real text-based PDF, which stays
    // ATS-readable — unlike a canvas-rasterised export, which is a picture of
    // a resume and parses to nothing.
    const printLocally = (message) => {
      if (printResumeToPDF(workingResume, displayName)) {
        flashSuccess(message);
      } else {
        setError("Your browser blocked the export window. Allow pop-ups and retry.");
      }
    };

    try {
      // The backend renders whatever it has *saved*. With unsaved edits on
      // screen it would quietly export a different resume than the preview
      // shows, so render the working copy instead.
      if (hasUnsavedEdits) {
        printLocally(
          'Exporting your unsaved edits — choose "Save as PDF" in the print dialog.',
        );
        return;
      }

      const response = await fetch(`${API_URL}/resume/generate-pdf`, {
        method: "POST",
        headers: authHeaders(),
      });

      // Only treat the response as a PDF if it actually is one. Saving a
      // JSON body as resume.pdf produced a file the viewer refused to open
      // ("Failed to load PDF document").
      const type = response.headers.get("content-type") || "";
      if (response.ok && type.includes("application/pdf")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        flashSuccess("Resume downloaded.");
      } else {
        // Backend could not produce a PDF (offline, or a mocked response).
        printLocally('Choose "Save as PDF" in the print dialog.');
      }
    } catch {
      printLocally('Offline export — choose "Save as PDF" in the print dialog.');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Preview is rendered in-page from the working copy.
   *
   * It used to fetch `/resume/preview` and write the HTML into `window.open()`.
   * That call happens after an await, so browsers classify the tab as an
   * unrequested pop-up and block it — and the server can only ever render the
   * *saved* resume, never the edits on screen. The modal solves both.
   */
  const handlePreview = () => {
    setError("");
    setPreviewOpen(true);
  };

  const closePreview = useCallback(() => setPreviewOpen(false), []);

  const handleRestoreVersion = async (version) => {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/resume/restore-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ version }),
      });
      const data = await response.json();

      if (response.ok) {
        adoptResume(data.parsedResume);
        flashSuccess(`Restored version ${version}.`);
        fetchVersions();
        setActiveTab("review");
      } else {
        setError(data.message || "We couldn't restore that version.");
      }
    } catch (err) {
      setError(`Restore failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteResume = async () => {
    if (
      !window.confirm(
        "Delete your parsed resume and all saved versions? This cannot be undone.",
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/resume/parsed`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();

      if (response.ok) {
        adoptResume(null);
        setVersions([]);
        setPreviewOpen(false);
        flashSuccess("Resume deleted.");
        setActiveTab("upload");
      } else {
        setError(data.message || "We couldn't delete your resume.");
      }
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------------------------------------------- ui */

  // Saved on the server. Drives the "you already have a resume" card.
  const hasSavedResume = hasResumeContent(parsedResume);
  // Show the editor for a saved resume *or* a deliberately blank one.
  const editorReady = hasSavedResume || scratchMode;
  // Preview and export follow what's on screen, not what's on the server.
  const canExport = hasResumeContent(workingResume);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Resume workspace
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Upload a resume or start from a blank page, edit every section, and
              export a clean, ATS-readable PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasUnsavedEdits && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700 ring-1 ring-warning-500/30 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25">
                Unsaved changes
              </span>
            )}
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={handlePreview}
              disabled={!canExport || busy}
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              type="button"
              className={PRIMARY_BTN}
              onClick={handleDownloadPDF}
              disabled={!canExport || busy || exporting}
            >
              <Download size={16} />
              {exporting ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>

        {/* alerts */}
        <div className="mt-6 space-y-3">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-danger-500/30 bg-danger-50 p-4 dark:bg-danger-500/10"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
              <p className="text-sm font-medium text-danger-700 dark:text-danger-500">
                {error}
              </p>
            </div>
          )}
          {success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-success-500/30 bg-success-50 p-4 dark:bg-success-500/10"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-600" />
              <p className="text-sm font-medium text-success-700 dark:text-success-500">
                {success}
              </p>
            </div>
          )}
        </div>

        {/* tabs */}
        <div className="mt-8 overflow-x-auto">
          <div
            role="tablist"
            className="inline-flex min-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 sm:min-w-0 dark:border-slate-800 dark:bg-slate-900"
          >
            {TABS.map(({ id, label, icon }) => {
              const Icon = icon;
              return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                  activeTab === id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                <Icon size={16} />
                {label}
                {id === "versions" && versions.length > 0 && (
                  <span
                    className={[
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                      activeTab === id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                    ].join(" ")}
                  >
                    {versions.length}
                  </span>
                )}
              </button>
              );
            })}
          </div>
        </div>

        {/* panels */}
        <div className="mt-6">
          {initialLoading ? (
            <ReviewSkeleton />
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
                <AlertCircle size={24} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Something went wrong
              </h2>
              <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
                {loadError}
              </p>
              <button type="button" className={SECONDARY_BTN} onClick={loadWorkspace}>
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : (
            <>
              {activeTab === "upload" && (
                <div className="space-y-6">
                  <FileUploadArea
                    onFileUpload={handleFileUpload}
                    onTextExtract={handleExtractText}
                    onStartFromScratch={handleStartFromScratch}
                    loading={parsing}
                  />

                  {scratchMode && !hasSavedResume && !parsing && (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                          You&apos;re building a resume from scratch
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          It lives in this tab until you save a section. Uploading
                          or pasting a resume now would replace it.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className={SECONDARY_BTN}
                          onClick={() => setActiveTab("review")}
                        >
                          <PenLine size={16} />
                          Continue editing
                        </button>
                        <button
                          type="button"
                          onClick={handleDiscardScratch}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-white px-5 py-2.5 text-sm font-semibold text-danger-600 transition-all hover:bg-danger-50 dark:bg-slate-900 dark:hover:bg-danger-500/10"
                        >
                          <Trash2 size={16} />
                          Discard
                        </button>
                      </div>
                    </div>
                  )}

                  {hasSavedResume && !parsing && (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                          You already have a parsed resume
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Uploading a new file replaces it — the current version is
                          kept in your history.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className={SECONDARY_BTN}
                          onClick={() => setActiveTab("review")}
                        >
                          <FileText size={16} />
                          Review current resume
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteResume}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-white px-5 py-2.5 text-sm font-semibold text-danger-600 transition-all hover:bg-danger-50 disabled:opacity-50 dark:bg-slate-900 dark:hover:bg-danger-500/10"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "review" &&
                (editorReady ? (
                  <ParsedResumeDisplay
                    resume={parsedResume}
                    onUpdate={handleUpdateSection}
                    onDraftChange={setLiveDraft}
                    savingSection={savingSection}
                    fromScratch={scratchMode}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      <FileText size={24} />
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      Nothing to review yet
                    </h2>
                    <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
                      Upload a PDF, TXT or DOCX file, paste your resume text, or
                      start with a blank resume and type it in here.
                    </p>
                    <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        className={PRIMARY_BTN}
                        onClick={handleStartFromScratch}
                      >
                        <PenLine size={16} />
                        Start from scratch
                      </button>
                      <button
                        type="button"
                        className={SECONDARY_BTN}
                        onClick={() => setActiveTab("upload")}
                      >
                        <Upload size={16} />
                        Upload a resume
                      </button>
                    </div>
                  </div>
                ))}

              {activeTab === "versions" && (
                <ResumeVersions
                  versions={versions}
                  onRestore={handleRestoreVersion}
                  loading={false}
                  restoring={busy}
                />
              )}
            </>
          )}
        </div>
      </main>

      <ResumePreviewModal
        open={previewOpen}
        resume={workingResume}
        fullName={displayName}
        onClose={closePreview}
        onDownload={handleDownloadPDF}
        downloading={exporting}
      />
    </div>
  );
};

export default ResumeParsing;
