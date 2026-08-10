import React, { useEffect, useLayoutEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home/Home";
import JobPage from "./pages/JobPage/JobPage";
import { SquareArrowUp } from "lucide-react";
import Company from "./pages/Company/Company";
import Roles from "./pages/Roles/Roles";
import Saved from "./pages/Saved/Saved";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import JobDetail from "./pages/JobDetail/JobDetail";
import Contact from "./pages/Contact/Contact";
import ViewProfile from "./pages/ViewProfile/ViewProfile";
const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        try {
          window.history.scrollRestoration = prev;
        } catch (e) {}
      };
    }
  }, []);

  useLayoutEffect(() => {
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {}
  }, [pathname]);

  return null;
};

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.pageYOffset > 300);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center cursor-pointer rounded-full bg-blue-300 shadow-xl hover:bg-blue-400 active:scale-95 transition-all duration-300"
    >
      <SquareArrowUp size={22} />
    </button>
  );
};

const App = () => {
  return (
    <>
      <ScrollToTopOnRouteChange />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobPage />} />
        <Route path="/companies" element={<Company />} />
        <Route path="/companies/:companyId" element={<Company />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/roles/:roleSlug" element={<Roles />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/jobdetails/:id" element={<JobDetail />} />
        <Route path="/viewprofile" element={<ViewProfile />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/saved" element={<Saved />} />
      </Routes>

      <ScrollToTopButton />
    </>
  );
};

export default App;
