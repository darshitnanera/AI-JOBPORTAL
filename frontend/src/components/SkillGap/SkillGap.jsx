import React, { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Sparkles,
} from "lucide-react";

/**
 * SkillGap — matching skills, missing skills, learning path and action items
 * for ONE specific job. Renders only data supplied by the API.
 *
 * Props:
 *   skillGaps      { missingSkills:[{name,difficulty}], gapSeverity, recommendations, actionItems }
 *   matchingSkills string[]
 */

const SEVERITY = {
  easy: {
    label: "Easy to learn",
    chip: "bg-success-50 text-success-700 ring-success-600/20 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25",
  },
  medium: {
    label: "Moderate learning curve",
    chip: "bg-warning-50 text-warning-700 ring-warning-600/20 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25",
  },
  hard: {
    label: "Significant effort required",
    chip: "bg-danger-50 text-danger-700 ring-danger-600/20 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/25",
  },
};

const severityOf = (key) => SEVERITY[key] || SEVERITY.medium;

const Section = ({ id, icon, title, subtitle, open, onToggle, children }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <button
      type="button"
      onClick={() => onToggle(id)}
      aria-expanded={open}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon}
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </span>
          {subtitle && (
            <span className="block truncate text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-slate-500 dark:text-slate-400">
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </span>
    </button>
    {open && (
      <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">{children}</div>
    )}
  </div>
);

const SkillGap = ({ skillGaps, matchingSkills = [] }) => {
  const [open, setOpen] = useState("matching");
  const toggle = (section) => setOpen((cur) => (cur === section ? null : section));

  const {
    missingSkills = [],
    gapSeverity = "medium",
    recommendations = {},
    actionItems = [],
  } = skillGaps || {};

  const matched = Array.isArray(matchingSkills) ? matchingSkills : [];
  const missing = Array.isArray(missingSkills) ? missingSkills : [];
  const learning = recommendations?.recommendations || [];

  if (matched.length === 0 && missing.length === 0 && learning.length === 0 && actionItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <Sparkles size={20} className="mx-auto text-slate-400" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
          No skill analysis for this job yet
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Upload and parse your resume so we can compare it against this role's requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matched.length > 0 && (
        <Section
          id="matching"
          open={open === "matching"}
          onToggle={toggle}
          icon={<CheckCircle2 size={20} className="text-success-600" aria-hidden="true" />}
          title="Matching Skills"
          subtitle={`${matched.length} of this job's requirements you already have`}
        >
          <ul className="flex flex-wrap gap-2">
            {matched.map((skill) => (
              <li
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-600/20 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25"
              >
                <CheckCircle2 size={14} className="text-success-600" aria-hidden="true" />
                {skill}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {missing.length > 0 && (
        <Section
          id="missing"
          open={open === "missing"}
          onToggle={toggle}
          icon={<AlertTriangle size={20} className="text-warning-600" aria-hidden="true" />}
          title="Missing Skills"
          subtitle={`${missing.length} requirement${missing.length === 1 ? "" : "s"} not found on your profile`}
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gap severity:{" "}
              <span
                className={`ml-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityOf(gapSeverity).chip}`}
              >
                {severityOf(gapSeverity).label}
              </span>
            </p>
            <ul className="flex flex-wrap gap-2">
              {missing.map((item) => {
                const name = typeof item === "string" ? item : item?.name;
                const difficulty = typeof item === "string" ? null : item?.difficulty;
                return (
                  <li
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-700 ring-1 ring-warning-600/20 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/25"
                  >
                    <AlertTriangle size={14} className="text-warning-600" aria-hidden="true" />
                    {name}
                    {difficulty && (
                      <span className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                        {difficulty}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>
      )}

      {learning.length > 0 && (
        <Section
          id="learning"
          open={open === "learning"}
          onToggle={toggle}
          icon={<BookOpen size={20} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />}
          title="Learning Path"
          subtitle={
            recommendations?.overallTimeEstimate
              ? `Estimated ${recommendations.overallTimeEstimate} to close the gap`
              : undefined
          }
        >
          <ol className="space-y-3">
            {learning.map((rec, idx) => (
              <li
                key={`${rec.skill}-${idx}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {rec.skill}
                  </h4>
                  {rec.estimatedTime && (
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
                      {rec.estimatedTime}
                    </span>
                  )}
                </div>
                {Array.isArray(rec.resources) && rec.resources.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rec.resources.map((resource, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span aria-hidden="true" className="text-brand-600 dark:text-brand-400">
                          •
                        </span>
                        {resource}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {actionItems.length > 0 && (
        <Section
          id="actions"
          open={open === "actions"}
          onToggle={toggle}
          icon={<ListChecks size={20} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />}
          title="Action Items"
          subtitle={`${actionItems.length} suggested next step${actionItems.length === 1 ? "" : "s"}`}
        >
          <ul className="space-y-3">
            {actionItems.map((item, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {item.priority && (
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
                      {item.priority}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {item.action}
                  </h4>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.timeline && (
                    <span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Timeline:
                      </span>{" "}
                      {item.timeline}
                    </span>
                  )}
                  {item.resources && (
                    <span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Resources:
                      </span>{" "}
                      {item.resources}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

export default SkillGap;
