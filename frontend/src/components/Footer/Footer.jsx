// Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Building,
  Briefcase,
  Users,
  Award,
  Shield,
  UserCog,
  Bookmark,
} from "lucide-react";
import Companylogo from "../../assets/hexagonlogo.png";
import logo from "../../assets/logo.png";

/* Only routes that actually exist in App.jsx are linked.
   (`/contact` was removed — the Contact page no longer exists.) */
const QUICK_LINKS = [
  { to: "/jobs", label: "Find Jobs", icon: ArrowRight },
  { to: "/companies", label: "Companies", icon: Building },
  { to: "/roles", label: "Roles", icon: UserCog },
  { to: "/saved", label: "Saved", icon: Bookmark },
];

const EMPLOYER_LINKS = [
  { to: "/recruiter/jobs/create", label: "Post a Job", icon: ArrowRight },
  { to: "/recruiter/dashboard", label: "Employer Dashboard", icon: Briefcase },
  { to: "/recruiter/jobs", label: "Manage Listings", icon: Award },
  { to: "/recruiter/applications", label: "Applications", icon: Users },
  { to: "/companies", label: "Employer Branding", icon: Shield },
];

const SOCIALS = [
  { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
];

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* ---------------- Company ---------------- */}
          <div>
            <div className="flex items-center gap-3">
              <Link to="/" aria-label="JobPortal home" className="shrink-0">
                <img
                  src={logo}
                  alt="JobPortal logo"
                  className="h-11 w-11 rounded-lg object-cover"
                />
              </Link>
              <div>
                <p className="text-lg font-bold text-white">JobPortal</p>
                <p className="text-sm text-slate-400">Find Your Dream Job</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Connecting talented professionals with top companies worldwide.
              Your career journey starts here.
            </p>

            <ul className="mt-6 flex flex-wrap gap-3">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition-all hover:border-brand-500 hover:bg-brand-600 hover:text-white"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------------- Quick links ---------------- */}
          <nav aria-label="Quick links">
            <h2 className="text-base font-semibold text-white">Quick Links</h2>
            <ul className="mt-4 space-y-3">
              {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                      className="text-brand-400"
                    />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ---------------- Employers ---------------- */}
          <nav aria-label="For employers">
            <h2 className="text-base font-semibold text-white">
              For Employers
            </h2>
            <ul className="mt-4 space-y-3">
              {EMPLOYER_LINKS.map(({ to, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                      className="text-brand-400"
                    />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ---------------- Contact info (static, not a route) ---------------- */}
          <div>
            <h2 className="text-base font-semibold text-white">Contact Us</h2>
            <ul className="mt-4 space-y-3">
              <ContactItem
                icon={Mail}
                text="support@jobportal.com"
                href="mailto:support@jobportal.com"
              />
              <ContactItem
                icon={Phone}
                text="+1 (555) 123-4567"
                href="tel:+15551234567"
              />
              <ContactItem
                icon={MapPin}
                text="123 Career Street, San Francisco, CA"
              />
            </ul>
          </div>
        </div>

        {/* ---------------- Bottom bar ---------------- */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} JobPortal. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <img
              src={Companylogo}
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain"
            />
            <span>Designed by</span>
            <a
              href="https://hexagondigitalservices.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-200 transition-colors hover:text-white"
            >
              Hexagon Digital Services
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const ContactItem = ({ icon: Icon, text, href }) => (
  <li className="flex items-start gap-3">
    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-brand-400">
      <Icon size={16} aria-hidden="true" />
    </span>
    {href ? (
      <a
        href={href}
        className="min-w-0 wrap-break-word text-sm text-slate-300 transition-colors hover:text-white"
      >
        {text}
      </a>
    ) : (
      <span className="min-w-0 wrap-break-word text-sm text-slate-400">{text}</span>
    )}
  </li>
);

export default Footer;
