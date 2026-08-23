import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Loader2,
  Mic,
  MicOff,
  X,
} from "lucide-react";
import useSpeechRecognition from "./useSpeechRecognition";
import {
  BADGE_BRAND,
  BADGE_NEUTRAL,
  CARD,
  DIFFICULTY_BADGE,
  LABEL,
  MUTED,
  PRIMARY_BTN,
  SECONDARY_BTN,
  TEXTAREA,
} from "./ui";

const formatElapsed = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/**
 * Phase 2 — the simulator. One question at a time, an elapsed timer, and
 * Previous / Next / Finish. Nothing here scores anything: answers are held as
 * plain text and sent to the server, which owns every number.
 */
export default function SimulatorPhase({
  session,
  answers,
  onAnswerChange,
  onFinish,
  onQuit,
  submitting,
  submitError,
}) {
  const questions = useMemo(() => session?.questions || [], [session]);
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());
  const textareaRef = useRef(null);

  const { supported, listening, error: speechError, start, stop } =
    useSpeechRecognition();

  // Elapsed timer — derived from a fixed start stamp so a backgrounded tab
  // (where intervals are throttled) still reports the real duration.
  useEffect(() => {
    const tick = () =>
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Dictation belongs to one question at a time.
  useEffect(() => {
    if (listening) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q._id] || "").trim()).length,
    [questions, answers]
  );
  const progressPercent = questions.length
    ? Math.round(((index + 1) / questions.length) * 100)
    : 0;

  const appendTranscript = (text) => {
    const current = answers[question._id] || "";
    const separator = current && !/\s$/.test(current) ? " " : "";
    onAnswerChange(question._id, `${current}${separator}${text}`);
  };

  const toggleDictation = () => {
    if (listening) {
      stop();
    } else {
      start(appendTranscript);
      textareaRef.current?.focus();
    }
  };

  const goTo = (nextIndex) => {
    setIndex(Math.min(Math.max(nextIndex, 0), questions.length - 1));
  };

  const handleFinish = () => {
    if (listening) stop();
    onFinish(Math.floor((Date.now() - startedAt.current) / 1000));
  };

  if (!question) return null;

  return (
    <div className="space-y-6">
      {/* Session bar */}
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-4`}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {session.targetRole}
          </p>
          <p className={MUTED}>{session.companyName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={BADGE_NEUTRAL}>
            <Clock size={12} />
            {formatElapsed(elapsed)}
          </span>
          <span className={BADGE_BRAND}>
            {answeredCount}/{questions.length} answered
          </span>
          <button
            type="button"
            onClick={onQuit}
            disabled={submitting}
            className={SECONDARY_BTN}
          >
            <X size={16} />
            Exit
          </button>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Question {index + 1} of {questions.length}
          </p>
          <p className={MUTED}>{progressPercent}%</p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-label={`Question ${index + 1} of ${questions.length}`}
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question + answer */}
      <div className={CARD}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={BADGE_BRAND}>{question.category}</span>
          <span className={DIFFICULTY_BADGE[question.difficulty] || BADGE_NEUTRAL}>
            {question.difficulty}
          </span>
        </div>

        <h2 className="text-xl font-bold leading-relaxed text-slate-900 dark:text-slate-50">
          {question.questionText}
        </h2>

        <div className="mt-6">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className={`${LABEL} mb-0`} htmlFor={`answer-${question._id}`}>
              Your answer
            </label>

            {/* Rendered only where the Web Speech API actually exists. */}
            {supported ? (
              <button
                type="button"
                onClick={toggleDictation}
                className={
                  listening
                    ? "inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-700 transition-all hover:bg-danger-50/80 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500"
                    : "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
                {listening ? "Stop dictation" : "Dictate answer"}
              </button>
            ) : null}
          </div>

          <textarea
            id={`answer-${question._id}`}
            ref={textareaRef}
            value={answers[question._id] || ""}
            onChange={(event) => onAnswerChange(question._id, event.target.value)}
            placeholder="Answer as you would out loud — cover the reasoning, not just the conclusion."
            className={`${TEXTAREA} min-h-44`}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className={MUTED}>
              {(answers[question._id] || "").trim()
                ? `${(answers[question._id] || "").trim().split(/\s+/).length} words`
                : "Not answered yet"}
            </p>
            {listening ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-danger-600 dark:text-danger-500">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-danger-500" />
                Listening…
              </p>
            ) : null}
          </div>

          {speechError ? (
            <p className="mt-2 text-xs font-medium text-warning-700 dark:text-warning-500">
              {speechError}
            </p>
          ) : null}
        </div>
      </div>

      {submitError ? (
        <div className="flex items-start gap-2 rounded-xl border border-danger-500/40 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      ) : null}

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0 || submitting}
          className={SECONDARY_BTN}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className={PRIMARY_BTN}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Flag size={16} />
            )}
            {submitting ? "Scoring your answers…" : "Finish and get feedback"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={submitting}
            className={PRIMARY_BTN}
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
