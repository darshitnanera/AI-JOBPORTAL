import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  IndianRupee,
  MapPin,
  UserRound,
} from "lucide-react";
import MatchScore from "../MatchScore/MatchScore";
import { hasScore } from "../MatchScore/hasScore";
import {
  avatarGradient,
  companyInitial,
  formatJobType,
  formatRelativeDate,
  formatSalary,
} from "./jobFormat";

const MAX_SKILLS = 5;

/**
 * JobCard — one opportunity = company + role together.
 *
 * The AI match badge is rendered ONLY when the API returned a score for this
 * job (logged-out users and unscored jobs simply get no badge — never a
 * placeholder or invented percentage).
 */
const JobCard = ({
  job,
  matchScore = null,
  isSaved = false,
  isApplied = false,
  onSave,
  onApply,
}) => {
  const [logoBroken, setLogoBroken] = useState(false);
  const showLogo = job.logo && !logoBroken;

  const skills = job.techStack || [];
  const visibleSkills = skills.slice(0, MAX_SKILLS);
  const extraSkills = skills.length - visibleSkills.length;

  const salary = formatSalary(job.salary, job.salaryType);
  const posted = formatRelativeDate(job.datePosted);

  const meta = [
    job.location && { icon: MapPin, label: job.location },
    job.jobType && { icon: BriefcaseBusiness, label: formatJobType(job.jobType) },
    job.experience && { icon: UserRound, label: job.experience },
    salary && { icon: IndianRupee, label: salary },
  ].filter(Boolean);

  return (
    <article
      className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
                 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-xl
                 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      {/* Header: company avatar + company name + role, match score top-right */}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 ${
            showLogo ? "bg-white dark:bg-slate-800" : `bg-linear-to-br ${avatarGradient(job.company)}`
          }`}
        >
          {showLogo ? (
            <img
              src={job.logo}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <span className="text-lg font-bold text-white">{companyInitial(job.company)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-600 dark:text-slate-400">
            {job.company}
          </p>
          <h3 className="mt-0.5 text-lg font-bold leading-snug text-slate-900 dark:text-slate-50">
            <Link
              to={`/jobdetails/${job.id}`}
              className="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand-700 dark:hover:text-brand-300"
            >
              {job.role}
            </Link>
          </h3>
          {job.category && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
              {job.category}
            </span>
          )}
        </div>

        {hasScore(matchScore) && (
          <div className="relative z-10 shrink-0">
            <MatchScore score={matchScore} size="badge" />
          </div>
        )}
      </div>

      {/* Metadata row */}
      {meta.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {meta.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
              >
                <Icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Required skills */}
      {visibleSkills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <li
              key={skill}
              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
            >
              {skill}
            </li>
          ))}
          {extraSkills > 0 && (
            <li className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              +{extraSkills} more
            </li>
          )}
        </ul>
      )}

      {/* Footer */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        {posted ? (
          <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CalendarDays size={14} aria-hidden="true" />
            {posted}
          </span>
        ) : (
          <span />
        )}

        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave?.(job.id)}
            aria-label={isSaved ? `Unsave ${job.role}` : `Save ${job.role}`}
            aria-pressed={isSaved}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              isSaved
                ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>

          <button
            type="button"
            onClick={() => !isApplied && onApply?.(job)}
            disabled={isApplied}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all ${
              isApplied
                ? "cursor-default bg-success-50 text-success-700 ring-1 ring-success-600/20 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25"
                : "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
            }`}
          >
            {isApplied ? "Applied" : "Apply Now"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default JobCard;
