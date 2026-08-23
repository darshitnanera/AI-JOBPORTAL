import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Home,
  Search,
  FileText,
  Sparkles,
  Bookmark,
  MessageSquare,
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Mic,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import logo from "../../assets/logo.png";

const STORAGE_KEY = "jobportal_user";

/**
 * Navigation is role-scoped. Recruiters were previously shown Resume, AI
 * Suggestions and Saved — candidate-only surfaces whose endpoints answer 403
 * for a recruiter account.
 */
const CANDIDATE_NAV = [
  { id: "home", label: "Home", path: "/", icon: Home },
  { id: "jobs", label: "Jobs", path: "/jobs", icon: Search },
  { id: "resume", label: "Resume", path: "/resume", icon: FileText, auth: true },
  { id: "ai", label: "AI Suggestions", path: "/ai-suggestion", icon: Sparkles, auth: true },
  { id: "interview", label: "Mock Interview", path: "/candidate/mock-interview", icon: Mic, auth: true },
  { id: "saved", label: "Saved", path: "/saved", icon: Bookmark, auth: true },
];

const RECRUITER_NAV = [
  { id: "rec-dash", label: "Dashboard", path: "/recruiter/dashboard", icon: LayoutDashboard },
  { id: "rec-jobs", label: "Manage Jobs", path: "/recruiter/jobs", icon: Briefcase },
  { id: "rec-post", label: "Post a Job", path: "/recruiter/jobs/create", icon: PlusCircle },
  { id: "rec-interview", label: "Interview Manager", path: "/recruiter/interview-manager", icon: Mic },
];

const ADMIN_NAV = [
  { id: "adm-dash", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", path: "/jobs", icon: Search },
];

/** Signed-out visitors browse the public surfaces only. */
const PUBLIC_NAV = [
  { id: "home", label: "Home", path: "/", icon: Home },
  { id: "jobs", label: "Jobs", path: "/jobs", icon: Search },
];

const navItemsFor = (user, role) => {
  if (!user) return PUBLIC_NAV;
  if (role === "recruiter") return RECRUITER_NAV;
  if (role === "admin") return ADMIN_NAV;
  return CANDIDATE_NAV.filter((i) => !i.auth || user);
};

/** Normalises the two shapes the app stores (`role` vs `userType`). */
const resolveRole = (user) =>
  (user?.userType || user?.role || "candidate").toLowerCase();

const ROLE_BADGE = {
  recruiter: "bg-accent-500/10 text-accent-600 ring-accent-500/25",
  admin: "bg-danger-500/10 text-danger-600 ring-danger-500/25",
  candidate: "bg-brand-500/10 text-brand-600 ring-brand-500/25",
};

const DASHBOARD_PATH = {
  recruiter: "/recruiter/dashboard",
  admin: "/admin/dashboard",
  candidate: "/candidate/dashboard",
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const role = resolveRole(user);
  const dashboardPath = DASHBOARD_PATH[role] || DASHBOARD_PATH.candidate;

  /* ---------------------------------------------------------- scroll */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ------------------------------------------------ user from storage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ------------------------------------------------ close on outside */
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const onEsc = (e) => e.key === "Escape" && setUserMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setMobileOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ------------------------------------------------------ unread poll */
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(
          `${API_BASE_URL}/api/messages/unread-count`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled && res.data?.success) {
          setUnreadCount(res.data.data?.unreadCount ?? 0);
        }
      } catch {
        /* silent — a missing count must never break the header */
      }
    };

    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, API_BASE_URL]);

  /* ----------------------------------------------------------- helpers */
  const isActive = useCallback(
    (path) =>
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path),
    [location.pathname]
  );

  const handleLogout = () => {
    ["jobportal_user", "token", "appliedJobs", "savedJobs"].forEach((k) =>
      localStorage.removeItem(k)
    );
    setUser(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate("/login");
  };

  const initials = (name) => {
    if (!name) return "U";
    const parts = String(name).trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const visibleItems = navItemsFor(user, role);

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full transition-all duration-300",
        "border-b bg-white/85 backdrop-blur-xl dark:bg-slate-950/85",
        isScrolled
          ? "border-slate-200 shadow-sm dark:border-slate-800"
          : "border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-18 lg:px-8">
        {/* ---------------------------------------------------- Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="JobPortal home"
        >
          <img
            src={logo}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              JobPortal
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Find your dream job
            </span>
          </span>
        </Link>

        {/* ------------------------------------------ Desktop nav links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {visibleItems.map(({ id, label, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={id}
                to={path}
                className={[
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors duration-200",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-300",
                ].join(" ")}
              >
                <Icon size={17} className="shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ------------------------------------- Right workspace actions */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              {/* Dashboard — recruiters and admins already have it as their
                  first primary nav item, so only candidates need it here. */}
              {role === "candidate" && (
                <Link
                  to={dashboardPath}
                  className="hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-600 md:flex dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                >
                  <LayoutDashboard size={17} />
                  <span>Dashboard</span>
                </Link>
              )}

              {/* Messages — persistent, separate from primary nav */}
              <Link
                to="/messages"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                aria-label={
                  unreadCount > 0
                    ? `Messages, ${unreadCount} unread`
                    : "Messages"
                }
                title="Messages"
              >
                <MessageSquare size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {!user ? (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
            >
              <LogIn size={17} />
              <span>Login</span>
            </Link>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
                  {initials(user.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                    {user.name || "User"}
                  </span>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ring-1 ${
                      ROLE_BADGE[role] || ROLE_BADGE.candidate
                    }`}
                  >
                    {role}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`hidden shrink-0 text-slate-400 transition-transform duration-200 sm:block ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <Link
                    to="/viewprofile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <User size={17} className="text-slate-400" />
                    View profile
                  </Link>
                  <Link
                    to={dashboardPath}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 md:hidden dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <LayoutDashboard size={17} className="text-slate-400" />
                    Dashboard
                  </Link>
                  <div className="my-1.5 h-px bg-slate-200 dark:bg-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:hover:bg-danger-500/10"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------- Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------- Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-950">
          <nav className="flex flex-col gap-1">
            {visibleItems.map(({ id, label, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={id}
                  to={path}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
            {user && (
              <Link
                to={dashboardPath}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
