import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Banner from "../../components/Banner/Banner";
import Candidate from "../../components/Candidate/Candidate";
import Career from "../../components/Career/Career";
import InterviewQuestion from "../../components/InterviewQuestion/InterviewQuestion";
import Footer from "../../components/Footer/Footer";
const Home = () => {
  return (
    <div>
      <Navbar />
      <Banner />
      <Candidate />
      <Career />
      <InterviewQuestion />
      <Footer />
    </div>
  );
};

export default Home;
