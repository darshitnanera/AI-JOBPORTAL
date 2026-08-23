import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  GraduationCap,
  Mail,
  Phone,
  Pencil,
  MessageSquare,
  Download,
  BadgeCheck,
} from "lucide-react";
import { initialsFor } from "./profileModel";

/* ------------------------------------------------------------------ *
 * Profile header card — avatar, name, headline, location, college and  *
 * a role badge, plus the primary action for the current viewer.        *
 * ------------------------------------------------------------------ */

const ROLE_BADGE_CLASS = {
  recruiter:
    "bg-accent-500/10 text-accent-600 ring-accent-500/25 dark:text-accent-400",
  admin: "bg-danger-500/10 text-danger-600 ring-danger-500/25 dark:text-danger-500",
  candidate: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
  user: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
};

const MetaItem = ({ icon: Icon, children }) =>
  children ? (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  ) : null;

export const ProfileHeaderSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="h-8 w-56 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="flex flex-wrap gap-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  </div>
);

const ProfileHeaderCard = ({
  profile,
  isRecruiterView = false,
  onEdit,
  onDownloadResume,
}) => {
  const badgeClass =
    ROLE_BADGE_CLASS[profile.role] || ROLE_BADGE_CLASS.candidate;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Brand → accent band */}
      <div className="h-20 bg-linear-to-r from-brand-600 to-accent-500" />

      <div className="px-6 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          {/* Avatar — initials on the brand → accent gradient */}
          <div
            className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-accent-500 text-3xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-slate-900"
            aria-hidden="true"
          >
            {initialsFor(profile.name)}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="min-w-0 break-words text-3xl font-bold text-slate-900 dark:text-slate-50">
                {profile.name || "Unnamed candidate"}
              </h1>
              {profile.roleLabel ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass}`}
                >
                  <BadgeCheck size={14} />
                  {profile.roleLabel}
                </span>
              ) : null}
            </div>

            {profile.headline ? (
              <p className="mt-1.5 break-words text-base text-slate-600 dark:text-slate-300">
                {profile.headline}
              </p>
            ) : profile.targetRoles.length > 0 ? (
              <p className="mt-1.5 break-words text-base text-slate-600 dark:text-slate-300">
                Targeting {profile.targetRoles.slice(0, 3).join(", ")}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <MetaItem icon={MapPin}>{profile.location}</MetaItem>
              <MetaItem icon={GraduationCap}>{profile.college}</MetaItem>
              {!isRecruiterView ? (
                <>
                  <MetaItem icon={Mail}>{profile.email}</MetaItem>
                  <MetaItem icon={Phone}>{profile.phone}</MetaItem>
                </>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap gap-3 sm:justify-end">
            {isRecruiterView ? (
              <>
                {profile.resume ? (
                  <button
                    type="button"
                    onClick={onDownloadResume}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Download size={16} />
                    Resume
                  </button>
                ) : null}
                <Link
                  to="/messages"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
                >
                  <MessageSquare size={16} />
                  Message candidate
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
              >
                <Pencil size={16} />
                Edit profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderCard;
