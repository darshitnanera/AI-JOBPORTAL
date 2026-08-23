import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Info,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  User,
  Wrench,
  X,
} from "lucide-react";

/* ------------------------------------------------------------- primitives */

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900";
const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const LABEL =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const GHOST_DANGER_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-white px-3.5 py-2 text-xs font-semibold text-danger-600 transition-all hover:bg-danger-50 dark:bg-slate-900 dark:hover:bg-danger-500/10";

const Field = ({ id, label, value, onChange, type = "text", placeholder }) => (
  <div>
    <label htmlFor={id} className={LABEL}>
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT}
    />
  </div>
);

const TextField = ({ id, label, value, onChange, rows = 3, placeholder }) => (
  <div>
    <label htmlFor={id} className={LABEL}>
      {label}
    </label>
    <textarea
      id={id}
      rows={rows}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${INPUT} resize-y`}
    />
  </div>
);

/** Card shell with icon chip, title, and save/reset controls. */
const Section = ({ icon, title, description, dirty, saving, onSave, onReset, children }) => {
  const Icon = icon;

  return (
  <section className={CARD}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {dirty && (
          <button type="button" className={SECONDARY_BTN} onClick={onReset} disabled={saving}>
            <RotateCcw size={16} />
            Reset
          </button>
        )}
        <button type="button" className={PRIMARY_BTN} onClick={onSave} disabled={!dirty || saving}>
          <Save size={16} />
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
      </div>
    </div>

    <div className="mt-6 space-y-4">{children}</div>
  </section>
  );
};

/** Repeatable entry wrapper with a remove control. */
const EntryCard = ({ index, label, onRemove, children }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {label} {index + 1}
      </span>
      <button type="button" className={GHOST_DANGER_BTN} onClick={onRemove}>
        <X size={14} />
        Remove
      </button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

const EmptyRow = ({ text }) => (
  <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
    {text}
  </p>
);

/* ------------------------------------------------------------------ page */

const EMPTY = {
  contact: { email: "", phone: "", location: "", linkedin: "" },
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
};

const SECTIONS = Object.keys(EMPTY);

const ParsedResumeDisplay = ({
  resume,
  onUpdate,
  onDraftChange,
  savingSection = null,
  fromScratch = false,
}) => {
  const initial = useMemo(
    () => ({
      contact: { ...EMPTY.contact, ...(resume?.contact || {}) },
      summary: resume?.summary || "",
      skills: [...(resume?.skills || [])],
      experience: (resume?.experience || []).map((e) => ({ ...e })),
      education: (resume?.education || []).map((e) => ({ ...e })),
      projects: (resume?.projects || []).map((p) => ({ ...p, tech: [...(p.tech || [])] })),
      certifications: (resume?.certifications || []).map((c) => ({ ...c })),
    }),
    [resume],
  );

  const [draft, setDraft] = useState(initial);
  const previousInitial = useRef(initial);

  /**
   * Sync only the sections the server actually changed.
   *
   * A section save returns the *whole* resume, so replacing the draft wholesale
   * threw away everything the user had typed into the other sections but not
   * saved yet — fatal when building a resume from scratch, where every section
   * starts unsaved. Comparing against the previous baseline keeps untouched
   * edits alive while still adopting whatever the server sent back.
   */
  useEffect(() => {
    const previous = previousInitial.current;
    previousInitial.current = initial;
    if (previous === initial) return;

    const changed = SECTIONS.filter(
      (key) => JSON.stringify(previous[key]) !== JSON.stringify(initial[key]),
    );
    if (!changed.length) return;

    setDraft((current) => {
      const next = { ...current };
      changed.forEach((key) => {
        next[key] = initial[key];
      });
      return next;
    });
  }, [initial]);

  /* Surface the live form state so the preview and the PDF fallback can render
     what the user is looking at, unsaved edits included. */
  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  const isDirty = (key) =>
    JSON.stringify(draft[key]) !== JSON.stringify(initial[key]);

  const resetSection = (key) =>
    setDraft((prev) => ({ ...prev, [key]: initial[key] }));

  const save = (key) => onUpdate?.(key, draft[key]);

  const setList = (key, updater) =>
    setDraft((prev) => ({ ...prev, [key]: updater(prev[key]) }));

  const updateItem = (key, index, patch) =>
    setList(key, (list) =>
      list.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  const removeItem = (key, index) =>
    setList(key, (list) => list.filter((_, i) => i !== index));

  const addItem = (key, blank) => setList(key, (list) => [...list, blank]);

  return (
    <div className="space-y-6">
      {/* accuracy / getting-started notice */}
      {fromScratch ? (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-500/30 bg-brand-50 p-4 dark:border-brand-500/25 dark:bg-brand-500/10">
          <Info size={18} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" />
          <div>
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
              You&apos;re starting from a blank resume
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Fill in the sections that apply to you and press{" "}
              <span className="font-semibold">Save changes</span> on each one —
              sections are stored separately. Anything you leave empty is left
              out of the PDF.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-warning-500/30 bg-warning-50 p-4 dark:border-warning-500/25 dark:bg-warning-500/10">
          <Info size={18} className="mt-0.5 shrink-0 text-warning-600" />
          <div>
            <p className="text-sm font-semibold text-warning-700 dark:text-warning-500">
              Review this extraction for accuracy
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              These fields were extracted automatically and can contain mistakes.
              Check every section, correct anything that&apos;s wrong, and save it
              before you download or share your resume.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ contact */}
      <Section
        icon={User}
        title="Contact"
        description="How recruiters reach you."
        dirty={isDirty("contact")}
        saving={savingSection === "contact"}
        onSave={() => save("contact")}
        onReset={() => resetSection("contact")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="contact-email"
            label="Email"
            type="email"
            value={draft.contact.email}
            placeholder="you@example.com"
            onChange={(v) =>
              setDraft((p) => ({ ...p, contact: { ...p.contact, email: v } }))
            }
          />
          <Field
            id="contact-phone"
            label="Phone"
            type="tel"
            value={draft.contact.phone}
            placeholder="+1 555 000 1234"
            onChange={(v) =>
              setDraft((p) => ({ ...p, contact: { ...p.contact, phone: v } }))
            }
          />
          <Field
            id="contact-location"
            label="Location"
            value={draft.contact.location}
            placeholder="City, Country"
            onChange={(v) =>
              setDraft((p) => ({ ...p, contact: { ...p.contact, location: v } }))
            }
          />
          <Field
            id="contact-linkedin"
            label="LinkedIn"
            type="url"
            value={draft.contact.linkedin}
            placeholder="https://linkedin.com/in/…"
            onChange={(v) =>
              setDraft((p) => ({ ...p, contact: { ...p.contact, linkedin: v } }))
            }
          />
        </div>
      </Section>

      {/* ------------------------------------------------------------ summary */}
      <Section
        icon={Sparkles}
        title="Professional summary"
        description="Two or three sentences at the top of your resume."
        dirty={isDirty("summary")}
        saving={savingSection === "summary"}
        onSave={() => save("summary")}
        onReset={() => resetSection("summary")}
      >
        <TextField
          id="resume-summary"
          label="Summary"
          rows={5}
          value={draft.summary}
          placeholder="Frontend engineer with 5 years building…"
          onChange={(v) => setDraft((p) => ({ ...p, summary: v }))}
        />
      </Section>

      {/* ------------------------------------------------------------- skills */}
      <Section
        icon={Wrench}
        title="Skills"
        description="One skill per row — add, rename or remove any of them."
        dirty={isDirty("skills")}
        saving={savingSection === "skills"}
        onSave={() => save("skills")}
        onReset={() => resetSection("skills")}
      >
        {draft.skills.length === 0 ? (
          <EmptyRow
            text={
              fromScratch
                ? "No skills yet. Add the ones that matter for your target role."
                : "No skills extracted yet. Add the ones that matter for your target role."
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {draft.skills.map((skill, index) => (
              <div key={index} className="flex items-center gap-2">
                <label className="visually-hidden" htmlFor={`skill-${index}`}>
                  Skill {index + 1}
                </label>
                <input
                  id={`skill-${index}`}
                  value={skill}
                  onChange={(e) =>
                    setList("skills", (list) =>
                      list.map((s, i) => (i === index ? e.target.value : s)),
                    )
                  }
                  className={INPUT}
                />
                <button
                  type="button"
                  aria-label={`Remove skill ${index + 1}`}
                  onClick={() => removeItem("skills", index)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:border-danger-500/40 hover:text-danger-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className={SECONDARY_BTN}
          onClick={() => addItem("skills", "")}
        >
          <Plus size={16} />
          Add skill
        </button>
      </Section>

      {/* --------------------------------------------------------- experience */}
      <Section
        icon={Briefcase}
        title="Experience"
        description="Roles, companies and what you shipped."
        dirty={isDirty("experience")}
        saving={savingSection === "experience"}
        onSave={() => save("experience")}
        onReset={() => resetSection("experience")}
      >
        {draft.experience.length === 0 ? (
          <EmptyRow text="No experience entries yet." />
        ) : (
          draft.experience.map((exp, index) => (
            <EntryCard
              key={index}
              index={index}
              label="Role"
              onRemove={() => removeItem("experience", index)}
            >
              <Field
                id={`exp-role-${index}`}
                label="Job title"
                value={exp.role}
                onChange={(v) => updateItem("experience", index, { role: v })}
              />
              <Field
                id={`exp-company-${index}`}
                label="Company"
                value={exp.company}
                onChange={(v) => updateItem("experience", index, { company: v })}
              />
              <div className="sm:col-span-2">
                <Field
                  id={`exp-duration-${index}`}
                  label="Duration"
                  value={exp.duration}
                  placeholder="Jan 2022 – Present"
                  onChange={(v) => updateItem("experience", index, { duration: v })}
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  id={`exp-desc-${index}`}
                  label="What you did"
                  rows={4}
                  value={exp.description}
                  onChange={(v) => updateItem("experience", index, { description: v })}
                />
              </div>
            </EntryCard>
          ))
        )}

        <button
          type="button"
          className={SECONDARY_BTN}
          onClick={() =>
            addItem("experience", { role: "", company: "", duration: "", description: "" })
          }
        >
          <Plus size={16} />
          Add experience
        </button>
      </Section>

      {/* ---------------------------------------------------------- education */}
      <Section
        icon={GraduationCap}
        title="Education"
        description="Schools, degrees and graduation years."
        dirty={isDirty("education")}
        saving={savingSection === "education"}
        onSave={() => save("education")}
        onReset={() => resetSection("education")}
      >
        {draft.education.length === 0 ? (
          <EmptyRow text="No education entries yet." />
        ) : (
          draft.education.map((edu, index) => (
            <EntryCard
              key={index}
              index={index}
              label="Entry"
              onRemove={() => removeItem("education", index)}
            >
              <Field
                id={`edu-school-${index}`}
                label="School"
                value={edu.school}
                onChange={(v) => updateItem("education", index, { school: v })}
              />
              <Field
                id={`edu-degree-${index}`}
                label="Degree"
                value={edu.degree}
                onChange={(v) => updateItem("education", index, { degree: v })}
              />
              <Field
                id={`edu-field-${index}`}
                label="Field of study"
                value={edu.field}
                onChange={(v) => updateItem("education", index, { field: v })}
              />
              <Field
                id={`edu-year-${index}`}
                label="Year"
                value={edu.year}
                onChange={(v) => updateItem("education", index, { year: v })}
              />
            </EntryCard>
          ))
        )}

        <button
          type="button"
          className={SECONDARY_BTN}
          onClick={() => addItem("education", { school: "", degree: "", field: "", year: "" })}
        >
          <Plus size={16} />
          Add education
        </button>
      </Section>

      {/* ----------------------------------------------------------- projects */}
      <Section
        icon={FolderGit2}
        title="Projects"
        description="Side projects and notable work."
        dirty={isDirty("projects")}
        saving={savingSection === "projects"}
        onSave={() => save("projects")}
        onReset={() => resetSection("projects")}
      >
        {draft.projects.length === 0 ? (
          <EmptyRow text="No projects yet." />
        ) : (
          draft.projects.map((proj, index) => (
            <EntryCard
              key={index}
              index={index}
              label="Project"
              onRemove={() => removeItem("projects", index)}
            >
              <div className="sm:col-span-2">
                <Field
                  id={`proj-name-${index}`}
                  label="Project name"
                  value={proj.name}
                  onChange={(v) => updateItem("projects", index, { name: v })}
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  id={`proj-desc-${index}`}
                  label="Description"
                  value={proj.description}
                  onChange={(v) => updateItem("projects", index, { description: v })}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  id={`proj-tech-${index}`}
                  label="Technologies (comma separated)"
                  value={(proj.tech || []).join(", ")}
                  placeholder="React, Node.js, PostgreSQL"
                  onChange={(v) =>
                    updateItem("projects", index, {
                      tech: v
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </EntryCard>
          ))
        )}

        <button
          type="button"
          className={SECONDARY_BTN}
          onClick={() => addItem("projects", { name: "", description: "", tech: [] })}
        >
          <Plus size={16} />
          Add project
        </button>
      </Section>

      {/* ----------------------------------------------------- certifications */}
      <Section
        icon={Award}
        title="Certifications"
        description="Credentials worth showing on your resume."
        dirty={isDirty("certifications")}
        saving={savingSection === "certifications"}
        onSave={() => save("certifications")}
        onReset={() => resetSection("certifications")}
      >
        {draft.certifications.length === 0 ? (
          <EmptyRow text="No certifications yet." />
        ) : (
          draft.certifications.map((cert, index) => (
            <EntryCard
              key={index}
              index={index}
              label="Certification"
              onRemove={() => removeItem("certifications", index)}
            >
              <div className="sm:col-span-2">
                <Field
                  id={`cert-name-${index}`}
                  label="Name"
                  value={cert.name}
                  onChange={(v) => updateItem("certifications", index, { name: v })}
                />
              </div>
              <Field
                id={`cert-issuer-${index}`}
                label="Issuer"
                value={cert.issuer}
                onChange={(v) => updateItem("certifications", index, { issuer: v })}
              />
              <Field
                id={`cert-date-${index}`}
                label="Date"
                value={cert.date}
                onChange={(v) => updateItem("certifications", index, { date: v })}
              />
            </EntryCard>
          ))
        )}

        <button
          type="button"
          className={SECONDARY_BTN}
          onClick={() => addItem("certifications", { name: "", issuer: "", date: "" })}
        >
          <Plus size={16} />
          Add certification
        </button>
      </Section>
    </div>
  );
};

export default ParsedResumeDisplay;
