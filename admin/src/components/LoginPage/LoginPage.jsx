// src/pages/Login/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  CheckCircle,
  X,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "axios";
import { loginPageStyles as s } from "../../assets/dummyStyles";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ visible: false, message: "", type: "success" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setToast({
        visible: true,
        message: "Please fill in all fields",
        type: "error",
      });
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (res.data.user.role !== "admin") {
        setToast({
          visible: true,
          message: "Access Denied. Admins only.",
          type: "error",
        });
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setToast({
        visible: true,
        message: "Login successful!",
        type: "success",
      });
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      setToast({
        visible: true,
        message: "Invalid email or password",
        type: "error",
      });
    }
  };

  const closeToast = () =>
    setToast({ visible: false, message: "", type: "success" });

  const toastIcon =
    toast.type === "success" ? (
      <CheckCircle className={s.toastIconSuccess} size={20} />
    ) : (
      <AlertCircle className={s.toastIconError} size={20} />
    );

  const toastBorderColor =
    toast.type === "success" ? s.toastBorderSuccess : s.toastBorderError;

  return (
    <div className={s.pageContainer}>
      {toast.visible && (
        <div className={`${s.toastContainer} ${toastBorderColor}`} role="alert">
          {toastIcon}
          <p className={s.toastMessage}>{toast.message}</p>
          <button
            onClick={closeToast}
            className={s.toastCloseBtn}
            aria-label="Close toast"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className={s.card}>
        <div className={s.header}>
          <h1 className={s.title}>Admin Panel</h1>
          <p className={s.subtitle}>Job Portal Administration</p>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          {/* Email Field */}
          <div className={s.formGroup}>
            <label htmlFor="email" className={s.label}>
              Email Address
            </label>
            <div className={s.inputWrapper}>
              <div className={s.iconWrapper}>
                <Mail className={s.iconDefault} size={18} />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${s.inputBase} ${s.inputPr3}`}
                placeholder="admin@jobportal.com"
                required
              />
            </div>
          </div>

          {/* Password Field with eye toggle */}
          <div className={s.formGroup}>
            <label htmlFor="password" className={s.label}>
              Password
            </label>
            <div className={s.inputWrapper}>
              <div className={s.iconWrapper}>
                <Lock className={s.iconDefault} size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${s.inputBase} ${s.inputPr12}`}
                placeholder="••••••••"
                required
              />
              <div className={s.eyeButtonWrapper}>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className={s.eyeButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className={s.submitBtn}>
            <LogIn size={18} className={s.submitIcon} />
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
