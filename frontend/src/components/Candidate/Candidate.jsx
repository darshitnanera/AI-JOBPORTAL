import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Globe,
  Briefcase,
  Users,
  ArrowRight,
  Zap,
  Clock,
  Lightbulb,
  Award,
  Target,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * "Our candidates" — the candidate-category section on the home page.  *
 *                                                                     *
 * Rebuilt against DESIGN_SYSTEM.md. Two things changed beyond styling: *
 *  1. The component no longer injects a raw <style> block. That block  *
 *     contained UNLAYERED rules (notably a global `.group:hover`) that *
 *     outranked Tailwind utilities everywhere the home page rendered.  *
 *  2. The hard-coded statistics ("90% tech-proficient", "4.0+ avg      *
 *     GPA") were removed — they were invented numbers, not API data.   *
 * ------------------------------------------------------------------ */

const CATEGORIES = [
  {
    id: "graduates",
    title: "Recent graduates",
    icon: GraduationCap,
    description:
      "Fresh talent ready to innovate, with current tooling and a lot of energy.",
    strengths: [
      { label: "Modern tech skills", icon: Zap },
      { label: "Quick to adapt", icon: Clock },
      { label: "Fresh perspectives", icon: Lightbulb },
    ],
  },
  {
    id: "newcomers",
    title: "Skilled newcomers",
    icon: Globe,
    description:
      "Global experience meeting local opportunity, often across several languages.",
    strengths: [
      { label: "Multilingual", icon: Globe },
      { label: "Global perspective", icon: Target },
      { label: "Resilient", icon: Award },
    ],
  },
  {
    id: "coop",
    title: "Co-op students",
    icon: Briefcase,
    description:
      "Eager learners bridging classroom theory with day-to-day practice.",
    strengths: [
      { label: "Academic grounding", icon: GraduationCap },
      { label: "Team collaboration", icon: Users },
      { label: "Tech enthusiasts", icon: Zap },
    ],
  },
  {
    id: "professionals",
    title: "Experienced professionals",
    icon: Users,
    description:
      "Seasoned specialists who bring delivery experience and mentorship.",
    strengths: [
      { label: "Leadership", icon: Users },
      { label: "Strategic insight", icon: Lightbulb },
      { label: "Mentorship", icon: Award },
    ],
  },
];

const CandidateCard = ({ category }) => {
  const Icon = category.icon;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-600 to-accent-500 text-white shadow-sm">
        <Icon size={20} />
      </span>

      <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {category.title}
      </h3>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
        {category.description}
      </p>

      <ul className="mt-5 space-y-2.5 border-t border-slate-200 pt-5 dark:border-slate-800">
        {category.strengths.map((strength) => {
          const StrengthIcon = strength.icon;
          return (
            <li
              key={strength.label}
              className="flex min-w-0 items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <StrengthIcon size={14} />
              </span>
              <span className="min-w-0 truncate">{strength.label}</span>
              <Check
                size={14}
                className="ml-auto shrink-0 text-success-600 dark:text-success-500"
              />
            </li>
          );
        })}
      </ul>
    </article>
  );
};

const Candidate = () => (
  <section className="bg-slate-50 py-16 dark:bg-slate-950">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          Our <span className="text-gradient-brand">candidates</span>
        </h2>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
          Talent across four groups — each with a different strength to bring to
          your team.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <CandidateCard key={category.id} category={category} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
        >
          Browse open roles
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  </section>
);

export default Candidate;
