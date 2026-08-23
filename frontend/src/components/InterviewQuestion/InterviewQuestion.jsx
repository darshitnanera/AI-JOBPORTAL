import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  ChevronRight,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { apiUrl } from "../../utils/api";

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

/* ------------------------------------------------------------- fragments */

const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  </div>
);

const EntityCard = ({ to, state, logo, name, subtitle, fallbackIcon }) => {
  const Icon = fallbackIcon;
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={to} state={state} className={`${CARD} flex items-center gap-3`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
        {!imgError && logo ? (
          <img
            src={logo}
            alt=""
            onError={() => setImgError(true)}
            className="h-full w-full object-contain p-1"
          />
        ) : name ? (
          <span className="text-sm font-bold">{initialsOf(name)}</span>
        ) : (
          <Icon size={18} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-slate-900 dark:text-slate-50">
          {name}
        </span>
        <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
          {subtitle}
        </span>
      </span>

      <ArrowUpRight size={18} className="shrink-0 text-slate-400" />
    </Link>
  );
};

const Panel = ({
  title,
  viewAllLabel,
  viewAllTo,
  status,
  errorMessage,
  onRetry,
  items,
  emptyText,
  emptyIcon,
  children,
}) => {
  const EmptyIcon = emptyIcon;

  return (
  <section className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h2>
      <Link
        to={viewAllTo}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        {viewAllLabel}
        <ChevronRight size={16} />
      </Link>
    </div>

    <div className="mt-6">
      {status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
            <AlertCircle size={20} />
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            Couldn&apos;t load this list
          </h3>
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
            {errorMessage}
          </p>
          <button type="button" className={SECONDARY_BTN} onClick={onRetry}>
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      )}

      {status === "ready" && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <EmptyIcon size={20} />
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            Nothing here yet
          </h3>
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">{emptyText}</p>
          <Link to={viewAllTo} className={SECONDARY_BTN}>
            {viewAllLabel}
          </Link>
        </div>
      )}

      {status === "ready" && items.length > 0 && children}
    </div>
  </section>
  );
};

/* ------------------------------------------------------------------ page */

export default function InterviewQuestionsPage() {
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const [companiesRes, rolesRes] = await Promise.all([
        fetch(apiUrl("/api/interview/companies")),
        fetch(apiUrl("/api/interview/roles")),
      ]);

      const companiesData = companiesRes.ok ? await companiesRes.json() : {};
      const rolesData = rolesRes.ok ? await rolesRes.json() : {};

      setCompanies(
        companiesData.success && Array.isArray(companiesData.companies)
          ? companiesData.companies.slice(0, 8)
          : [],
      );
      setRoles(
        rolesData.success && Array.isArray(rolesData.roles)
          ? rolesData.roles.slice(0, 8)
          : [],
      );

      if (!companiesRes.ok && !rolesRes.ok) {
        setErrorMessage("The interview library didn't respond. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("ready");
    } catch (error) {
      console.error("Error fetching interview library:", error);
      setCompanies([]);
      setRoles([]);
      setErrorMessage(
        "We couldn't reach the interview library. Check your connection and try again.",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-slate-50 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <Panel
            title="Interview questions by company"
            viewAllLabel="View all companies"
            viewAllTo="/companies"
            status={status}
            errorMessage={errorMessage}
            onRetry={fetchData}
            items={companies}
            emptyIcon={Building2}
            emptyText="No companies have been added to the interview library yet."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {companies.map((company) => (
                <EntityCard
                  key={company._id}
                  to={`/companies/${company._id}`}
                  state={{ companyId: company._id }}
                  logo={company.logo}
                  name={company.companyName}
                  subtitle={`${company.questionsCount || 0} interviews`}
                  fallbackIcon={Building2}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="Interview questions by role"
            viewAllLabel="View all roles"
            viewAllTo="/roles"
            status={status}
            errorMessage={errorMessage}
            onRetry={fetchData}
            items={roles}
            emptyIcon={UserRound}
            emptyText="No roles have been added to the interview library yet."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {roles.map((role) => {
                const slug = slugify(role.roleName || "");
                return (
                  <EntityCard
                    key={role._id}
                    to={`/roles/${slug}`}
                    state={{ selectedRoleSlug: slug }}
                    logo={role.image}
                    name={role.roleName}
                    subtitle={`${role.questionsCount || 0} questions`}
                    fallbackIcon={UserRound}
                  />
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
