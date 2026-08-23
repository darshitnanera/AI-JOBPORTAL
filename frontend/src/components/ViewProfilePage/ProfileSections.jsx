import React from "react";
import {
  UserRound,
  GraduationCap,
  FolderGit2,
  Award,
  Trophy,
  Wrench,
  Target,
  FileText,
  Download,
  Upload,
  Plus,
  Mail,
  Phone,
  Layers,
} from "lucide-react";
import {
  asText,
  educationTitle,
  educationSubtitle,
  educationMeta,
  projectTech,
  certificationMeta,
} from "./profileModel";

/* ------------------------------------------------------------------ *
 * Labelled profile sections. Shared primitives first, then the         *
 * main-column and sidebar compositions used by ViewProfilePage.        *
 * ------------------------------------------------------------------ */

/* Shared secondary-button class (matches DESIGN_SYSTEM.md §3). */
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold " +
  "text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const SectionCard = ({ icon: Icon, title, description, action, children }) => (
  <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {Icon ? (
            <Icon size={18} className="shrink-0 text-brand-600 dark:text-brand-400" />
          ) : null}
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
    <div className="mt-5 min-w-0">{children}</div>
  </section>
);

/** Empty state for a section with no data yet. */
export const SectionEmpty = ({ icon: Icon = Plus, message, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
      <Icon size={18} />
    </span>
    <p className="mt-3 max-w-sm text-sm text-slate-600 dark:text-slate-400">
      {message}
    </p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

/** A labelled scalar field. Missing values read "Not provided", never faked. */
export const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </dt>
    <dd
      className={`mt-1 break-words text-sm font-medium ${
        value
          ? "text-slate-900 dark:text-slate-100"
          : "italic text-slate-500 dark:text-slate-400"
      }`}
    >
      {value || "Not provided"}
    </dd>
  </div>
);

export const BadgeList = ({ items, tone = "brand" }) => {
  const toneClass =
    tone === "accent"
      ? "bg-accent-500/10 text-accent-600 ring-accent-500/25 dark:text-accent-400"
      : "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25";

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className="max-w-full">
          <span
            className={`inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClass}`}
          >
            {typeof item === "string" ? item : String(item)}
          </span>
        </li>
      ))}
    </ul>
  );
};

/* ------------------------- Composite sections --------------------- */

export const PersonalDetailsSection = ({ profile, isRecruiterView }) => {
  const courseLine = [profile.course, profile.specialization, profile.courseDuration]
    .filter(Boolean)
    .join(" · ");

  return (
    <SectionCard
      icon={UserRound}
      title="Profile details"
      description="Core information on this candidate profile."
    >
      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field label="Full name" value={profile.name} />
        <Field label="Gender" value={profile.gender} />
        <Field label="User type" value={profile.roleLabel} />
        <Field label="College" value={profile.college} />
        <Field label="Location" value={profile.location} />
        <Field label="Preferred domain" value={profile.preferredDomain} />
        <div className="sm:col-span-2">
          <Field label="Course, specialization & duration" value={courseLine} />
        </div>
        {!isRecruiterView ? (
          <>
            <Field label="Email" value={profile.email} />
            <Field label="Phone" value={profile.phone} />
          </>
        ) : null}
      </dl>
    </SectionCard>
  );
};

export const SkillsSection = ({ profile, onEdit }) => (
  <SectionCard
    icon={Wrench}
    title="Skills"
    description={
      profile.skills.length > 0
        ? `${profile.skills.length} skill${profile.skills.length === 1 ? "" : "s"} listed.`
        : undefined
    }
  >
    {profile.skills.length > 0 ? (
      <BadgeList items={profile.skills} />
    ) : (
      <SectionEmpty
        icon={Wrench}
        message="No skills listed yet."
        action={
          onEdit ? (
            <button type="button" onClick={onEdit} className={SECONDARY_BTN}>
              <Plus size={16} />
              Add skills
            </button>
          ) : null
        }
      />
    )}
  </SectionCard>
);

export const TargetRolesSection = ({ profile, onEdit }) => (
  <SectionCard
    icon={Target}
    title="Target roles"
    description="Roles this candidate is aiming for."
  >
    {profile.targetRoles.length > 0 ? (
      <BadgeList items={profile.targetRoles} tone="accent" />
    ) : (
      <SectionEmpty
        icon={Target}
        message="No target roles set yet."
        action={
          onEdit ? (
            <button type="button" onClick={onEdit} className={SECONDARY_BTN}>
              <Plus size={16} />
              Add target roles
            </button>
          ) : null
        }
      />
    )}
  </SectionCard>
);

