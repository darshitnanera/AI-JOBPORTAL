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
import ViewProfile from "./pages/ViewProfile/ViewProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileCompletion from "./components/ProfileCompletion/ProfileCompletion";
import InterviewHome from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import { InterviewProvider } from "./features/interview/interview.context";
import { AuthProvider } from "./context/AuthContext";
import RecruiterDashboard from "./pages/RecruiterDashboard/RecruiterDashboard";
import JobPosting from "./pages/JobPosting/JobPosting";
import RecruiterApplications from "./pages/RecruiterApplications/RecruiterApplications";
import RecruiterJobs from "./pages/RecruiterJobs/RecruiterJobs";
import Messages from "./pages/Messages/Messages";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import CandidateDashboard from "./pages/CandidateDashboard/CandidateDashboard";
import ResumeParsing from "./pages/ResumeParsing/ResumeParsing";
import RecruiterInterviewManager from "./pages/RecruiterInterviewManager/RecruiterInterviewManager";
import MockInterview from "./pages/MockInterview/MockInterview";
import "./styles/globals.css";
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
    <AuthProvider>
      <InterviewProvider>
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
            <Route path="/saved" element={<Saved />} />
            <Route
              path="/profile-completion"
              element={
                <ProtectedRoute>
                  <ProfileCompletion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-suggestion"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <InterviewHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-suggestion/:interviewId"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <Interview />
                </ProtectedRoute>
              }
            />

            {/* Resume builder + parser */}
            <Route
              path="/resume"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <ResumeParsing />
                </ProtectedRoute>
              }
            />

            {/* Messages Route */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            {/* Recruiter Routes */}
            <Route
              path="/recruiter/dashboard"
              element={
                <ProtectedRoute requiredUserType="recruiter">
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs"
              element={
                <ProtectedRoute requiredUserType="recruiter">
                  <RecruiterJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/create"
              element={
                <ProtectedRoute requiredUserType="recruiter">
                  <JobPosting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applications"
              element={
                <ProtectedRoute requiredUserType="recruiter">
                  <RecruiterApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/interview-manager"
              element={
                <ProtectedRoute requiredUserType="recruiter">
                  <RecruiterInterviewManager />
                </ProtectedRoute>
              }
            />

            {/* Candidate Dashboard Route */}
            <Route
              path="/candidate/dashboard"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/mock-interview"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <MockInterview />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>

          <ScrollToTopButton />
        </>
      </InterviewProvider>
    </AuthProvider>
  );
};

export default App;
