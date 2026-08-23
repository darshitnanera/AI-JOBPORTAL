/**
 * Normalises the /api/user/profile (and /api/integrations/candidate/:id)
 * payload into one predictable shape for the profile surfaces.
 *
 * Rules:
 *  - Nothing is invented. A field the API did not return comes back as
 *    `null` / `[]`, and the UI renders a "Not provided" affordance for it
 *    instead of a made-up value.
 *  - `parsedResume` is used as a documented secondary source for the
 *    resume-derived sections (skills, education, projects, certifications).
 */

const text = (value) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const list = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  const asText = text(value);
  if (!asText) return [];
  /* Tolerate comma / pipe separated strings coming from older records. */
  return asText
    .split(/[,|]/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const firstText = (...values) => {
  for (const value of values) {
    const found = text(value);
    if (found) return found;
  }
  return null;
};

const firstList = (...values) => {
  for (const value of values) {
    const found = list(value);
    if (found.length > 0) return found;
  }
  return [];
};

export const ROLE_LABELS = {
  candidate: "Candidate",
  user: "Candidate",
  recruiter: "Recruiter",
  admin: "Admin",
};

export const initialsFor = (name) => {
  const clean = text(name);
  if (!clean) return "?";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export const normaliseProfile = (user, integrations) => {
  const source = user || {};
  const parsed = source.parsedResume || {};
  const contact = parsed.contact || {};

  const role = (source.userType || source.role || "").toLowerCase();

  return {
    id: source._id || source.id || null,
    name: text(source.name),
    email: firstText(source.email, contact.email),
    phone: firstText(source.phone, contact.phone),

    gender: text(source.gender),
    role,
    roleLabel: ROLE_LABELS[role] || (role ? role : null),

    headline: firstText(
      source.headline,
      source.title,
      integrations?.linkedin?.headline,
      parsed.summary,
    ),

    college: firstText(
      source.college,
      source.university,
      source.institute,
      parsed.education?.[0]?.school,
    ),
    location: firstText(source.location, source.city, contact.location),

    course: firstText(source.course, source.degree, parsed.education?.[0]?.degree),
    specialization: firstText(
      source.specialization,
      source.branch,
      source.stream,
      parsed.education?.[0]?.field,
    ),
    courseDuration: firstText(
      source.courseDuration,
      source.duration,
      parsed.education?.[0]?.year,
    ),

    preferredDomain: firstText(source.preferredDomain, source.domain),
    targetRoles: firstList(source.targetRoles, source.targetRole, source.preferredRoles),

    skills: firstList(source.skills, parsed.skills),
    education: firstList(source.education, parsed.education),
    projects: firstList(source.projects, parsed.projects),
    certifications: firstList(source.certifications, parsed.certifications),
    achievements: firstList(source.achievements, source.awards),

    resume: source.resume || null,
    profileCompleted: Boolean(source.profileCompleted),
  };
};

/** Free-text summary of one education entry, whatever keys it carries. */
export const educationTitle = (entry) =>
  firstText(entry?.degree, entry?.course, entry?.qualification) || "Education";

export const educationSubtitle = (entry) =>
  [text(entry?.school), text(entry?.institute), text(entry?.university)]
    .filter(Boolean)
    .join(" · ") || null;

export const educationMeta = (entry) =>
  [text(entry?.field), text(entry?.year), text(entry?.duration), text(entry?.grade)]
    .filter(Boolean)
    .join(" · ") || null;

export const projectTech = (entry) => firstList(entry?.tech, entry?.technologies);

export const certificationMeta = (entry) =>
  [text(entry?.issuer), text(entry?.date), text(entry?.year)]
    .filter(Boolean)
    .join(" · ") || null;

export { text as asText, list as asList };
