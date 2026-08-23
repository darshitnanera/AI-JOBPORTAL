import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ViewProfilePage from "../../components/ViewProfilePage/ViewProfilePage";

/**
 * Candidate profile page.
 *
 *   /viewprofile                      → the signed-in user's own profile
 *   /viewprofile?candidateId=<id>     → recruiter view of a candidate
 *
 * Page shell follows DESIGN_SYSTEM.md §3.
 */
const ViewProfile = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <Navbar />
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ViewProfilePage />
    </main>
    <Footer />
  </div>
);

export default ViewProfile;
