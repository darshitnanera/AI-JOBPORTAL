import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Banner from "../../components/Banner/Banner";
import Candidate from "../../components/Candidate/Candidate";
import Career from "../../components/Career/Career";
import InterviewQuestion from "../../components/InterviewQuestion/InterviewQuestion";
import Footer from "../../components/Footer/Footer";

const Home = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main>
        <Banner />
        <Candidate />
        <Career />
        <InterviewQuestion />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
