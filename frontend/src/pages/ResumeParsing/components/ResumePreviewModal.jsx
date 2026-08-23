import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Download, FileText, X } from "lucide-react";
import { buildResumeHTML } from "../../../utils/resumeDocument";

/**
 * In-page resume preview.
 *
 * Why a modal and not `window.open`: a preview tab is opened from an async
 * callback, which browsers treat as an unrequested pop-up and block. Nothing
 * appeared and the user had no way to tell why.
 *
 * Why an <iframe srcDoc> and not innerHTML: the generated resume ships its own
 * document-level CSS (`* {}`, `body {}`, `h1 {}`). Injecting that into the app
 * would leak those bare element rules over every Tailwind utility on the page.
 * An iframe gives the resume its own document, so the two can never collide.
 * `sandbox="allow-same-origin"` keeps scripts off while still letting us
 * measure the rendered height.
 */

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const ICON_BTN =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const hasContent = (resume) =>
  Boolean(
    resume &&
      (String(resume.summary || "").trim() ||
        resume.skills?.length ||
        resume.experience?.length ||
        resume.education?.length ||
        resume.projects?.length ||
        resume.certifications?.length ||
        (resume.contact && Object.values(resume.contact).some((v) => String(v || "").trim()))),
  );

const ResumePreviewModal = ({
  open,
  resume,
  fullName = "",
  onClose,
  onDownload,
  downloading = false,
}) => {
  const panelRef = useRef(null);
  const frameRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const [frameHeight, setFrameHeight] = useState(760);
  // Which document the frame has actually painted. Comparing it to the current
  // one derives the loading state without a setState-in-effect cascade.
  const [loadedHtml, setLoadedHtml] = useState("");

  const filled = hasContent(resume);

  // Built from the resume passed in, which is the live form state — unsaved
  // edits therefore show up in the preview.
  const { html, buildError } = useMemo(() => {
    if (!open || !filled) return { html: "", buildError: "" };
    try {
      return { html: buildResumeHTML(resume, fullName), buildError: "" };
    } catch (err) {
      console.error("Resume preview build failed:", err);
      return { html: "", buildError: "We couldn't render this resume. Check the fields you just edited." };
    }
  }, [open, filled, resume, fullName]);

  const frameLoading = Boolean(html) && loadedHtml !== html;

  const focusables = useCallback(
    () => Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || []),
    [],
  );

  const focusFirst = useCallback(() => {
    const nodes = focusables();
    (nodes[0] || panelRef.current)?.focus();
  }, [focusables]);

  const focusLast = useCallback(() => {
    const nodes = focusables();
    (nodes[nodes.length - 1] || panelRef.current)?.focus();
  }, [focusables]);

  /* Escape to close, body scroll lock, and focus restore. */
  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    const timer = window.setTimeout(focusFirst, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown, true);
      body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose, focusFirst]);

  /* Size the iframe to its content so the panel — not the frame — scrolls.
     Measure the body, never documentElement: the root element stretches to the
     frame, so a short resume could only ever grow the frame, never shrink it. */
  const measureFrame = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) return;
    const height = Math.ceil(
      doc.body.getBoundingClientRect().height || doc.body.scrollHeight || 0,
    );
    if (height > 0) setFrameHeight(Math.max(height + 8, 200));
  }, []);

  const handleFrameLoad = useCallback(() => {
    setLoadedHtml(html);
    measureFrame();
    const doc = frameRef.current?.contentDocument;
    // Web fonts change line breaks, and therefore the height, after first paint.
    doc?.fonts?.ready?.then(measureFrame).catch(() => {});
    window.setTimeout(measureFrame, 300);
    // A keypress inside the frame never reaches the host document, so Escape
    // would do nothing once focus lands on the resume. Give the frame its own
    // listener; it dies with the document when srcDoc changes.
    doc?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") onClose?.();
    });
  }, [html, measureFrame, onClose]);

  if (!open) return null;

  const body = (() => {
    if (!filled) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <FileText size={24} />
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Nothing to preview yet
          </h3>
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
            Fill in at least one section on the Review &amp; edit tab — your
            contact details are a good place to start.
          </p>
        </div>
      );
    }

    if (buildError) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
            <AlertCircle size={24} />
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Preview unavailable
          </h3>
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">{buildError}</p>
        </div>
      );
    }

    return (
      <div className="relative overflow-x-auto rounded-xl bg-slate-100 p-2 sm:p-4 dark:bg-slate-950/50">
        {frameLoading && (
          <div className="absolute inset-2 space-y-3 rounded-lg bg-white p-6 sm:inset-4 dark:bg-slate-900">
            <div className="h-6 w-2/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        )}
        <iframe
          ref={frameRef}
          title="Resume preview"
          srcDoc={html}
          onLoad={handleFrameLoad}
          sandbox="allow-same-origin"
          style={{ height: `${frameHeight}px` }}
          className="block w-full rounded-lg border-0 bg-white shadow-sm ring-1 ring-slate-900/10 dark:ring-slate-100/10"
        />
      </div>
    );
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      {/* Focus sentinels: they also catch a Tab that walks out of the iframe,
          which a keydown-only trap on the host document cannot see. */}
      <span tabIndex={0} onFocus={focusLast} className="visually-hidden" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-preview-title"
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="min-w-0">
            <h2
              id="resume-preview-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-50"
            >
              Resume preview
            </h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              Exactly what your PDF will contain, including unsaved edits.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onDownload && (
              <button
                type="button"
                className={PRIMARY_BTN}
                onClick={onDownload}
                disabled={!filled || downloading}
              >
                <Download size={16} />
                {downloading ? "Preparing…" : "Download PDF"}
              </button>
            )}
            <button
              type="button"
              className={ICON_BTN}
              onClick={onClose}
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-5">{body}</div>
      </div>

      <span tabIndex={0} onFocus={focusFirst} className="visually-hidden" />
    </div>,
    document.body,
  );
};

export default ResumePreviewModal;
