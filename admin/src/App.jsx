// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ArrowUp, SquareArrowUp } from "lucide-react";

import Home from "./pages/Home/Home";
import AddJobs from "./pages/AddJobs/AddJobs";
import ListJob from "./pages/ListJob/ListJob";
import Company from "./pages/CompanyPage/CompanyPage";
import CompanyQuestion from "./pages/CompanyQuestion/CompanyQuestion";
import ListCompanyQs from "./pages/ListCompanyQs/ListCompanyQs";
import ListRoleQs from "./pages/ListRoleQs/ListRoleQs";
import RoleQuestion from "./pages/RoleQuestion/RoleQuestion";
import ApplicantsPage from "./pages/ApplicantsPage/ApplicantsPage";
import Login from "./pages/Login/Login";

export default function App() {
  const location = useLocation();
  const [showTopBtn, setShowTopBtn] = useState(false);

  /* Scroll to top on route change */
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  /* Show button when scrolling */
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Scroll to top click */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden antialiased">
      <div className="min-w-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/addjobs" element={<AddJobs />} />
          <Route path="/list/jobs" element={<ListJob />} />
          <Route path="/companies" element={<Company />} />
          <Route path="/company-questions" element={<CompanyQuestion />} />
          <Route path="/list/company-questions" element={<ListCompanyQs />} />
          <Route path="/role-questions" element={<RoleQuestion />} />
          <Route path="/list/role-questions" element={<ListRoleQs />} />
          <Route path="/applicants" element={<ApplicantsPage />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/signup" element={<Signup />} /> */}
        </Routes>
      </div>

      {/* Go To Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="
            fixed bottom-6 right-6
             text-white
            p-3 rounded-full
            shadow-lg 
            transition-all duration-300
            cursor-pointer
            z-50
             bg-blue-400  hover:bg-blue-600
          "
          aria-label="Go to top"
        >
          <SquareArrowUp size={22} />
        </button>
      )}
    </div>
  );
}
