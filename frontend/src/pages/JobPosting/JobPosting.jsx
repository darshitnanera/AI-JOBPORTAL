import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import { AlertCircle, CheckCircle, Plus, X } from "lucide-react";

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const LABEL =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";
const FIELD =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const BADGE_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1";
const CHIP = `${BADGE_BASE} bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25`;

/** A labelled text input that adds values to a list, rendered as removable chips. */
const ChipField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  onAdd,
  items,
  onRemove,
  emptyHint,
}) => (
  <div>
    <label htmlFor={id} className={LABEL}>
      {label}
    </label>
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        id={id}
        type="text"
        className={FIELD}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
      />
      <button type="button" onClick={onAdd} className={`${SECONDARY_BTN} shrink-0`}>
        <Plus size={16} />
        Add
      </button>
    </div>
    {items.length > 0 ? (
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span className={CHIP}>
              {item}
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${item}`}
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-brand-100 dark:hover:bg-brand-500/20"
              >
                <X size={12} />
              </button>
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {emptyHint}
      </p>
    )}
  </div>
);

const JobPosting = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    roleName: "",
    techStack: [],
    location: "",
    experience: "",
    salary: "",
    salaryType: "/month",
    jobType: "Full-time",
    overview: "",
    responsibilities: [],
    jobCriteria: [],
    education: [],
    openings: 1,
    category: "Technology",
    companyLogo: null,
  });

  const [currentTech, setCurrentTech] = useState("");
  const [currentResponsibility, setCurrentResponsibility] = useState("");
  const [currentCriteria, setCurrentCriteria] = useState("");
  const [currentEducation, setCurrentEducation] = useState("");

  useEffect(() => {
    // AuthContext hydrates from localStorage in an effect, so `user` is
    // null on first render. Redirecting before hydration completes bounced
    // every signed-in recruiter back to /login.
    if (authLoading) return;

    const type = user?.userType || user?.role;
    if (!user || type !== "recruiter") {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = (key, value, reset) => {
    if (!value.trim()) return;
    setFormData((prev) => ({ ...prev, [key]: [...prev[key], value.trim()] }));
    reset("");
  };

  const removeItem = (key, index) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.roleName.trim()) return "Job title is required.";
    if (!formData.location.trim()) return "Location is required.";
    if (!formData.salary) return "Salary is required.";
    if (formData.techStack.length === 0) return "Add at least one skill.";
    if (formData.responsibilities.length === 0)
      return "Add at least one responsibility.";
    if (formData.jobCriteria.length === 0)
      return "Add at least one job criterion.";
    if (formData.education.length === 0)
      return "Add at least one education requirement.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const body = new FormData();
      body.append("roleName", formData.roleName);
      body.append("techStack", JSON.stringify(formData.techStack));
      body.append("location", formData.location);
      body.append("experience", formData.experience);
      body.append("salary", formData.salary);
      body.append("salaryType", formData.salaryType);
      body.append("jobType", formData.jobType);
      body.append("overview", formData.overview);
      body.append(
        "responsibilities",
        JSON.stringify(formData.responsibilities)
      );
      body.append("jobCriteria", JSON.stringify(formData.jobCriteria));
      body.append("education", JSON.stringify(formData.education));
      body.append("openings", formData.openings);
      body.append("category", formData.category);
      if (formData.companyLogo) {
        body.append("companyLogo", formData.companyLogo);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiter/jobs/create`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to post job");
      }

      setSuccess("Job posted successfully.");
      setTimeout(() => navigate("/recruiter/jobs"), 1500);
    } catch (err) {
      setError(err.message || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Post a new job
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Fill in the details below to publish a role to the job board.
          </p>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-danger-500/30 bg-danger-50 p-4 text-sm font-medium text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-500">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-success-500/30 bg-success-50 p-4 text-sm font-medium text-success-700 dark:border-success-500/25 dark:bg-success-500/10 dark:text-success-500">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic information */}
          <section className={CARD}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Basic information
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              How the role appears in search results.
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="roleName" className={LABEL}>
                  Job title *
                </label>
                <input
                  id="roleName"
                  type="text"
                  name="roleName"
                  className={FIELD}
                  value={formData.roleName}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="location" className={LABEL}>
                    Location *
                  </label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    className={FIELD}
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Bengaluru, India"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="jobType" className={LABEL}>
                    Job type *
                  </label>
                  <select
                    id="jobType"
                    name="jobType"
                    className={FIELD}
                    value={formData.jobType}
                    onChange={handleInputChange}
                    required
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Internship</option>
                    <option>Hackathon</option>
                    <option>Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="salary" className={LABEL}>
                    Salary *
                  </label>
                  <input
                    id="salary"
                    type="number"
                    name="salary"
                    className={FIELD}
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="salaryType" className={LABEL}>
                    Salary period
                  </label>
                  <select
                    id="salaryType"
                    name="salaryType"
                    className={FIELD}
                    value={formData.salaryType}
                    onChange={handleInputChange}
                  >
                    <option>/month</option>
                    <option>/year</option>
                    <option>/hour</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="experience" className={LABEL}>
                    Experience required
                  </label>
                  <input
                    id="experience"
                    type="text"
                    name="experience"
                    className={FIELD}
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 3+ years"
                  />
                </div>
                <div>
                  <label htmlFor="openings" className={LABEL}>
                    Openings
                  </label>
                  <input
                    id="openings"
                    type="number"
                    name="openings"
                    min="1"
                    className={FIELD}
                    value={formData.openings}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="overview" className={LABEL}>
                  Job overview *
                </label>
                <textarea
                  id="overview"
                  name="overview"
                  rows="5"
                  className={FIELD}
                  value={formData.overview}
                  onChange={handleInputChange}
                  placeholder="Describe the role, the team and what success looks like…"
                  required
                />
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className={CARD}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Requirements
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Press Enter or use Add — each value becomes a removable chip.
            </p>

            <div className="mt-6 space-y-6">
              <ChipField
                id="skills"
                label="Skills / technologies *"
                placeholder="e.g. React, Node.js"
                value={currentTech}
                onChange={setCurrentTech}
                onAdd={() => addItem("techStack", currentTech, setCurrentTech)}
                items={formData.techStack}
                onRemove={(i) => removeItem("techStack", i)}
                emptyHint="No skills added yet."
              />

              <ChipField
                id="responsibilities"
                label="Responsibilities *"
                placeholder="e.g. Lead development of new features"
                value={currentResponsibility}
                onChange={setCurrentResponsibility}
                onAdd={() =>
                  addItem(
                    "responsibilities",
                    currentResponsibility,
                    setCurrentResponsibility
                  )
                }
                items={formData.responsibilities}
                onRemove={(i) => removeItem("responsibilities", i)}
                emptyHint="No responsibilities added yet."
              />

              <ChipField
                id="criteria"
                label="Job criteria *"
                placeholder="e.g. Experience with distributed systems"
                value={currentCriteria}
                onChange={setCurrentCriteria}
                onAdd={() =>
                  addItem("jobCriteria", currentCriteria, setCurrentCriteria)
                }
                items={formData.jobCriteria}
                onRemove={(i) => removeItem("jobCriteria", i)}
                emptyHint="No criteria added yet."
              />

              <ChipField
                id="education"
                label="Education required *"
                placeholder="e.g. Bachelor's degree in Computer Science"
                value={currentEducation}
                onChange={setCurrentEducation}
                onAdd={() =>
                  addItem("education", currentEducation, setCurrentEducation)
                }
                items={formData.education}
                onRemove={(i) => removeItem("education", i)}
                emptyHint="No education requirements added yet."
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => navigate("/recruiter/jobs")}
            >
              Cancel
            </button>
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => setShowPreview(true)}
            >
              Preview
            </button>
            <button type="submit" className={PRIMARY_BTN} disabled={loading}>
              {loading ? "Posting…" : "Post job"}
            </button>
          </div>
        </form>
      </main>

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Job preview"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Job preview
              </h2>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setShowPreview(false)}
                className="rounded-xl border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {formData.roleName || "Untitled role"}
                </h3>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  {user?.recruiterProfile?.companyName || "Your company"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.location && (
                    <span
                      className={`${BADGE_BASE} bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700`}
                    >
                      {formData.location}
                    </span>
                  )}
                  {formData.jobType && (
                    <span className={CHIP}>{formData.jobType}</span>
                  )}
                  {formData.salary && (
                    <span
                      className={`${BADGE_BASE} bg-success-50 text-success-700 ring-success-500/30 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/25`}
                    >
                      {Number(formData.salary).toLocaleString()}
                      {formData.salaryType}
                    </span>
                  )}
                </div>
              </div>

              {formData.overview && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Overview
                  </h4>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    {formData.overview}
                  </p>
                </div>
              )}

              {formData.techStack.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Skills required
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.techStack.map((tech, i) => (
                      <span key={`${tech}-${i}`} className={CHIP}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.responsibilities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Responsibilities
                  </h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600 dark:text-slate-300">
                    {formData.responsibilities.map((r, i) => (
                      <li key={`${r}-${i}`}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.jobCriteria.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Job criteria
                  </h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600 dark:text-slate-300">
                    {formData.jobCriteria.map((c, i) => (
                      <li key={`${c}-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.education.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Education
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.education.map((e, i) => (
                      <span key={`${e}-${i}`} className={CHIP}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 p-6 dark:border-slate-800">
              <button
                type="button"
                className={SECONDARY_BTN}
                onClick={() => setShowPreview(false)}
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPosting;
