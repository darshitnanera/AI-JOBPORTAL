import React, { useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  Loader2,
  PenLine,
  Sparkles,
  Upload,
} from "lucide-react";

const ACCEPTED_MIME = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
const ACCEPTED_EXT = [".pdf", ".txt", ".docx", ".doc"];
const MAX_BYTES = 10 * 1024 * 1024;

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

/** Full-width parsing state shown while Claude extracts the resume. */
const ParsingState = ({ label }) => (
  <div className={`${cardClass} flex flex-col items-center gap-4 text-center`}>
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
      <Loader2 size={24} className="animate-spin" />
    </span>
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{label}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        This usually takes a few seconds. Keep this tab open.
      </p>
    </div>
    <div className="w-full max-w-md space-y-2.5">
      {["w-full", "w-11/12", "w-4/5", "w-2/3"].map((w) => (
        <div
          key={w}
          className={`h-3 ${w} animate-pulse rounded bg-slate-200 dark:bg-slate-800`}
        />
      ))}
    </div>
  </div>
);

const FileUploadArea = ({
  onFileUpload,
  onTextExtract,
  onStartFromScratch,
  loading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState("file"); // "file" | "text" | "scratch"
  const [textInput, setTextInput] = useState("");
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const validateAndSend = (file) => {
    setLocalError("");

    const name = (file.name || "").toLowerCase();
    const extOk = ACCEPTED_EXT.some((ext) => name.endsWith(ext));
    const mimeOk = ACCEPTED_MIME.includes(file.type);

    if (!extOk && !mimeOk) {
      setLocalError("That file type isn't supported. Upload a PDF, TXT, or DOCX.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("That file is larger than 10 MB. Try a smaller export.");
      return;
    }

    onFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) validateAndSend(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSend(file);
    e.target.value = "";
  };

  const handleTextSubmit = () => {
    setLocalError("");
    if (textInput.trim().length < 40) {
      setLocalError("Paste a bit more of your resume so the parser has something to work with.");
      return;
    }
    onTextExtract(textInput);
  };

  if (loading) {
    return (
      <ParsingState
        label={mode === "text" ? "Extracting your resume text…" : "Parsing your resume…"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* mode switch */}
      <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: "file", label: "Upload a file", icon: Upload },
          { id: "text", label: "Paste text", icon: FileText },
          ...(onStartFromScratch
            ? [{ id: "scratch", label: "Start from scratch", icon: PenLine }]
            : []),
        ].map(({ id, label, icon }) => {
          const Icon = icon;
          return (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setLocalError("");
            }}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              mode === id
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            <Icon size={16} />
            {label}
          </button>
          );
        })}
      </div>

      {localError && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger-500/30 bg-danger-50 p-4 dark:bg-danger-500/10">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <p className="text-sm font-medium text-danger-700 dark:text-danger-500">
            {localError}
          </p>
        </div>
      )}

      {mode === "file" ? (
        <div className={cardClass}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={[
              "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all",
              dragActive
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                dragActive
                  ? "bg-brand-600 text-white"
                  : "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
              ].join(" ")}
            >
              <Upload size={26} />
            </span>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {dragActive ? "Drop it right here" : "Drag & drop your resume"}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                or pick a file from your computer
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleChange}
              accept=".pdf,.txt,.docx,.doc"
              className="visually-hidden"
              tabIndex={-1}
            />
            <button
              type="button"
              className={primaryBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Choose file
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              PDF, TXT or DOCX · up to 10 MB
            </p>
          </div>
        </div>
      ) : mode === "scratch" ? (
        <div className={`${cardClass} space-y-4`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              <PenLine size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Build a resume from scratch
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                No file and nothing to paste? Start with an empty, ATS-friendly
                outline instead.
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {[
              "Blank sections for contact, summary, skills, experience, education, projects and certifications.",
              "Fill in only what applies — empty sections are left out of the PDF.",
              "Save each section as you go, and preview the result at any time.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <button type="button" className={primaryBtn} onClick={onStartFromScratch}>
            <PenLine size={16} />
            Create a blank resume
          </button>
        </div>
      ) : (
        <div className={`${cardClass} space-y-4`}>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Paste your resume text
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              No file handy? Paste the plain text and we&apos;ll extract the same
              sections.
            </p>
          </div>

          <div>
            <label
              htmlFor="resume-text"
              className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Resume text
            </label>
            <textarea
              id="resume-text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={14}
              placeholder="Paste your full resume here…"
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {textInput.length.toLocaleString()} characters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={primaryBtn} onClick={handleTextSubmit}>
              <Sparkles size={16} />
              Extract resume
            </button>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => setTextInput("")}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;
