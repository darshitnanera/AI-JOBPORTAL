// src/components/Navbar.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  Building,
  UserCheck,
  List,
  LogIn,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
} from "lucide-react";
import logoFallback from "../../assets/logo.png";
import { navbarStyles as s } from "../../assets/dummyStyles";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: Home },
  { key: "jobs", label: "Jobs", Icon: Briefcase },
  { key: "listJob", label: "List Job", Icon: List },
  { key: "company", label: "Companies", Icon: Building },
  {
    key: "companyQuestions",
    label: "Company Questions",
    Icon: Building,
    dropdown: [{ key: "listCompanyQ", label: "List Company Questions" }],
  },
  {
    key: "roleQuestions",
    label: "Role Questions",
    Icon: UserCheck,
    dropdown: [{ key: "listRoleQ", label: "List Role Questions" }],
  },
];

const ROUTES = {
  dashboard: "/",
  company: "/companies",
  jobs: "/addjobs",
  listJob: "/list/jobs",
  companyQuestions: "/company-questions",
  listCompanyQ: "/list/company-questions",
  roleQuestions: "/role-questions",
  listRoleQ: "/list/role-questions",
  login: "/login",
};

export default function Navbar({
  logoSrc,
  brandName = "Job Portal",
  onNavigate,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, [location.pathname]);

  const pathToKey = (pathname) => {
    const found = Object.entries(ROUTES).find(([key, path]) => {
      if (path === "/") return pathname === "/";
      return (
        pathname === path ||
        pathname.startsWith(path + "/") ||
        pathname.startsWith(path)
      );
    });
    return found ? found[0] : "dashboard";
  };

  const [active, setActive] = useState(pathToKey(location.pathname));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navContainerRef = useRef(null);
  const itemRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // dropdown state for desktop hover/click
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const navCloseTimeoutRef = useRef(null);

  // Window width -> isLGOnly (lg range: 1024 <= w < 1280)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isLGOnly = windowWidth >= 1024 && windowWidth < 1280;

  // Close LG dropdown when clicking outside (only relevant if LG dropdown is used)
  useEffect(() => {
    if (!isLGOnly) return;
    const handleDocClick = (e) => {
      const container = navContainerRef.current;
      if (!container) return;
      if (!container.contains(e.target)) {
        setOpenDropdownKey(null);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [isLGOnly]);

  // Sync active state with current route
  useEffect(() => {
    const key = pathToKey(location.pathname);
    setActive(key);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Measure and update indicator position – useLayoutEffect prevents flicker
  const updateIndicator = useCallback(() => {
    const container = navContainerRef.current;
    const activeEl = itemRefs.current[active];
    if (!container || !activeEl) {
      setIndicatorStyle({ left: 0, width: 0 });
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setIndicatorStyle({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
  }, [active]);

  useLayoutEffect(() => {
    updateIndicator();
    let rafId = null;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateIndicator);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateIndicator]);

  const handleNavigate = (key) => {
    const path = ROUTES[key] ?? "/";
    setActive(key);
    onNavigate?.(key);
    navigate(path);
    setMobileMenuOpen(false);
    setOpenDropdownKey(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    setMobileMenuOpen(false);
  };

  const logoToUse = logoSrc ?? logoFallback;

  // user menu hover logic (unchanged)
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const userMenuContainerRef = useRef(null);

  const openUserMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setUserMenuOpen(true);
  };
  const startCloseTimer = (delay = 250) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
      closeTimeoutRef.current = null;
    }, delay);
  };

  // dropdown hover handlers (desktop only)
  const openNavDropdown = (key) => {
    if (navCloseTimeoutRef.current) {
      clearTimeout(navCloseTimeoutRef.current);
      navCloseTimeoutRef.current = null;
    }
    setOpenDropdownKey(key);
  };
  const closeNavDropdownDelayed = (delay = 200) => {
    if (navCloseTimeoutRef.current) clearTimeout(navCloseTimeoutRef.current);
    navCloseTimeoutRef.current = setTimeout(() => {
      setOpenDropdownKey(null);
      navCloseTimeoutRef.current = null;
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (navCloseTimeoutRef.current) clearTimeout(navCloseTimeoutRef.current);
    };
  }, []);

  return (
    <header className={s.header}>
      <nav className={s.nav}>
        <div className={s.navContainer}>
          <div className={s.navContent}>
            {/* Logo */}
            <div
              className={s.logoContainer}
              onClick={() => handleNavigate("dashboard")}
            >
              <div className={s.logoWrapper}>
                {logoToUse ? (
                  <img src={logoToUse} className={s.logoImage} alt="logo" />
                ) : (
                  <span className={s.logoFallback}>{brandName[0]}</span>
                )}
              </div>
              <div className={s.logoTextContainer}>
                <span className={s.logoBrandName}>{brandName}</span>
                <span className={s.logoSubtitle}>Find your dream job</span>
              </div>
            </div>

            {/* Desktop Navigation (visible on xl and above now) */}
            <div className={s.desktopNav}>
              <div ref={navContainerRef} className={s.navIndicatorContainer}>
                {/* Active indicator */}
                {active && indicatorStyle.width > 0 && (
                  <div
                    className={s.activeIndicator}
                    style={{
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                      boxShadow: "0 0 8px rgba(165, 180, 252, 0.5)",
                    }}
                    aria-hidden="true"
                  />
                )}

                <ul className={s.navList}>
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.Icon;

                    // only treat sub-items as making the parent "active" when we're in LG-only mode (where dropdown sits under parent)
                    const isActiveParent =
                      active === item.key ||
                      (item.dropdown &&
                        isLGOnly &&
                        item.dropdown.some((sub) => active === sub.key));

                    return (
                      <React.Fragment key={item.key}>
                        <li
                          className={s.navItem}
                          onMouseEnter={() =>
                            item.dropdown &&
                            isLGOnly &&
                            openNavDropdown(item.key)
                          }
                          onMouseLeave={() =>
                            item.dropdown &&
                            isLGOnly &&
                            closeNavDropdownDelayed(200)
                          }
                        >
                          <div
                            ref={(el) => {
                              itemRefs.current[item.key] = el;
                              // map sub-keys to parent ref ONLY on LG-only so indicator can sit under parent for LG dropdown
                              if (item.dropdown && el && isLGOnly) {
                                item.dropdown.forEach((sub) => {
                                  itemRefs.current[sub.key] = el;
                                });
                              }
                            }}
                            className={s.navItemWrapper}
                          >
                            <button
                              onClick={(e) => {
                                // On LG-only, if item has dropdown, toggle dropdown instead of navigating
                                if (item.dropdown && isLGOnly) {
                                  e.preventDefault();
                                  setOpenDropdownKey((prev) =>
                                    prev === item.key ? null : item.key,
                                  );
                                  return;
                                }
                                // Otherwise behave as normal (navigate)
                                handleNavigate(item.key);
                              }}
                              className={`${s.navButton} ${
                                isActiveParent
                                  ? s.navButtonActive
                                  : s.navButtonInactive
                              }`}
                              aria-current={isActiveParent ? "page" : undefined}
                            >
                              <Icon className={s.navButtonIcon} />
                              <span className={s.navButtonText}>
                                {item.label}
                              </span>

                              {/* show dropdown chevron ONLY on lg-only */}
                              {item.dropdown && isLGOnly && (
                                <ChevronDown className={s.navDropdownIcon} />
                              )}
                            </button>
                          </div>

                          {/* LG-only dropdown panel (centered, with caret) */}
                          {item.dropdown && isLGOnly && (
                            <div
                              className={`${s.dropdownPanel} ${
                                openDropdownKey === item.key
                                  ? s.dropdownVisible
                                  : s.dropdownHidden
                              }`}
                              onMouseEnter={() => openNavDropdown(item.key)}
                              onMouseLeave={() => closeNavDropdownDelayed(200)}
                            >
                              {/* caret */}
                              <div className={s.dropdownCaret} />
                              <div
                                className={`${s.dropdownContent} ${
                                  openDropdownKey === item.key
                                    ? "animated-border"
                                    : "bg-transparent"
                                }`}
                                style={{
                                  background:
                                    openDropdownKey === item.key
                                      ? undefined
                                      : "transparent",
                                }}
                              >
                                <div className={s.dropdownInner}>
                                  {item.dropdown.map((sub) => {
                                    const isActiveSub = active === sub.key;
                                    return (
                                      <button
                                        key={sub.key}
                                        onClick={() => handleNavigate(sub.key)}
                                        className={`${s.dropdownItem} ${
                                          isActiveSub
                                            ? s.dropdownItemActive
                                            : s.dropdownItemInactive
                                        }`}
                                      >
                                        <span className={s.dropdownItemDot} />
                                        <span>{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </li>

                        {/* If NOT LG-only (e.g., XL and bigger), render sub-items inline so list options remain visible and selectable.
                            On XL sub-items get their own refs so clicking them makes only the sub-item active (indicator under sub). */}
                        {!isLGOnly &&
                          item.dropdown &&
                          item.dropdown.map((sub) => {
                            const isActiveSub = active === sub.key;
                            return (
                              <li key={sub.key} className={s.subNavItem}>
                                <div
                                  ref={(el) => (itemRefs.current[sub.key] = el)}
                                  className={s.navItemWrapper}
                                >
                                  <button
                                    onClick={() => handleNavigate(sub.key)}
                                    className={`${s.subNavButton} ${
                                      isActiveSub
                                        ? s.subNavButtonActive
                                        : s.subNavButtonInactive
                                    }`}
                                    aria-current={
                                      isActiveSub ? "page" : undefined
                                    }
                                  >
                                    <span className={s.subNavDot} />
                                    <span className={s.navButtonText}>
                                      {sub.label}
                                    </span>
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Right side actions */}
            <div className={s.rightActions}>
              <div className={s.desktopAuth}>
                {user ? (
                  <div
                    ref={userMenuContainerRef}
                    className={s.userMenuContainer}
                    onMouseEnter={openUserMenu}
                    onMouseLeave={() => startCloseTimer(250)}
                  >
                    <button
                      onClick={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                        setUserMenuOpen((s) => !s);
                      }}
                      aria-haspopup="true"
                      aria-expanded={userMenuOpen}
                      className={s.userMenuButton}
                    >
                      <User className={s.userIcon} />
                      <span className={s.userName}>{user.name}</span>
                      <ChevronDown className={s.userDropdownIcon} />
                    </button>

                    <div
                      className={`${s.userDropdown} ${
                        userMenuOpen
                          ? s.userDropdownVisible
                          : s.userDropdownHidden
                      }`}
                      aria-hidden={!userMenuOpen}
                    >
                      <div
                        className={`${s.dropdownContent} ${
                          userMenuOpen ? "animated-border" : "bg-transparent"
                        }`}
                        style={{
                          background: userMenuOpen ? undefined : "transparent",
                        }}
                      >
                        <div className={s.userDropdownInner}>
                          <button
                            onClick={handleLogout}
                            className={s.logoutButton}
                          >
                            <LogOut className={s.logoutIcon} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigate("login")}
                    className={s.loginButton}
                  >
                    <span className={s.loginButtonOverlay} />
                    <span className={s.loginButtonContent}>
                      <LogIn className={s.loginIcon} />
                      <span>Login</span>
                    </span>
                  </button>
                )}
              </div>

              {/* Mobile menu button (visible md + lg; hidden on xl) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={s.mobileMenuButton}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className={s.mobileMenuIcon} />
                ) : (
                  <Menu className={s.mobileMenuIcon} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu (visible md + lg; hidden on xl) */}
          {mobileMenuOpen && (
            <div className={s.mobileMenu}>
              <div className={s.mobileMenuContent}>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.Icon;
                  const isActiveParent = active === item.key;
                  return (
                    <div key={item.key} className={s.mobileNavItem}>
                      <button
                        onClick={() => handleNavigate(item.key)}
                        className={`${s.mobileNavButton} ${
                          isActiveParent
                            ? s.mobileNavButtonActive
                            : s.mobileNavButtonInactive
                        }`}
                      >
                        <Icon className={s.mobileNavIcon} />
                        <span className={s.mobileNavText}>{item.label}</span>
                      </button>

                      {item.dropdown && (
                        <div className={s.mobileDropdown}>
                          {item.dropdown.map((sub) => {
                            const isActiveSub = active === sub.key;
                            return (
                              <button
                                key={sub.key}
                                onClick={() => handleNavigate(sub.key)}
                                className={`${s.mobileDropdownItem} ${
                                  isActiveSub
                                    ? s.mobileDropdownItemActive
                                    : s.mobileDropdownItemInactive
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mobile auth */}
                {user ? (
                  <>
                    <div className={s.mobileUserInfo}>
                      <span className={s.mobileUserInfoContent}>
                        <User className={s.userIcon} />
                        <span className={s.userName}>{user.name}</span>
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className={s.mobileLogoutButton}
                    >
                      <LogOut className={s.mobileNavIcon} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className={s.mobileLoginContainer}>
                    <button
                      onClick={() => handleNavigate("login")}
                      className={s.mobileLoginButton}
                    >
                      <LogIn className={s.mobileNavIcon} />
                      <span>Login</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Styles for dropdown animation + animated border */}
      <style>{s.animations}</style>
    </header>
  );
}
