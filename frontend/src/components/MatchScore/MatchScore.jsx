import React from "react";
import { Sparkles } from "lucide-react";
import { hasScore } from "./hasScore";

/**
 * MatchScore — AI job match percentage.
 *
 * Renders ONLY what the API returned. If `score` is null/undefined/NaN the
 * component renders nothing at all (never a fabricated percentage).
 *
 * Props:
 *   score   {number}  0–100, from the API
 *   size    {"badge"|"small"|"medium"|"large"}
 *   showDetails {boolean}
 *   details {object}  matchResult from /api/job-match/:jobId/match
 */

const TONES = {
  excellent: {
    ring: "#16a34a",
    text: "text-success-700 dark:text-success-500",
    chip: "bg-success-50 text-success-700 ring-success-600/20 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25",
    label: "Excellent match",
  },
  good: {
    ring: "#4f46e5",
    text: "text-brand-700 dark:text-brand-300",
    chip: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
    label: "Good match",
  },
  moderate: {
    ring: "#d97706",
    text: "text-warning-700 dark:text-warning-500",
    chip: "bg-warning-50 text-warning-700 ring-warning-600/20 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25",
    label: "Moderate match",
  },
  low: {
    ring: "#dc2626",
    text: "text-danger-700 dark:text-danger-500",
    chip: "bg-danger-50 text-danger-700 ring-danger-600/20 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/25",
    label: "Low match",
  },
};

const toneFor = (score) => {
  if (score >= 80) return TONES.excellent;
  if (score >= 60) return TONES.good;
  if (score >= 40) return TONES.moderate;
  return TONES.low;
};

const SIZES = {
  badge: { box: "h-11 w-11", inner: "inset-[3px]", value: "text-[11px]", label: "text-[10px]" },
  small: { box: "h-14 w-14", inner: "inset-[4px]", value: "text-xs", label: "text-[11px]" },
  medium: { box: "h-20 w-20", inner: "inset-[5px]", value: "text-lg", label: "text-xs" },
  large: { box: "h-32 w-32", inner: "inset-[7px]", value: "text-3xl", label: "text-sm" },
};

const MatchScore = ({ score, size = "medium", showDetails = false, details = null }) => {
  if (!hasScore(score)) return null;

  const value = Math.max(0, Math.min(100, Math.round(Number(score))));
  const tone = toneFor(value);
  const dims = SIZES[size] || SIZES.medium;

  const detailRows = showDetails && details
    ? [
        ["Skills", details.skillMatch?.matchPercentage],
        ["Experience", details.experienceMatch?.score],
        ["Education", details.educationMatch?.score],
      ].filter(([, v]) => hasScore(v))
    : [];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative ${dims.box} shrink-0 rounded-full`}
        style={{
          background: `conic-gradient(${tone.ring} ${value * 3.6}deg, rgb(226 232 240) 0deg)`,
        }}
        role="img"
        aria-label={`AI match score ${value} percent — ${tone.label}`}
      >
        <div
          className={`absolute ${dims.inner} flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900`}
        >
          <span className={`${dims.value} font-bold leading-none ${tone.text}`}>{value}%</span>
          {(size === "medium" || size === "large") && (
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              match
            </span>
          )}
        </div>
      </div>

      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tone.chip}`}
      >
        <Sparkles size={12} aria-hidden="true" />
        {tone.label}
      </span>

      {detailRows.length > 0 && (
        <dl className="mt-2 grid w-full grid-cols-3 gap-2">
          {detailRows.map(([label, v]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center dark:border-slate-800 dark:bg-slate-800/60"
            >
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className={`text-sm font-bold ${tone.text}`}>{Math.round(Number(v))}%</dd>
            </div>
          ))}
        </dl>
      )}

      {showDetails && details?.explanation && (
        <p className="mt-1 text-center text-sm text-slate-600 dark:text-slate-300">
          {details.explanation}
        </p>
      )}
    </div>
  );
};

export default MatchScore;
