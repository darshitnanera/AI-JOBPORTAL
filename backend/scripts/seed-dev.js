/**
 * Seeds the local development database with a realistic set of jobs plus a
 * candidate, a recruiter and an admin account, so the UI can be exercised
 * end to end.
 *
 * Usage:  node scripts/seed-dev.js
 *
 * Safe to re-run: it clears only the collections it owns and refuses to run
 * against a non-local database.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Job from "../models/job.model.js";
import User from "../models/user.model.js";

const URI = process.env.MONGO_URI || "mongodb://localhost:27017/qdc-job-portal";

if (!/localhost|127\.0\.0\.1/.test(URI)) {
  console.error("Refusing to seed a non-local database:", URI.replace(/:[^:@]*@/, ":***@"));
  process.exit(1);
}

const logo = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=128&bold=true`;

const JOBS = [
  {
    companyName: "TechVision Inc",
    roleName: "Senior Frontend Developer",
    techStack: ["React", "TypeScript", "Redux", "Tailwind CSS", "Jest"],
    location: "Bengaluru, India",
    experience: "3-5 years",
    salary: 120000,
    salaryType: "/year",
    jobType: "Full Time",
    category: "Engineering",
    openings: 3,
    overview:
      "Build and scale the customer-facing web platform used by half a million people each month. You will own major surfaces end to end and set frontend standards for the wider team.",
    responsibilities: [
      "Design and ship complex React features from spec to production",
      "Own component architecture and the shared design system",
      "Profile and improve Core Web Vitals across key journeys",
      "Review code and mentor mid-level engineers",
    ],
    jobCriteria: [
      "Strong command of modern React and the hooks model",
      "Comfortable with TypeScript in a large codebase",
      "Experience with automated testing and CI",
    ],
    education: ["B.Tech / B.E. in Computer Science or equivalent experience"],
  },
  {
    companyName: "WebFlow Systems",
    roleName: "Full Stack Engineer",
    techStack: ["React", "Node.js", "PostgreSQL", "Docker", "AWS"],
    location: "Remote (India)",
    experience: "2-4 years",
    salary: 95000,
    salaryType: "/year",
    jobType: "Full Time",
    category: "Engineering",
    openings: 2,
    overview:
      "Work across the stack on a product used by engineering teams to automate their release pipelines. Small team, high ownership, direct contact with users.",
    responsibilities: [
      "Build REST APIs in Node.js backed by PostgreSQL",
      "Implement React interfaces against those APIs",
      "Containerise services and maintain deployment pipelines",
      "Participate in on-call rotation",
    ],
    jobCriteria: [
      "Comfortable owning a feature across frontend and backend",
      "Working knowledge of relational data modelling",
      "Exposure to containers and cloud deployment",
    ],
    education: ["Bachelor's degree in a technical field or equivalent"],
  },
  {
    companyName: "DataSphere Analytics",
    roleName: "Data Scientist",
    techStack: ["Python", "Pandas", "scikit-learn", "SQL", "TensorFlow"],
    location: "Hyderabad, India",
    experience: "2-5 years",
    salary: 140000,
    salaryType: "/year",
    jobType: "Full Time",
    category: "Data Science",
    openings: 2,
    overview:
      "Turn large behavioural datasets into models that drive product decisions. You will work alongside engineers to take models from notebook to production.",
    responsibilities: [
      "Build and validate predictive models on production data",
      "Design experiments and interpret results for stakeholders",
      "Partner with engineering to deploy and monitor models",
    ],
    jobCriteria: [
      "Solid grounding in statistics and ML fundamentals",
      "Fluent in Python and SQL",
      "Able to communicate findings to non-technical audiences",
    ],
    education: ["Master's or Bachelor's in CS, Statistics, Mathematics or related"],
  },
  {
    companyName: "CloudNine Software",
    roleName: "Backend Engineer",
    techStack: ["Node.js", "MongoDB", "Redis", "Kubernetes", "GraphQL"],
    location: "Pune, India",
    experience: "3-6 years",
    salary: 110000,
    salaryType: "/year",
    jobType: "Full Time",
    category: "Engineering",
    openings: 4,
    overview:
      "Design the services behind a multi-tenant SaaS platform. Heavy focus on reliability, data correctness and sensible API design.",
    responsibilities: [
      "Design and implement backend services and GraphQL APIs",
      "Model data for scale and query efficiency",
      "Improve observability and reduce incident load",
    ],
    jobCriteria: [
      "Strong Node.js and asynchronous programming skills",
      "Experience operating services in production",
      "Familiarity with caching and queueing strategies",
    ],
    education: ["B.Tech / B.E. in Computer Science or equivalent"],
  },
  {
    companyName: "PixelCraft Studio",
    roleName: "UI/UX Designer",
    techStack: ["Figma", "Prototyping", "Design Systems", "User Research"],
    location: "Mumbai, India",
    experience: "2-4 years",
    salary: 85000,
    salaryType: "/year",
    jobType: "Full Time",
    category: "Design",
    openings: 1,
    overview:
      "Own the end-to-end design of product surfaces, from research through to a maintained design system that engineering builds against.",
    responsibilities: [
      "Run discovery research and translate findings into flows",
      "Produce high-fidelity designs and interactive prototypes",
      "Maintain and extend the shared design system",
    ],
    jobCriteria: [
      "Portfolio demonstrating shipped product work",
      "Comfortable defending decisions with research",
      "Experience collaborating closely with engineers",
    ],
    education: ["Degree in Design, HCI or equivalent portfolio experience"],
  },
  {
    companyName: "TechVision Inc",
    roleName: "DevOps Engineer",
    techStack: ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD"],
    location: "Bengaluru, India",
    experience: "3-5 years",
    salary: 130000,
    salaryType: "/year",
    jobType: "Full Time",
    category: "IT",
    openings: 2,
    overview:
      "Own the infrastructure and delivery pipelines that the engineering organisation depends on day to day.",
    responsibilities: [
      "Manage Kubernetes clusters and infrastructure as code",
      "Build and maintain CI/CD pipelines",
      "Drive reliability, monitoring and incident response",
    ],
    jobCriteria: [
      "Hands-on Kubernetes and Terraform experience",
      "Strong Linux and networking fundamentals",
      "Automation-first mindset",
    ],
    education: ["Bachelor's degree in a technical field or equivalent"],
  },
  {
    companyName: "InnovateLabs",
    roleName: "Frontend Developer Intern",
    techStack: ["React", "JavaScript", "CSS", "Git"],
    location: "Remote (India)",
    experience: "0-1 years",
    salary: 25000,
    salaryType: "/month",
    jobType: "Internship",
    category: "Engineering",
    openings: 5,
    overview:
      "A six-month internship for students and recent graduates. You will ship real features with a mentor assigned from day one.",
    responsibilities: [
      "Implement UI components against agreed designs",
      "Fix bugs and write tests for your work",
      "Take part in code review and team ceremonies",
    ],
    jobCriteria: [
      "Working knowledge of JavaScript and React basics",
      "A project or two you can talk through",
      "Available for a six-month full-time internship",
    ],
    education: ["Currently pursuing or recently completed a Bachelor's degree"],
  },
  {
    companyName: "FinEdge Technologies",
    roleName: "Product Manager",
    techStack: ["Roadmapping", "Analytics", "SQL", "A/B Testing"],
    location: "Gurugram, India",
    experience: "4-7 years",
    salary: 150000,
    salaryType: "/year",
    jobType: "Full Time",
    category: "Product",
    openings: 1,
    overview:
      "Own a payments product line end to end: strategy, roadmap, and the day-to-day trade-offs with engineering and design.",
    responsibilities: [
      "Define the roadmap and articulate the reasoning behind it",
      "Translate customer problems into clear specifications",
      "Measure impact and iterate on shipped work",
    ],
    jobCriteria: [
      "Track record shipping software products",
      "Comfortable working with data to justify decisions",
      "Excellent written communication",
    ],
    education: ["Bachelor's degree; MBA optional"],
  },
];

const USERS = [
  {
    name: "Aarav Sharma",
    email: "candidate@demo.com",
    password: "Demo@1234",
    userType: "candidate",
    role: "candidate",
  },
  {
    name: "Priya Nair",
    email: "recruiter@demo.com",
    password: "Demo@1234",
    userType: "recruiter",
    role: "recruiter",
    recruiterProfile: {
      companyName: "TechVision Inc",
      companyWebsite: "https://techvision.example.com",
      industryType: "Information Technology",
      companySize: "201-500",
      isVerified: true,
    },
  },
  {
    name: "Platform Admin",
    email: "admin@demo.com",
    password: "Demo@1234",
    userType: "admin",
    role: "admin",
  },

  // The frontend dev bypass (?dev=<role> and the documented test
  // credentials) uses these addresses. Seeding them as real accounts means
  // the bypass can obtain a genuine JWT whenever the backend is reachable,
  // so writes — saving a profile, generating the resume PDF, marking a
  // message read — actually work instead of 401ing against a fake token.
  {
    name: "Dev Candidate",
    email: "candidate@test.com",
    password: "password123",
    userType: "candidate",
    role: "candidate",
    // A parsed resume so the Review & edit forms, the ATS score and the
    // skill-gap analysis all have real content to work against. Without it
    // every one of those surfaces correctly shows an empty state, which
    // looks like the feature is missing.
    parsedResume: {
      contact: {
        email: "candidate@test.com",
        phone: "+91 90000 00001",
        location: "Bengaluru, India",
        linkedin: "https://linkedin.com/in/riyap",
      },
      summary:
        "Frontend engineer with four years building React interfaces and design systems for high-traffic products.",
      skills: [
        "React", "JavaScript", "TypeScript", "Node.js", "REST API",
        "Redux", "Tailwind CSS", "Jest", "Git", "HTML", "CSS",
      ],
      experience: [
        {
          company: "Acme Web",
          role: "Frontend Developer",
          duration: "2021 - 2024",
          description:
            "Built and maintained the component library powering the main product surface, and led the migration to TypeScript.",
        },
        {
          company: "Bright Interactive",
          role: "Junior Developer",
          duration: "2020 - 2021",
          description:
            "Implemented marketing pages and internal dashboards against a REST API.",
        },
      ],
      education: [
        {
          school: "National Institute of Technology, Surat",
          degree: "B.Tech",
          field: "Computer Science and Engineering",
          year: "2020",
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
      rawText:
        "Frontend engineer with four years building React interfaces and design systems.",
    },
  },
  {
    name: "Dev Recruiter",
    email: "recruiter@test.com",
    password: "password123",
    userType: "recruiter",
    role: "recruiter",
    recruiterProfile: {
      companyName: "TechVision Inc",
      companyWebsite: "https://techvision.example.com",
      industryType: "Information Technology",
      companySize: "201-500",
      isVerified: true,
    },
  },
  {
    name: "Dev Admin",
    email: "admin@test.com",
    password: "password123",
    userType: "admin",
    role: "admin",
  },
];

async function main() {
  await mongoose.connect(URI);
  console.log("connected:", URI);

  // ---- users -------------------------------------------------------------
  const emails = USERS.map((u) => u.email);
  await User.deleteMany({ email: { $in: emails } });

  const created = [];
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const doc = await User.create({
      ...u,
      password: hash,
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: true,
    });
    created.push(doc);
    console.log(`  user: ${u.email.padEnd(22)} (${u.userType})  password: ${u.password}`);
  }

  const recruiter = created.find((u) => u.userType === "recruiter");
  const admin = created.find((u) => u.userType === "admin");
  const owner = recruiter?._id || admin?._id;

  // ---- jobs --------------------------------------------------------------
  await Job.deleteMany({});
  const now = new Date();
  const docs = JOBS.map((j, i) => ({
    ...j,
    companyLogo: logo(j.companyName),
    postDate: new Date(now.getTime() - i * 86400000),
    createdBy: owner,
    postedBy: owner,
    status: "active",
    applicationCount: 0,
  }));
  const inserted = await Job.insertMany(docs);
  console.log(`  jobs: ${inserted.length} inserted`);

  // ---- integrations ------------------------------------------------------
  // Only the links the candidate supplies are seeded. No follower counts, no
  // problem-solved totals, no commit numbers: those must come from the real
  // GitHub / LeetCode APIs, and inventing them here would put fabricated
  // statistics in front of recruiters.
  const devCandidate = created.find((u) => u.email === "candidate@test.com");
  if (devCandidate) {
    const { default: UserIntegrations } = await import(
      "../models/UserIntegrations.model.js"
    );
    await UserIntegrations.findOneAndUpdate(
      { userId: devCandidate._id },
      {
        userId: devCandidate._id,
        github: {
          connected: true,
          username: "riyap",
          profileUrl: "https://github.com/riyap",
        },
        linkedin: {
          connected: true,
          profileUrl: "https://linkedin.com/in/riyap",
        },
        leetcode: { connected: false },
      },
      { upsert: true, new: true }
    );
    console.log("  integrations: github + linkedin linked (no synthetic stats)");
  }

  await mongoose.disconnect();
  console.log("\nSeed complete.");
}

main().catch(async (e) => {
  console.error("Seed failed:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
