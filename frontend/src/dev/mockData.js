/**
 * DEVELOPMENT ONLY — offline fixtures.
 *
 * Shapes mirror the real controllers so components need no special-casing.
 * Every payload carries `__mock: true` so mock data can never be mistaken
 * for a live response, in the UI or in a network log.
 *
 * Stripped from production builds — see personas.js for the mechanism.
 */
import { PERSONAS } from "./personas.js";

const logo = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=4f46e5&color=fff&size=128&bold=true`;

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const job = (i, o) => ({
  _id: `dev-job-${String(i).padStart(4, "0")}`,
  companyLogo: logo(o.companyName),
  postDate: daysAgo(i),
  salaryType: "/year",
  openings: 2,
  status: "active",
  applicationCount: 0,
  responsibilities: [
    "Ship features end to end against agreed designs",
    "Review code and support teammates",
    "Improve reliability and performance of what you own",
  ],
  jobCriteria: [
    "Strong fundamentals in the core stack",
    "Comfortable owning work with limited supervision",
  ],
  education: ["Bachelor's degree in a technical field or equivalent"],
  ...o,
});

export const MOCK_JOBS = [
  job(0, {
    companyName: "TechVision Inc",
    roleName: "Senior Frontend Developer",
    techStack: ["React", "TypeScript", "Redux", "Tailwind CSS", "Jest"],
    location: "Bengaluru, India",
    experience: "3-5 years",
    salary: 120000,
    jobType: "Full Time",
    category: "Engineering",
    overview:
      "Own major surfaces of the customer-facing platform and set frontend standards for the team.",
  }),
  job(1, {
    companyName: "WebFlow Systems",
    roleName: "Full Stack Engineer",
    techStack: ["React", "Node.js", "PostgreSQL", "Docker", "AWS"],
    location: "Remote (India)",
    experience: "2-4 years",
    salary: 95000,
    jobType: "Full Time",
    category: "Engineering",
    overview:
      "Work across the stack on tooling that automates release pipelines for engineering teams.",
  }),
  job(2, {
    companyName: "DataSphere Analytics",
    roleName: "Data Scientist",
    techStack: ["Python", "Pandas", "scikit-learn", "SQL", "TensorFlow"],
    location: "Hyderabad, India",
    experience: "2-5 years",
    salary: 140000,
    jobType: "Full Time",
    category: "Data Science",
    overview:
      "Turn behavioural datasets into models that drive product decisions, from notebook to production.",
  }),
  job(3, {
    companyName: "CloudNine Software",
    roleName: "Backend Engineer",
    techStack: ["Node.js", "MongoDB", "Redis", "Kubernetes", "GraphQL"],
    location: "Pune, India",
    experience: "3-6 years",
    salary: 110000,
    jobType: "Full Time",
    category: "Engineering",
    overview:
      "Design the services behind a multi-tenant SaaS platform, with a focus on reliability.",
  }),
  job(4, {
    companyName: "InnovateLabs",
    roleName: "Frontend Developer Intern",
    techStack: ["React", "JavaScript", "CSS", "Git"],
    location: "Remote (India)",
    experience: "0-1 years",
    salary: 25000,
    salaryType: "/month",
    jobType: "Internship",
    category: "Engineering",
    overview:
      "A six-month internship shipping real features with a mentor assigned from day one.",
  }),
  job(5, {
    companyName: "PixelCraft Studio",
    roleName: "UI/UX Designer",
    techStack: ["Figma", "Prototyping", "Design Systems", "User Research"],
    location: "Mumbai, India",
    experience: "2-4 years",
    salary: 85000,
    jobType: "Full Time",
    category: "Design",
    overview:
      "Own product design from discovery research through to a maintained design system.",
  }),
];

/** Scores are fixed, not random, so repeated loads stay consistent. */
const MATCH_SCORES = { 0: 88, 1: 74, 2: 41, 3: 52, 4: 91, 5: 38 };

/**
 * Missing skills per job, in the shape the real matcher emits
 * (`{name, difficulty}` where difficulty is easy | medium | hard).
 * The dashboard collapses hard→high and easy→low for its severity pills.
 */
const MISSING_SKILLS = {
  0: [
    { name: "System design", difficulty: "hard" },
    { name: "TypeScript generics", difficulty: "medium" },
  ],
  1: [
    { name: "PostgreSQL", difficulty: "medium" },
    { name: "Docker", difficulty: "medium" },
    { name: "SQL joins", difficulty: "easy" },
  ],
  2: [
    { name: "Machine learning", difficulty: "hard" },
    { name: "Pandas", difficulty: "medium" },
  ],
  3: [
    { name: "Kubernetes", difficulty: "hard" },
    { name: "Redis", difficulty: "medium" },
    { name: "GraphQL", difficulty: "medium" },
  ],
  4: [{ name: "Git rebasing", difficulty: "easy" }],
  5: [{ name: "User research", difficulty: "medium" }],
};

const jobsWithMatch = MOCK_JOBS.map((j, i) => ({
  ...j,
  matchScore: MATCH_SCORES[i],
  matchDetails: {
    matchScore: MATCH_SCORES[i],
    skillsScore: MATCH_SCORES[i],
    explanation: "Offline fixture — not a computed score.",
  },
  skillGaps: {
    matchingSkills: (j.techStack || [])
      .slice(0, 3)
      .map((name) => ({ name })),
    missingSkills: MISSING_SKILLS[i] || [],
  },
}));

const MOCK_PARSED_RESUME = {
  contact: {
    email: "candidate@test.com",
    phone: "+91 90000 00001",
    location: "Bengaluru, India",
    linkedin: "https://www.linkedin.com/in/dev-candidate",
  },
  summary:
    "Frontend engineer with four years building React interfaces and design systems.",
  skills: PERSONAS.candidate.skills,
  experience: [
    {
      company: "Acme Web",
      role: "Frontend Developer",
      duration: "2021 – 2024",
      description:
        "Built and maintained the component library powering the main product surface.",
    },
    {
      company: "Bright Interactive",
      role: "Junior Developer",
      duration: "2020 – 2021",
      description: "Implemented marketing pages and internal dashboards.",
    },
  ],
  education: [
    {
      school: "National Institute of Technology, Surat",
      degree: "B.Tech",
      field: "Computer Science and Engineering",
      year: "2021",
    },
  ],
  projects: [
    {
      name: "Analytics Dashboard",
      description: "Realtime charting UI over a streaming API.",
      tech: ["React", "Redux", "D3"],
    },
  ],
  certifications: [
    { name: "Meta Front-End Developer", issuer: "Coursera", date: "2022" },
  ],
};

const MOCK_APPLICATIONS = [
  {
    _id: "dev-app-0001",
    status: "Shortlisted",
    createdAt: daysAgo(2),
    job: MOCK_JOBS[0],
  },
  {
    _id: "dev-app-0002",
    status: "Reviewing",
    createdAt: daysAgo(6),
    job: MOCK_JOBS[1],
  },
  {
    _id: "dev-app-0003",
    status: "Applied",
    createdAt: daysAgo(11),
    job: MOCK_JOBS[3],
  },
];

const MOCK_CONVERSATIONS = [
  {
    // The real controller returns `chatId: chat._id` — the Messages page uses
    // it as both the React key and the id in the mark-as-read URL. Emitting
    // `_id` here instead produced an undefined key and a request to
    // /api/messages/chat/undefined/read.
    chatId: "dev-chat-0001",
    _id: "dev-chat-0001",
    participants: [PERSONAS.candidate, PERSONAS.recruiter],
    otherUser: {
      _id: PERSONAS.recruiter._id,
      name: PERSONAS.recruiter.name,
      email: PERSONAS.recruiter.email,
      role: "recruiter",
    },
    lastMessage: {
      content: "Thanks for applying — are you free for a call this week?",
      createdAt: daysAgo(1),
    },
    unreadCount: 2,
  },
];

const MOCK_MESSAGES = [
  {
    _id: "dev-msg-0001",
    chatId: "dev-chat-0001",
    sender: PERSONAS.recruiter._id,
    content: "Hi! We reviewed your profile for the Senior Frontend role.",
    createdAt: daysAgo(2),
    isRead: true,
  },
  {
    _id: "dev-msg-0002",
    chatId: "dev-chat-0001",
    sender: PERSONAS.candidate._id,
    content: "Thanks for reaching out — I'd be glad to talk.",
    createdAt: daysAgo(2),
    isRead: true,
  },
  {
    _id: "dev-msg-0003",
    chatId: "dev-chat-0001",
    sender: PERSONAS.recruiter._id,
    content: "Thanks for applying — are you free for a call this week?",
    createdAt: daysAgo(1),
    isRead: false,
  },
];

/**
 * Map a request to a fixture.
 * @returns {{status:number, body:object}|null} null when unhandled.
 */
export function resolveMock(pathname, method = "GET") {
  const p = pathname.replace(/\/+$/, "") || "/";
  const m = method.toUpperCase();
  const ok = (body) => ({ status: 200, body: { __mock: true, ...body } });

  // ── jobs ────────────────────────────────────────────────────────────────
  if (p === "/api/job" && m === "GET")
    return ok({ success: true, count: MOCK_JOBS.length, jobs: MOCK_JOBS });

  const jobById = p.match(/^\/api\/job\/([^/]+)$/);
  if (jobById && m === "GET") {
    const found = MOCK_JOBS.find((j) => j._id === jobById[1]) || MOCK_JOBS[0];
    return ok({ success: true, job: found });
  }

  // ── AI matching ─────────────────────────────────────────────────────────
  if (p === "/api/job-match/search")
    return ok({ success: true, count: jobsWithMatch.length, jobs: jobsWithMatch });

  if (p === "/api/job-match/recommendations")
    return ok({
      success: true,
      count: 4,
      recommendations: jobsWithMatch.slice(0, 4).map((j, i) => ({
        id: `dev-rec-${i}`,
        jobId: j._id,
        job: j,
        matchScore: j.matchScore,
        // Mirrored at the recommendation level too — the dashboard accepts
        // either nesting, and the real API has used both.
        skillGaps: j.skillGaps,
        reason: "Offline fixture — matches your stated frontend focus.",
        recommendedAt: daysAgo(i),
      })),
    });

  const matchFor = p.match(/^\/api\/job-match\/([^/]+)\/match$/);
  if (matchFor) {
    const found = jobsWithMatch.find((j) => j._id === matchFor[1]) || jobsWithMatch[0];
    return ok({
      success: true,
      match: {
        score: found.matchScore,
        details: found.matchDetails,
        skillGaps: {
          matchingSkills: [
            { name: "React" }, { name: "JavaScript" }, { name: "Node.js" },
          ],
          missingSkills: [
            { name: "Docker", difficulty: "medium" },
            { name: "PostgreSQL", difficulty: "medium" },
            { name: "AWS", difficulty: "hard" },
          ],
        },
        learningPath: [],
      },
    });
  }

  // ── profile & resume ────────────────────────────────────────────────────
  if (p === "/api/user/profile")
    return ok({
      success: true,
      user: { ...PERSONAS.candidate, parsedResume: MOCK_PARSED_RESUME },
    });

  if (p === "/api/resume/parsed")
    return ok({ success: true, parsedResume: MOCK_PARSED_RESUME });

  // /api/resume/preview intentionally has NO fixture — it returns rendered
  // HTML, not JSON. See NEVER_MOCK in installDevMode.js.

  if (p === "/api/resume/versions")
    return ok({
      success: true,
      versions: [
        { _id: "dev-ver-1", createdAt: daysAgo(1), note: "Offline fixture" },
      ],
    });

  // ── applications ────────────────────────────────────────────────────────
  if (p === "/api/application/user")
    return ok({ success: true, applications: MOCK_APPLICATIONS });

  if (p === "/api/recruiter/applications")
    return ok({ success: true, applications: MOCK_APPLICATIONS });

  // ── messaging ───────────────────────────────────────────────────────────
  if (p === "/api/messages/unread-count")
    return ok({ success: true, data: { unreadCount: 2 } });

  if (p === "/api/messages/list")
    return ok({
      success: true,
      data: {
        conversations: MOCK_CONVERSATIONS,
        pagination: { currentPage: 1, totalPages: 1, totalChats: 1 },
      },
    });

  if (/^\/api\/messages\/chat\//.test(p))
    return ok({
      success: true,
      data: { messages: MOCK_MESSAGES, chatId: "dev-chat-0001" },
    });

  if (p === "/api/messages/send" && m === "POST")
    return ok({ success: true, data: { message: null } });

  // ── recruiter & admin dashboards ────────────────────────────────────────
  if (p === "/api/recruiter/jobs")
    return ok({ success: true, jobs: MOCK_JOBS.slice(0, 3) });

  if (p === "/api/recruiter/dashboard/stats")
    return ok({
      success: true,
      stats: {
        totalJobs: 3, activeJobs: 3, totalApplications: 3,
        pendingApplications: 1, shortlisted: 1, accepted: 0, rejected: 0,
        candidatesViewed: 4, conversionRate: 33,
      },
    });

  if (p === "/api/recruiter/dashboard/recent-applications")
    return ok({ success: true, applications: MOCK_APPLICATIONS });

  if (p === "/api/admin/stats")
    return ok({
      success: true,
      stats: {
        totalUsers: 4, totalCandidates: 2, totalRecruiters: 1,
        totalJobs: MOCK_JOBS.length, totalApplications: MOCK_APPLICATIONS.length,
        totalMessages: MOCK_MESSAGES.length,
      },
    });

  if (p === "/api/admin/users")
    return ok({
      success: true,
      users: Object.values(PERSONAS).map(({ token, ...u }) => u),
      pagination: { currentPage: 1, totalPages: 1, totalUsers: 3 },
    });

  if (p === "/api/admin/jobs")
    return ok({
      success: true, jobs: MOCK_JOBS,
      pagination: { currentPage: 1, totalPages: 1, totalJobs: MOCK_JOBS.length },
    });

  if (p === "/api/admin/applications")
    return ok({ success: true, applications: MOCK_APPLICATIONS });

  if (p === "/api/admin/analytics")
    return ok({ success: true, analytics: { userGrowth: [], jobTrends: [], applicationTrends: [] } });

  // ── integrations ────────────────────────────────────────────────────────
  if (/^\/api\/integrations\//.test(p))
    return ok({
      success: true,
      integrations: {
        github: {
          connected: true,
          username: "riyap",
          profileUrl: "https://github.com/riyap",
        },
        linkedin: {
          connected: true,
          profileUrl: "https://linkedin.com/in/riyap",
          headline: "Frontend Developer",
        },
        // Left disconnected on purpose so the "Not added yet / Add" state is
        // exercised in development.
        leetcode: { connected: false },
      },
    });

  // ── exams ───────────────────────────────────────────────────────────────
  // The backend has no exam portal yet. These fixtures let the dashboard
  // widget be exercised in development; in production the widget shows an
  // empty state until a real endpoint exists.
  if (p === "/api/exam/results" || p === "/api/exam/history")
    return ok({
      success: true,
      results: [
        {
          _id: "dev-exam-0001",
          title: "JavaScript fundamentals",
          category: "Programming",
          score: 82,
          total: 100,
          passed: true,
          takenAt: daysAgo(11),
        },
        {
          _id: "dev-exam-0002",
          title: "Data structures and algorithms",
          category: "Programming",
          score: 58,
          total: 100,
          passed: false,
          takenAt: daysAgo(20),
        },
        {
          _id: "dev-exam-0003",
          title: "React component patterns",
          category: "Frontend",
          score: 74,
          total: 100,
          passed: true,
          takenAt: daysAgo(31),
        },
      ],
    });

  // ── saved / companies / interview ───────────────────────────────────────
  // Keys must match the real controller exactly — it returns savedJobs /
  // savedInterviewQuestions / savedRoleQuestions. A fixture using different
  // key names left `savedData.savedJobs` undefined and crashed SavePage on
  // `.map()`.
  if (p === "/api/saved")
    return ok({
      success: true,
      savedJobs: [MOCK_JOBS[0], MOCK_JOBS[4]],
      savedInterviewQuestions: [],
      savedRoleQuestions: [],
    });
  if (p === "/api/company") return ok({ success: true, companies: [] });
  if (/^\/api\/interview/.test(p)) return ok({ success: true, data: [] });
  if (/^\/api\/ai-suggestion/.test(p)) return ok({ success: true, reports: [] });

  return null;
}
