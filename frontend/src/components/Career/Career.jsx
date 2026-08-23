import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import API from "../../utils/api";

const MARQUEE_CSS = `
  @keyframes careerScrollLeft {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes careerScrollRight {
    0%   { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  .career-marquee {
    display: flex;
    width: max-content;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    animation-duration: 28s;
  }
  .career-marquee--ltr { animation-name: careerScrollRight; }
  .career-marquee--rtl { animation-name: careerScrollLeft; }
  .career-marquee:hover { animation-play-state: paused; }
  @media (min-width: 1024px) { .career-marquee { animation-duration: 40s; } }
  @media (prefers-reduced-motion: reduce) {
    .career-marquee { animation: none; }
  }
`;

const isExternal = (url) => /^https?:\/\//i.test(url);

const initialsOf = (name) =>
  (name || "Co")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/* One logo tile. Falls back to an initials avatar when the image is
   missing or fails to load — never a broken-image icon. */
const CompanyTile = ({ company }) => {
  const [broken, setBroken] = useState(false);
  const href = company?.website || null;
  const showImage = Boolean(company?.logo) && !broken;

  const inner = (
    <div className="flex h-24 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {showImage ? (
        <img
          src={company.logo}
          alt={`${company.name || "Company"} logo`}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
          {initialsOf(company?.name)}
        </span>
      )}
    </div>
  );

  return (
    <div className="w-40 shrink-0 px-3 sm:w-52 sm:px-4">
      {href ? (
        <a
          href={href}
          target={isExternal(href) ? "_blank" : undefined}
          rel={isExternal(href) ? "noopener noreferrer" : undefined}
          aria-label={`Open ${company?.name || "company"} website`}
          className="block rounded-2xl"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
};

const Career = () => {
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | ready

  const fetchCompanies = React.useCallback(async () => {
    setStatus("loading");
    try {
      const res = await API.get("/api/company");
      const next = Array.isArray(res.data?.companies) ? res.data.companies : [];
      setCompanies(next);
      setStatus("ready");
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanies([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Duplicated once so the marquee loops seamlessly at -50%.
  const track = [...companies, ...companies];
  const reversedTrack = [...track].reverse();

  return (
    <section className="bg-slate-50 py-16 sm:py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            Join Our <span className="text-brand-600 dark:text-brand-400">Featured</span>{" "}
            Companies
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Discover exciting career opportunities with industry leaders who are
            actively hiring. Your next big role awaits.
          </p>
        </div>
      </div>

      <div className="mt-12">
        {status === "loading" && (
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto max-w-md px-4 text-center sm:px-6 lg:px-8">
            <Building2
              size={20}
              aria-hidden="true"
              className="mx-auto text-slate-400"
            />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
              Couldn&apos;t load companies
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Something went wrong while fetching featured companies.
            </p>
            <button
              type="button"
              onClick={fetchCompanies}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && companies.length === 0 && (
          <div className="mx-auto max-w-md px-4 text-center sm:px-6 lg:px-8">
            <Building2
              size={20}
              aria-hidden="true"
              className="mx-auto text-slate-400"
            />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
              No featured companies yet
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Check back soon — new employers join every week.
            </p>
          </div>
        )}

        {status === "ready" && companies.length > 0 && (
          <div className="space-y-6">
            <div className="w-full overflow-hidden">
              <div className="career-marquee career-marquee--rtl items-center py-2">
                {track.map((company, index) => (
                  <CompanyTile key={`row1-${index}`} company={company} />
                ))}
              </div>
            </div>
            <div className="w-full overflow-hidden">
              <div className="career-marquee career-marquee--ltr items-center py-2">
                {reversedTrack.map((company, index) => (
                  <CompanyTile key={`row2-${index}`} company={company} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{MARQUEE_CSS}</style>
    </section>
  );
};

export default Career;
