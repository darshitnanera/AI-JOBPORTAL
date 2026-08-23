import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Loader2,
} from "lucide-react";
import API from "../../utils/api";
import OTPInput from "../OTPInput/OTPInput";

/* ---------------------------------------------------------------- Toast -- */
const Toast = ({ message, type = "success", onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const timer = setTimeout(handleClose, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onClick={handleClose}
        aria-label="Close notification"
        className="shrink-0 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
      >
        <X size={16} />
      </button>
    </div>
  );
};

/* --------------------------------------------------------- Shared styles -- */
const inputBase =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 " +
  "text-slate-900 shadow-sm transition placeholder:text-slate-400 " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const labelBase =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

const leadingIcon =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 " +
  "text-sm font-semibold text-white shadow-sm transition-all " +
  "hover:bg-brand-700 hover:shadow-md active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand-600";

/* ------------------------------------------------------------- Component -- */
const SignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialRole =
    searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";

  const [role, setRole] = useState(initialRole); // "candidate" | "recruiter"

  // step: 1 = role selection, 2 = account details, 3 = OTP verification
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const isRecruiter = role === "recruiter";
  const roleLabel = isRecruiter ? "Recruiter" : "Candidate";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      let strength = 0;
      if (value.length >= 6) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(Math.min(strength, 4));
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setToast({ message: "All fields are required", type: "error" });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setToast({ message: "Please enter a valid email", type: "error" });
      return false;
    }
    if (formData.password.length < 6) {
      setToast({
        message: "Password must be at least 6 characters",
        type: "error",
      });
      return false;
    }
    return true;
  };

  /* --------------------------------------------------- unchanged handlers */
  // Register handler — identical request shape, still triggers the BREVO OTP mail
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsLoading(true);
      const res = await API.post("/api/auth/register", {
        ...formData,
        userType: role === "recruiter" ? "recruiter" : "candidate",
        role: role === "recruiter" ? "recruiter" : "user",
      });
      setToast({ message: res.data.message, type: "success" });
      setStep(3); // Switch to OTP UI
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Signup failed",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setToast({ message: "Please enter a valid 6-digit code", type: "error" });
      return;
    }
    try {
      setIsLoading(true);
      const res = await API.post("/api/auth/verify-email", {
        email: formData.email,
        otp,
      });
      setToast({ message: res.data.message, type: "success" });

      // Check if profile completion is needed for recruiters
      if (role === "recruiter" && !res.data.user?.profileCompleted) {
        setTimeout(() => {
          navigate("/profile-completion");
        }, 1500);
      } else {
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Verification failed",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const strengthClass = (level) => {
    if (passwordStrength < level)
      return "bg-slate-200 dark:bg-slate-700";
    if (passwordStrength <= 2) return "bg-danger-500";
    if (passwordStrength === 3) return "bg-warning-500";
    return "bg-success-500";
  };

  const strengthLabel =
    passwordStrength <= 2 ? "Weak" : passwordStrength === 3 ? "Good" : "Strong";

  /* ------------------------------------------------------- role selector */
  const RoleCard = ({ value, title, description, icon }) => {
    const active = role === value;
    return (
      <button
        type="button"
        onClick={() => setRole(value)}
        aria-pressed={active}
        className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all
                    ${
                      active
                        ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/30 dark:border-brand-500 dark:bg-brand-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg
                      ${
                        active
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
        >
          {icon}
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </span>
          <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
            {description}
          </span>
        </span>
        {active && (
          <CheckCircle size={18} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
        )}
      </button>
    );
  };

  const headings = {
    1: { title: "Create your account", accent: null },
    2: { title: "Join as ", accent: roleLabel },
    3: { title: "Verify your email", accent: null },
  };

  const subtitles = {
    1: "Choose how you'd like to use AI Job Portal.",
    2: isRecruiter
      ? "Create your recruiter account to find top talent."
      : "Create your candidate profile to find your dream job.",
    3: `We've sent a 6-digit code to ${formData.email}. It expires in 10 minutes.`,
  };

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
        <div className="w-full max-w-md">
          {step === 1 ? (
            <Link
              to="/login"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600
                         transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600
                         transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
            >
              <ArrowLeft size={16} />
              <span>{step === 2 ? "Back to role" : "Back to details"}</span>
            </button>
          )}

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2" aria-hidden>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    n <= step ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {headings[step].title}
              {headings[step].accent && (
                <span className="text-brand-600 dark:text-brand-400">
                  {headings[step].accent}
                </span>
              )}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {subtitles[step]}
            </p>

            {/* ------------------------------------- STEP 1 — role select */}
            {step === 1 && (
              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <RoleCard
                    value="candidate"
                    title="I'm a Candidate"
                    description="Find jobs, track applications and build a profile."
                    icon={<User size={20} />}
                  />
                  <RoleCard
                    value="recruiter"
                    title="I'm a Recruiter"
                    description="Post roles, review applicants and hire faster."
                    icon={<Building2 size={20} />}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={primaryButton}
                >
                  Continue as {roleLabel}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* ---------------------------------- STEP 2 — account fields */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="name" className={labelBase}>
                    Full name
                  </label>
                  <div className="relative">
                    <User size={18} className={leadingIcon} />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className={inputBase}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={labelBase}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className={leadingIcon} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className={inputBase}
                      placeholder={
                        isRecruiter ? "recruiter@company.com" : "you@example.com"
                      }
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className={labelBase}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className={leadingIcon} />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      className={`${inputBase} pr-11`}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500
                                 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <span
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${strengthClass(level)}`}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        Password strength: {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isLoading} className={primaryButton}>
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Sign Up as {roleLabel}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* --------------------------------------- STEP 3 — OTP code */}
            {step === 3 && (
              <form onSubmit={handleVerifyOTP} className="mt-6 space-y-6">
                <div>
                  <label className={`${labelBase} text-center`} htmlFor="otp">
                    Enter your 6-digit verification code
                  </label>
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    length={6}
                    disabled={isLoading}
                    className="mt-3"
                  />
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span>
                    For your security this code expires 10 minutes after it was sent.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className={primaryButton}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Didn't get the code?{" "}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="font-semibold text-brand-600 transition hover:text-brand-700 disabled:opacity-50 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Resend code
                  </button>
                </p>
              </form>
            )}

            {step !== 3 && (
              <div className="mt-6 border-t border-slate-200 pt-6 text-center dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{" "}
                  <Link
                    to={`/login?role=${role}`}
                    className="font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;
