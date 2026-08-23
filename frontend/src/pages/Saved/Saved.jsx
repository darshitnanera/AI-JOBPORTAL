import React from "react";
import SavePage from "../../components/SavePage/SavePage";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
const Saved = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <SavePage />
      </main>
      <Footer />
    </div>
  );
};

export default Saved;
