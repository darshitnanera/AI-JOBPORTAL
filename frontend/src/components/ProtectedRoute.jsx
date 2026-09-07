import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "jobportal_user";

const getSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
};

export default function ProtectedRoute({
  children,
  requiredRole = null,
  requiredUserType = null,
  requireProfileCompletion = false,
}) {
  const location = useLocation();
  const session = getSession();

  // Check authentication
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // The app has historically stored the account type on `role` OR
  // `userType`, and candidates appear as both "candidate" and "user".
  // Compare against whichever is present so a guard never rejects a valid
  // session just because of which field the login flow happened to write.
  const actual = String(session.userType || session.role || "").toLowerCase();
  const matches = (expected) => {
    const exp = String(expected || "").toLowerCase();
    if (actual === exp) return true;
    if (exp === "candidate" && (actual === "user" || actual === "candidate")) return true;
    return false;
  };

  if (requiredRole && !matches(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  if (requiredUserType && !matches(requiredUserType)) {
    return <Navigate to="/" replace />;
  }

  // Check profile completion
  if (requireProfileCompletion && !session.profileCompleted) {
    return (
      <Navigate
        to="/profile-completion"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

// Recruiter-only route
export function RecruiterRoute({ children }) {
  return (
    <ProtectedRoute requiredUserType="recruiter">
      {children}
    </ProtectedRoute>
  );
}

// Candidate-only route
export function CandidateRoute({ children }) {
  return (
    <ProtectedRoute requiredUserType="candidate">
      {children}
    </ProtectedRoute>
  );
}

// Admin-only route
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredUserType="admin">
      {children}
    </ProtectedRoute>
  );
}