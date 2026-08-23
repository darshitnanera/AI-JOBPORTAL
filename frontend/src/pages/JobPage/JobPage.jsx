import React from "react";
import FindJobPage from "../../components/FindJobPage/FindJobPage";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

const JobPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <FindJobPage />
      </main>
      <Footer />
    </div>
  );
};

export default JobPage;
