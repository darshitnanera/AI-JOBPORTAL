import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import RolePage from "../../components/RolePage/RolePage";
import Footer from "../../components/Footer/Footer";

const Roles = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <RolePage />
      </main>
      <Footer />
    </div>
  );
};

export default Roles;
