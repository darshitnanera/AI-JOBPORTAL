import React, { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  LogIn,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Building2,
  Loader2,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../utils/api";
import { saveSession } from "../../utils/authStorage";

const STORAGE_KEY = "jobportal_user";

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

const secondaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 " +
  "bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

/* ------------------------------------------------------------- Component -- */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect role from URL query if present (e.g. /login?role=recruiter)
  const searchParams = new URLSearchParams(location.search);
  const initialRole =
    searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";

  const [role, setRole] = useState(initialRole); // "candidate" | "recruiter"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [view, setView] = useState("login"); // login, forgot, reset
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const isRecruiter = role === "recruiter";
  const roleLabel = isRecruiter ? "Recruiter" : "Candidate";

  /* --------------------------------------------------- unchanged handlers */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setToast({ message: "All fields are required", type: "error" });
      return;
    }
    try {
      setIsLoading(true);

      const res = await API.post("/api/auth/login", {
        email,
        password,
        role: role === "recruiter" ? "recruiter" : "candidate",
      });

      const resolvedType =
        res.data.user.userType ||
        res.data.user.role ||
        (role === "recruiter" ? "recruiter" : "candidate");

      const userData = {
        id: res.data.user.id || res.data.user._id,
        // Several pages read `_id`; keep both so guards never miss.
        _id: res.data.user._id || res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role:
          res.data.user.role || (role === "recruiter" ? "recruiter" : "user"),
        // `userType` was previously never stored, so every guard that tested
        // `user.userType !== "candidate"` saw undefined and bounced the user
        // straight back to /login.
        userType: resolvedType,
        profileCompleted: res.data.user.profileCompleted ?? true,
        token: res.data.token,
      };

      // saveSession also mirrors the JWT to the flat `token` key, which the
      // navbar poll and the dashboards read. Writing only the user blob here
      // was leaving those callers sending `Bearer null`.
      saveSession(userData);

      setToast({
        message:
          res.data.message ||
          `Login successful as ${userData.role === "recruiter" ? "Recruiter" : "Candidate"}`,
        type: "success",
      });

      setEmail("");
      setPassword("");

      setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Login Failed",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setToast({ message: "Email is required", type: "error" });
      return;
    }
    try {
      setIsLoading(true);
      const res = await API.post("/api/auth/forgot-password", {
        email: resetEmail,
      });
      if (res.data.success) {
        setToast({ message: "OTP sent to your email", type: "success" });
        setView("reset");
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to send OTP",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setToast({ message: "OTP and new password are required", type: "error" });
      return;
    }
    try {
      setIsLoading(true);
      const res = await API.post("/api/auth/reset-password", {
        email: resetEmail,
        otp,
        newPassword,
      });
      if (res.data.success) {
        setToast({ message: "Password reset successful!", type: "success" });
        setView("login");
        setResetEmail("");
        setOtp("");
        setNewPassword("");
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Reset Failed",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------------------- markup */
  const roleTab = (key, label, icon) => {
    const active = role === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setRole(key)}
        aria-pressed={active}
        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2
                    text-sm font-semibold transition-all
                    ${
                      active
                        ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-300"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type === "error" ? "error" : "success"}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <Link
            to="/"
            aria-label="Back to jobs"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600
                       transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <ArrowLeft size={16} />
            <span>Back to Jobs</span>
          </Link>

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* ------------------------------------------------- LOGIN */}
            {view === "login" && (
              <>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  Sign in as <span className="text-brand-600 dark:text-brand-400">{roleLabel}</span>
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {isRecruiter
                    ? "Access your candidate applications, job postings, and hiring tools."
                    : "Access your applications, saved jobs, and career profile."}
                </p>

                {/* Segmented control */}
                <div className="mt-6 inline-flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  {roleTab("candidate", "Candidate", <User size={16} />)}
                  {roleTab("recruiter", "Recruiter", <Building2 size={16} />)}
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="login-email" className={labelBase}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={18} className={leadingIcon} />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className={inputBase}
                        placeholder={
                          isRecruiter
                            ? "recruiter@company.com"
                            : "candidate@domain.com"
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" className={labelBase}>
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={18} className={leadingIcon} />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className={`${inputBase} pr-11`}
                        placeholder="Enter your password"
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
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot");
                        setResetEmail(email);
                      }}
                      className="text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" disabled={isLoading} className={primaryButton}>
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        Sign In as {roleLabel}
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ------------------------------------------------ FORGOT */}
            {view === "forgot" && (
              <>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  Forgot password
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Enter your email and we'll send you a 6-digit reset code.
                </p>

                <form onSubmit={handleForgotPassword} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="reset-email" className={labelBase}>
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={18} className={leadingIcon} />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className={inputBase}
                        placeholder="you@domain.com"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className={primaryButton}>
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending code…
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className={secondaryButton}
                  >
                    Back to Login
                  </button>
                </form>
              </>
            )}

            {/* ------------------------------------------------- RESET */}
            {view === "reset" && (
              <>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  Reset password
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {resetEmail}
                  </span>
                  . It expires in 10 minutes.
                </p>

                <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="reset-otp" className={labelBase}>
                      6-digit code
                    </label>
                    <input
                      id="reset-otp"
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center
                                 text-xl font-bold tracking-[0.5em] text-slate-900 shadow-sm transition
                                 placeholder:tracking-[0.5em] placeholder:text-slate-400
                                 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30
                                 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="000000"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-password" className={labelBase}>
                      New password
                    </label>
                    <div className="relative">
                      <Lock size={18} className={leadingIcon} />
                      <input
                        id="new-password"
                        type={showResetPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className={`${inputBase} pr-11`}
                        placeholder="Choose a new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        aria-label={showResetPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500
                                   transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className={primaryButton}>
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Resetting…
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className={secondaryButton}
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 border-t border-slate-200 pt-6 text-center dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{" "}
                <Link
                  to={`/signup?role=${role}`}
                  className="font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Create {roleLabel} profile
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
