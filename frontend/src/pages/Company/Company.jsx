import React from "react";
import CompanyPage from "../../components/CompanyPage/CompanyPage";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

const Company = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CompanyPage />
      </main>
      <Footer />
    </div>
  );
};

export default Company;