export const EducationSection = ({ profile }) => (
  <SectionCard icon={GraduationCap} title="Education">
    {profile.education.length > 0 ? (
      <ol className="space-y-3">
        {profile.education.map((entry, idx) => (
          <li
            key={idx}
            className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
              {typeof entry === "string" ? entry : educationTitle(entry)}
            </p>
            {typeof entry !== "string" && educationSubtitle(entry) ? (
              <p className="mt-0.5 break-words text-sm text-slate-600 dark:text-slate-400">
                {educationSubtitle(entry)}
              </p>
            ) : null}
            {typeof entry !== "string" && educationMeta(entry) ? (
              <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                {educationMeta(entry)}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    ) : (
      <SectionEmpty icon={GraduationCap} message="No education history added yet." />
    )}
  </SectionCard>
);

export const ProjectsSection = ({ profile }) => (
  <SectionCard icon={FolderGit2} title="Projects">
    {profile.projects.length > 0 ? (
      <ul className="space-y-3">
        {profile.projects.map((entry, idx) => {
          const tech = typeof entry === "string" ? [] : projectTech(entry);
          return (
            <li
              key={idx}
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                {typeof entry === "string"
                  ? entry
                  : asText(entry?.name) || asText(entry?.title) || "Project"}
              </p>
              {typeof entry !== "string" && asText(entry?.description) ? (
                <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-400">
                  {entry.description}
                </p>
              ) : null}
              {tech.length > 0 ? (
                <div className="mt-2">
                  <BadgeList items={tech} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    ) : (
      <SectionEmpty icon={FolderGit2} message="No projects added yet." />
    )}
  </SectionCard>
);

export const CertificationsSection = ({ profile }) => (
  <SectionCard icon={Award} title="Certifications">
    {profile.certifications.length > 0 ? (
      <ul className="space-y-2.5">
        {profile.certifications.map((entry, idx) => (
          <li
            key={idx}
            className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <Award
              size={16}
              className="mt-0.5 shrink-0 text-success-600 dark:text-success-500"
            />
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                {typeof entry === "string"
                  ? entry
                  : asText(entry?.name) || "Certification"}
              </p>
              {typeof entry !== "string" && certificationMeta(entry) ? (
                <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
                  {certificationMeta(entry)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <SectionEmpty icon={Award} message="No certifications added yet." />
    )}
  </SectionCard>
);

export const AchievementsSection = ({ profile }) => (
  <SectionCard icon={Trophy} title="Achievements">
    {profile.achievements.length > 0 ? (
      <ul className="space-y-2.5">
        {profile.achievements.map((entry, idx) => (
          <li key={idx} className="flex min-w-0 items-start gap-3">
            <Trophy
              size={16}
              className="mt-0.5 shrink-0 text-warning-600 dark:text-warning-500"
            />
            <p className="min-w-0 break-words text-sm text-slate-700 dark:text-slate-300">
              {typeof entry === "string"
                ? entry
                : asText(entry?.title) || asText(entry?.name) || "Achievement"}
            </p>
          </li>
        ))}
      </ul>
    ) : (
      <SectionEmpty icon={Trophy} message="No achievements added yet." />
    )}
  </SectionCard>
);

export const ResumeSection = ({ profile, isRecruiterView, onDownload, onEdit }) => (
  <SectionCard icon={FileText} title="Resume">
    {profile.resume ? (
      <button
        type="button"
        onClick={onDownload}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
      >
        <Download size={16} />
        Download resume
      </button>
    ) : (
      <SectionEmpty
        icon={FileText}
        message={
          isRecruiterView
            ? "This candidate has not uploaded a resume."
            : "You haven't uploaded a resume yet."
        }
        action={
          !isRecruiterView && onEdit ? (
            <button type="button" onClick={onEdit} className={SECONDARY_BTN}>
              <Upload size={16} />
              Upload resume
            </button>
          ) : null
        }
      />
    )}
  </SectionCard>
);

export const ContactSection = ({ profile }) => (
  <SectionCard icon={Layers} title="Contact">
    <dl className="space-y-4">
      <div className="min-w-0">
        <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Mail size={13} />
          Email
        </dt>
        <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
          {profile.email ? (
            <a
              href={`mailto:${profile.email}`}
              className="text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
            >
              {profile.email}
            </a>
          ) : (
            <span className="italic text-slate-500 dark:text-slate-400">
              Not provided
            </span>
          )}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Phone size={13} />
          Phone
        </dt>
        <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
          {profile.phone || (
            <span className="italic text-slate-500 dark:text-slate-400">
              Not provided
            </span>
          )}
        </dd>
      </div>
    </dl>
  </SectionCard>
);

export const SectionSkeleton = ({ rows = 3 }) => (
  <div
    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    aria-busy="true"
  >
    <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-full animate-pulse rounded bg-slate-200 last:w-2/3 dark:bg-slate-800"
        />
      ))}
    </div>
  </div>
);
