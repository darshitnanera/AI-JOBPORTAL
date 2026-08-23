/**
 * DEVELOPMENT ONLY — dummy identities for offline navigation.
 *
 * Nothing in src/dev/ may be imported from production code paths. The single
 * entry point (installDevMode) is loaded behind `if (import.meta.env.DEV)`,
 * which Vite replaces with the literal `false` in a production build, so
 * Rollup removes this whole subtree from the shipped bundle.
 */

/** Not a real credential — a marker the backend will always reject. */
const devToken = (role) => `dev-mock-token.${role}.not-a-real-jwt`;

const CANDIDATE = {
  id: "dev-candidate-0001",
  _id: "dev-candidate-0001",
  name: "Dev Candidate",
  email: "candidate@test.com",
  role: "candidate",
  userType: "candidate",
  profileCompleted: true,
  isVerified: true,
  phone: "+91 90000 00001",
  gender: "Prefer not to say",
  college: "National Institute of Technology, Surat",
  location: "Bengaluru, India",
  course: "B.Tech",
  specialization: "Computer Science and Engineering",
  duration: "2017 – 2021",
  preferredDomain: "Web Engineering",
  targetRoles: ["Frontend Developer", "Full Stack Engineer"],
  skills: [
    "React", "JavaScript", "TypeScript", "Node.js",
    "REST API", "Redux", "Tailwind CSS", "Jest", "Git",
  ],
  achievements: [
    "Runner-up, National Hackathon 2020",
    "Published an open-source component library",
  ],
  github: "https://github.com/octocat",
  linkedin: "https://www.linkedin.com/in/dev-candidate",
  leetcode: "dev-candidate",
  token: devToken("candidate"),
};

const RECRUITER = {
  id: "dev-recruiter-0001",
  _id: "dev-recruiter-0001",
  name: "Dev Recruiter",
  email: "recruiter@test.com",
  role: "recruiter",
  userType: "recruiter",
  profileCompleted: true,
  isVerified: true,
  recruiterProfile: {
    companyName: "TechVision Inc",
    companyWebsite: "https://techvision.example.com",
    industryType: "Information Technology",
    companySize: "201-500",
    isVerified: true,
  },
  token: devToken("recruiter"),
};

const ADMIN = {
  id: "dev-admin-0001",
  _id: "dev-admin-0001",
  name: "Dev Admin",
  email: "admin@test.com",
  role: "admin",
  userType: "admin",
  profileCompleted: true,
  isVerified: true,
  token: devToken("admin"),
};

export const PERSONAS = {
  candidate: CANDIDATE,
  recruiter: RECRUITER,
  admin: ADMIN,
};

/** Credentials the dev login shortcut accepts. Development builds only. */
export const DEV_CREDENTIALS = [
  { email: "candidate@test.com", password: "password123", persona: "candidate" },
  { email: "recruiter@test.com", password: "password123", persona: "recruiter" },
  { email: "admin@test.com", password: "password123", persona: "admin" },
];

/** Resolve a persona from a `?dev=` value. Returns null when unrecognised. */
export function personaFor(key) {
  if (!key) return null;
  const k = String(key).trim().toLowerCase();
  // `user` is how the legacy code spells a candidate.
  if (k === "user") return PERSONAS.candidate;
  return PERSONAS[k] || null;
}

/** Match a submitted email/password against the dev credential list. */
export function personaForCredentials(email, password) {
  const e = String(email || "").trim().toLowerCase();
  const p = String(password || "");
  const hit = DEV_CREDENTIALS.find((c) => c.email === e && c.password === p);
  return hit ? PERSONAS[hit.persona] : null;
}
