import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Globe,
  Briefcase,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import API from "../../utils/api";

const STORAGE_KEY = "jobportal_user";

/* ---------------------------------------------------------------- Toast -- */
const Toast = ({ message, type = "success", onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-4 z-50 flex min-w-[16rem] max-w-[calc(100vw-2rem)] items-start gap-3
                  rounded-xl border bg-white p-4 shadow-xl transition-all duration-300
                  dark:bg-slate-900
                  ${isSuccess
                    ? "border-success-500/40 dark:border-success-500/30"
                    : "border-danger-500/40 dark:border-danger-500/30"}
                  ${isExiting ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100"}`}
    >
      {isSuccess ? (
        <CheckCircle size={18} className="mt-0.5 shrink-0 text-success-600" />
      ) : (
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
      )}
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="shrink-0 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
      >
        <X size={16} />
      </button>
    </div>
  );
};

/* --------------------------------------------------------- Shared styles -- */
const fieldBase =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 " +
  "text-slate-900 shadow-sm transition placeholder:text-slate-400 " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const labelBase =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

const leadingIcon =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

/* ------------------------------------------------------------- Component -- */
const ProfileCompletion = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = company info, 2 = review
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    industryType: "",
    companySize: "",
  });

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Retail",
    "Manufacturing",
    "Education",
    "Real Estate",
    "Consulting",
    "Media & Entertainment",
    "Energy",
    "Utilities",
    "Transportation",
    "Other",
  ];

  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSkip = () => {
    navigate("/");
  };

  /* --------------------------------------------------- unchanged handlers */
  const handleContinue = async (e) => {
    e.preventDefault();

    if (step === 1) {
      if (
        !formData.companyName ||
        !formData.industryType ||
        !formData.companySize
      ) {
        setToast({
          message: "Please fill in all required fields",
          type: "error",
        });
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 - Submit profile
    if (step === 2) {
      try {
        setIsLoading(true);

        const stored = localStorage.getItem(STORAGE_KEY);
        const userData = JSON.parse(stored);

        const res = await API.post("/api/auth/profile-completion", {
          userId: userData.id,
          recruiterProfile: formData,
        });

        if (res.data.success) {
          // Update local storage
          const updated = {
            ...userData,
            profileCompleted: true,
            recruiterProfile: res.data.user.recruiterProfile,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

          setToast({
            message: "Profile completed successfully!",
            type: "success",
          });

          setTimeout(() => {
            navigate("/");
          }, 1500);
        }
      } catch (err) {
        setToast({
          message: err.response?.data?.message || "Failed to complete profile",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const ReviewRow = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-3 last:border-0 dark:border-slate-800">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="min-w-0 wrap-break-word text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );

  /* -------------------------------------------------------------- markup */
  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <Building2 size={24} />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Complete your profile
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {step === 1
                ? "Help us learn more about your company."
                : "Review your details before we save them."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2" aria-hidden>
              {[1, 2].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    n <= step ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>

            {step === 1 ? (
              <form onSubmit={handleContinue} className="space-y-5">
                <div>
                  <label htmlFor="companyName" className={labelBase}>
                    Company name <span className="text-danger-600">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={18} className={leadingIcon} />
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Your company name"
                      className={fieldBase}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyWebsite" className={labelBase}>
                    Company website
                  </label>
                  <div className="relative">
                    <Globe size={18} className={leadingIcon} />
                    <input
                      type="url"
                      id="companyWebsite"
                      name="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className={fieldBase}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="industryType" className={labelBase}>
                    Industry type <span className="text-danger-600">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase size={18} className={leadingIcon} />
                    <select
                      id="industryType"
                      name="industryType"
                      value={formData.industryType}
                      onChange={handleChange}
                      className={`${fieldBase} appearance-none pr-11`}
                      required
                    >
                      <option value="">Select industry</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companySize" className={labelBase}>
                    Company size <span className="text-danger-600">*</span>
                  </label>
                  <div className="relative">
                    <Users size={18} className={leadingIcon} />
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className={`${fieldBase} appearance-none pr-11`}
                      required
                    >
                      <option value="">Select company size</option>
                      {companySizes.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <ReviewRow label="Company name" value={formData.companyName} />
                  {formData.companyWebsite && (
                    <ReviewRow label="Website" value={formData.companyWebsite} />
                  )}
                  <ReviewRow label="Industry" value={formData.industryType} />
                  <ReviewRow
                    label="Company size"
                    value={
                      companySizes.find((s) => s.value === formData.companySize)
                        ?.label || formData.companySize
                    }
                  />
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  These details help us match you with suitable candidates and
                  show your company information accurately across the platform.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={step === 1 ? handleSkip : () => setStep(1)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border
                           border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700
                           transition-all hover:bg-slate-50
                           dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {step === 1 ? (
                  "Skip for now"
                ) : (
                  <>
                    <ArrowLeft size={16} />
                    Back to edit
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleContinue}
                disabled={isLoading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600
                           px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all
                           hover:bg-brand-700 hover:shadow-md active:scale-[0.98]
                           disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {step === 1 ? "Continue" : "Complete profile"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {step === 1 && (
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              You can always update these details later from your account
              settings.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileCompletion;
