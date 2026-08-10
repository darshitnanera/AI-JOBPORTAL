import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase,
  Search,
  Home,
  Bookmark,
  Menu,
  X,
  LogIn,
  UserCog,
  LogOut,
  ChevronDown,
  ChevronUp,
  User,
  UserPen,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { navbarStyles as s } from "../../assets/dummyStyles";

const navItems = [
  { id: "home", label: "Home", path: "/", icon: <Home size={18} /> },
  { id: "jobs", label: "Jobs", path: "/jobs", icon: <Search size={18} /> },
  {
    id: "companies",
    label: "Companies",
    path: "/companies",
    icon: <Briefcase size={18} />,
  },
  { id: "roles", label: "Roles", path: "/roles", icon: <UserCog size={18} /> },
  { id: "saved", label: "Saved", path: "/saved", icon: <Bookmark size={18} /> },
  {
    id: "contact",
    label: "Contact",
    path: "/contact",
    icon: <UserPen size={18} />,
  },
];

const STORAGE_KEY = "jobportal_user";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("home");
  const [isHovered, setIsHovered] = useState(null);
  const [user, setUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const path = location.pathname || "/";
    const matched =
      navItems.find((i) => i.path === path) ||
      navItems.find((i) => path.startsWith(i.path) && i.path !== "/");
    setActiveNavItem(matched ? matched.id : "home");
  }, [location]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
      else setUser(null);
    } catch (e) {
      setUser(null);
    }
    setIsUserMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isUserMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNavClick = (item) => {
    navigate(item.path);
    setActiveNavItem(item.id);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("appliedJobs");
    localStorage.removeItem("savedJobs");
    setUser(null);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const toggleUserMenu = () => setIsUserMenuOpen((v) => !v);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <nav className={s.navbar(isScrolled)}>
      <div className={s.container}>
        <div className={s.flexContainer}>
          {/* Logo */}
          <div className={s.logoSection}>
            <div className={s.logoWrapper}>
              <Link to="/" aria-label="JobPortal home">
                <img
                  src={logo}
                  alt="Job Portal Logo"
                  width={36}
                  height={36}
                  className={s.logoImage}
                />
              </Link>
            </div>
            <div className={s.logoTextContainer}>
              <span className={s.logoTitle}>JobPortal</span>
              <span className={s.logoSubtitle}>Find your dream job</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className={s.desktopNav}>
            {navItems.map((item) => (
              <div
                key={item.id}
                className={s.navItemContainer}
                onMouseEnter={() => setIsHovered(item.id)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <button
                  onClick={() => handleNavClick(item)}
                  className={s.navButton(activeNavItem === item.id)}
                >
                  <span className={s.navIcon(isHovered === item.id)}>
                    {item.icon}
                  </span>
                  <span className={s.navLabel}>{item.label}</span>
                </button>
                <div className={s.navUnderline(isHovered === item.id)} />
              </div>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className={s.desktopActions}>
            <div className={s.actionInner}>
              {!user ? (
                <button
                  onClick={() => navigate("/login")}
                  className={s.loginButton}
                  aria-label="Login"
                >
                  <div className={s.loginButtonBg} />
                  <div className={s.loginButtonContent}>
                    <LogIn className={s.loginIcon} />
                    <span className={s.loginText}>Login</span>
                  </div>
                </button>
              ) : (
                <div className={s.profileButtonContainer} ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className={s.profileButton}
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className={s.profileAvatar}>
                      {getInitials(user.name)}
                    </div>
                    <div className={s.profileInfo}>
                      <span className={s.profileName}>{user.name}</span>
                      {isUserMenuOpen ? (
                        <ChevronUp className={s.profileChevron} />
                      ) : (
                        <ChevronDown className={s.profileChevron} />
                      )}
                    </div>
                  </button>

                  <div className={s.userDropdown(isUserMenuOpen)}>
                    <Link
                      to="/viewprofile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={s.dropdownItem}
                    >
                      <User className={s.dropdownIcon} />
                      <span className={s.dropdownText}>View profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`${s.dropdownItem} w-full text-left`}
                    >
                      <LogOut className={s.dropdownIcon} />
                      <span className={s.dropdownText}>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={s.mobileToggle}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className={s.mobileToggleIcon} />
            ) : (
              <Menu className={s.mobileToggleIcon} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={s.mobileMenu(isMobileMenuOpen)}>
          <div className={s.mobileMenuCard}>
            <div className={s.mobileMenuSpace}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={s.mobileNavButton(activeNavItem === item.id)}
                >
                  <div
                    className={s.mobileNavIconWrapper(
                      activeNavItem === item.id,
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className={s.mobileNavLabel}>{item.label}</span>
                </button>
              ))}

              <div className={s.mobileDivider}>
                <div className={s.mobileMenuSpace}>
                  {!user ? (
                    <button
                      onClick={() => {
                        navigate("/login");
                        setIsMobileMenuOpen(false);
                      }}
                      className={s.mobileLoginButton}
                    >
                      <LogIn className="w-5 h-5" />
                      <span className="font-medium">Login</span>
                    </button>
                  ) : (
                    <>
                      <div className={s.mobileUserInfo}>
                        <div className={s.mobileAvatar}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className={s.mobileUserName}>{user.name}</div>
                        </div>
                      </div>

                      <div className={s.mobileProfileGrid}>
                        <Link
                          to="/viewprofile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={s.mobileProfileButton}
                        >
                          <User className="w-5 h-5" />
                          <span className="font-medium">Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className={s.mobileProfileButton}
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{s.globalStyles}</style>
    </nav>
  );
};

export default Navbar;
