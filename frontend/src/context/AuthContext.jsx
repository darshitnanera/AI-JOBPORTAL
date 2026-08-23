import React, { createContext, useContext, useState, useEffect } from "react";
import { saveSession, clearSession, USER_KEY } from "../utils/authStorage";

const AuthContext = createContext();
const STORAGE_KEY = USER_KEY;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setToken(parsed.token);
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    setToken(userData.token);
    // Mirrors the JWT to the flat `token` key that six other call sites read.
    saveSession(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearSession();
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    saveSession(newUser);
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const hasUserType = (type) => {
    if (!user) return false;
    return user.userType === type;
  };

  const isRecruiter = () => hasRole("recruiter") || hasUserType("recruiter");

  const isCandidate = () => hasRole("user") || hasUserType("candidate");

  const isAdmin = () => hasRole("admin") || hasUserType("admin");

  const isProfileComplete = () => user?.profileCompleted || false;

  const isAuthenticated = () => !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        hasRole,
        hasUserType,
        isRecruiter,
        isCandidate,
        isAdmin,
        isProfileComplete,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
