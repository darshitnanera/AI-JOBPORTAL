// InterviewQuestionsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CircleArrowOutUpRight } from "lucide-react";
import { interviewQuestionsStyles as s } from "../../assets/dummyStyles";

/* ---------- small helper ---------- */
const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

export default function InterviewQuestionsPage() {
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [companiesRes, rolesRes] = await Promise.all([
          fetch("http://localhost:5000/api/interview/companies"),
          fetch("http://localhost:5000/api/interview/roles"),
        ]);

        const companiesData = await companiesRes.json();
        const rolesData = await rolesRes.json();

        if (companiesData.success) {
          setCompanies(companiesData.companies.slice(0, 8));
        }
        if (rolesData.success) {
          setRoles(rolesData.roles.slice(0, 8));
        }
      } catch (error) {
        console.error("Error fetching home page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={s.loadingContainer}>
        <div className={s.spinner}></div>
      </div>
    );
  }

  return (
    <div className={s.pageContainer}>
      <div className={s.innerContainer}>
        <div className={s.mainGrid}>
          {/* LEFT: Companies */}
          <div>
            <section className={s.section}>
              <div className={s.sectionHeader}>
                <h2 className={s.sectionTitle}>
                  Interview questions by Company
                </h2>
                <Link to="/companies" className={s.viewAllLink}>
                  View all companies
                  <ChevronRight className={s.chevronIcon} />
                </Link>
              </div>

              <div className={s.companiesGrid}>
                {companies.map((company) => (
                  <CompanyCard company={company} key={company._id} />
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: Roles */}
          <div>
            <section className={s.section}>
              <div className={s.sectionHeader}>
                <h2 className={s.sectionTitle}>Interview questions by Role</h2>
                <Link to="/roles" className={s.viewAllLink}>
                  View all roles
                  <ChevronRight className={s.chevronIcon} />
                </Link>
              </div>

              <div className={s.rolesGrid}>
                {roles.map((role) => (
                  <RoleCard role={role} key={role._id} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Company card ---------- */
function CompanyCard({ company }) {
  const [imgError, setImgError] = useState(false);
  const initials = company.companyName
    ? company.companyName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
    : "??";

  const colorClass = s.getColorClass("company", company.companyName);

  return (
    <Link
      to={`/companies/${company._id}`}
      state={{ companyId: company._id }}
      className={s.cardLink}
    >
      <div className={s.cardGlow}></div>

      <article className={s.cardArticle}>
        <div className={s.cardFlex}>
          <div className={s.cardLeftFlex}>
            <div
              className={s.logoContainer(colorClass)}
              style={{ width: 56, height: 56, overflow: "hidden" }}
            >
              {!imgError && company.logo ? (
                <img
                  src={company.logo}
                  alt={`${company.companyName} logo`}
                  onError={() => setImgError(true)}
                  className={s.logoImage}
                />
              ) : (
                <span className={s.logoFallbackText}>{initials}</span>
              )}
            </div>

            <div>
              <h3 className={s.cardTitle}>{company.companyName}</h3>
              <p className={s.cardSubtitle}>
                {company.questionsCount || "0"} Interviews
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <CircleArrowOutUpRight className={s.cardIcon} />
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ---------- Role card ---------- */
function RoleCard({ role }) {
  const [imgError, setImgError] = useState(false);
  const initials = role.roleName
    ? role.roleName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
    : "??";

  const colorClass = s.getColorClass("role", role.roleName);
  const slug = slugify(role.roleName);

  return (
    <Link
      to={`/roles/${slug}`}
      state={{ selectedRoleSlug: slug }}
      className={s.cardLink}
    >
      <div className={s.roleCardGlow}></div>

      <article className={s.cardArticle}>
        <div className={s.cardFlex}>
          <div className={s.cardLeftFlex}>
            <div
              className={s.logoContainer(colorClass)}
              style={{ width: 56, height: 56, overflow: "hidden" }}
            >
              {!imgError && role.image ? (
                <img
                  src={role.image}
                  alt={`${role.roleName} logo`}
                  onError={() => setImgError(true)}
                  className={s.logoImage}
                />
              ) : (
                <span className={s.logoFallbackText}>{initials}</span>
              )}
            </div>

            <div>
              <h3 className={s.cardTitle}>{role.roleName}</h3>
              <p className={s.cardSubtitle}>
                {role.questionsCount || "0"} Questions
              </p>
            </div>
          </div>

          <div>
            <CircleArrowOutUpRight className={s.cardIcon} />
          </div>
        </div>
      </article>
    </Link>
  );
}
