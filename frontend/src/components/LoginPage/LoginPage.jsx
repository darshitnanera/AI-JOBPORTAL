// LoginPage.jsx
import React, { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  LogIn,
  ArrowLeft,
  X,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import { loginPageStyles as s } from "../../assets/dummyStyles";

const STORAGE_KEY = "jobportal_user";

// Animated Toast Component
const Toast = ({ message, type = "success", onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const borderClass =
    type === "success"
      ? "border-green-500"
      : type === "info"
        ? "border-blue-500"
        : "border-red-500";

  return (
    <div
      className={s.toastContainer(borderClass, isExiting)}
      style={s.toastAnimationStyle}
      role="status"
      aria-live="polite"
    >
      {type === "success" ? (
        <CheckCircle className={s.toastSuccessIcon} />
      ) : (
        <svg className={s.toastErrorIcon} viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M15 9L9 15M9 9l6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <p className={s.toastMessage}>{message}</p>
      <button
        onClick={handleClose}
        className={s.toastCloseButton}
        aria-label="Close notification"
      >
        <X className={s.toastCloseIcon} />
      </button>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
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

  // Inject global styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = s.globalStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setToast({ message: "All fields are required", type: "error" });
      return;
    }
    try {
      setIsLoading(true);

      const res = await API.post("/auth/login", { email, password });

      const userData = {
        name: res.data.user.name,
        email: res.data.user.email,
        token: res.data.token,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      setToast({
        message: "Login successful",
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
      const res = await API.post("/auth/forgot-password", {
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
      const res = await API.post("/auth/reset-password", {
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

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type === "error" ? "error" : "success"}
          onClose={() => setToast(null)}
        />
      )}

      <div className={s.pageContainer}>
        <Link to="/" className={s.backLink} aria-label="Back to jobs">
          <ArrowLeft className={s.backLinkIcon} />
          <span className={s.backLinkText}>Back to Jobs</span>
        </Link>

        <div className={s.cardWrapper}>
          <div className={s.animatedBorderContainer}>
            <div className={s.cardInner}>
              {view === "login" && (
                <>
                  <h2 className={s.headerTitle}>Sign in to Job Portal</h2>
                  <p className={s.headerSubtitle}>
                    Access your applications, saved jobs, and profile.
                  </p>

                  <form onSubmit={handleSubmit} className={s.form}>
                    <div>
                      <label className={s.label}>Email</label>
                      <div className={s.inputWrapper}>
                        <Mail className={s.inputIcon} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={s.inputField}
                          placeholder="you@domain.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={s.label}>Password</label>
                      <div className={s.inputWrapper}>
                        <Lock className={s.inputIcon} />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={s.passwordInput}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={s.passwordToggle}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={s.forgotPasswordContainer}>
                      <button
                        type="button"
                        onClick={() => {
                          setView("forgot");
                          setResetEmail(email);
                        }}
                        className={s.forgotPasswordButton}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={s.submitButton}
                    >
                      {isLoading ? (
                        "Signing in..."
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" /> Sign In
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {view === "forgot" && (
                <>
                  <h2 className={s.headerTitle}>Forgot Password</h2>
                  <p className={s.headerSubtitle}>
                    Enter your email to receive a reset code.
                  </p>

                  <form onSubmit={handleForgotPassword} className={s.form}>
                    <div>
                      <label className={s.label}>Email address</label>
                      <div className={s.inputWrapper}>
                        <Mail className={s.inputIcon} />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          className={s.inputField}
                          placeholder="you@domain.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={s.submitButtonForgot}
                    >
                      {isLoading ? "Sending OTP..." : "Send Reset Code"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className={s.secondaryButton}
                    >
                      Back to Login
                    </button>
                  </form>
                </>
              )}

              {view === "reset" && (
                <>
                  <h2 className={s.headerTitle}>Reset Password</h2>
                  <p className={s.headerSubtitle}>
                    Enter the code sent to {resetEmail}
                  </p>

                  <form onSubmit={handleResetPassword} className={s.form}>
                    <div>
                      <label className={s.label}>6-Digit Code</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className={s.otpInput}
                        maxLength={6}
                        placeholder="000000"
                      />
                    </div>

                    <div>
                      <label className={s.label}>New Password</label>
                      <div className={s.inputWrapper}>
                        <Lock className={s.inputIcon} />
                        <input
                          type={showResetPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className={s.passwordInput}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowResetPassword(!showResetPassword)
                          }
                          className={s.passwordToggle}
                        >
                          {showResetPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={s.submitButtonReset}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className={s.secondaryButton}
                    >
                      Cancel
                    </button>
                  </form>
                </>
              )}

              <div className={s.signupContainer}>
                <p className={s.signupText}>
                  Don't have an account?{" "}
                  <Link to="/signup" className={s.signupLink}>
                    Create profile
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div aria-hidden className={s.blobTop} style={s.blobTopStyle} />
        <div aria-hidden className={s.blobBottom} style={s.blobBottomStyle} />
      </div>
    </>
  );
};

export default LoginPage;
