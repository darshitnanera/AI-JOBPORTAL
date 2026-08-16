import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../hooks/useInterview";
import "../style/home.scss";

const Home = () => {
  const { loading, generateReport, reports } = useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const resumeInputRef = useRef(null);
  const navigate = useNavigate();

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current?.files?.[0];
    const data = await generateReport({
      jobDescription,
      selfDescription,
      resumeFile,
    });

    if (data?._id) {
      navigate(`/ai-suggestion/${data._id}`);
    }
  };

  if (loading) {
    return (
      <main className="loading-screen">
        <h1>Loading your interview plan...</h1>
      </main>
    );
  }

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>
          Create Your Custom <span className="highlight">Interview Plan</span>
        </h1>
        <p>
          Let the AI analyze the job requirements and your profile to build a
          stronger interview strategy.
        </p>
      </header>

      <div className="interview-card">
        <div className="interview-card__body">
          <div className="panel panel--left">
            <div className="panel__header">
              <span className="panel__icon">JD</span>
              <h2>Target Job Description</h2>
              <span className="badge badge--required">Required</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="panel__textarea"
              placeholder="Paste the full job description here..."
              maxLength={5000}
            />
            <div className="char-counter">{jobDescription.length} / 5000 chars</div>
          </div>

          <div className="panel-divider" />

          <div className="panel panel--right">
            <div className="panel__header">
              <span className="panel__icon">AI</span>
              <h2>Your Profile</h2>
            </div>

            <div className="upload-section">
              <label className="section-label">
                Upload Resume <span className="badge badge--best">Best Results</span>
              </label>
              <label className="dropzone" htmlFor="resume">
                <p className="dropzone__title">Click to upload or drag &amp; drop</p>
                <p className="dropzone__subtitle">PDF or DOCX</p>
                <input ref={resumeInputRef} hidden type="file" id="resume" name="resume" accept=".pdf,.docx" />
              </label>
            </div>

            <div className="or-divider">
              <span>OR</span>
            </div>

            <div className="self-description">
              <label className="section-label" htmlFor="selfDescription">
                Quick Self-Description
              </label>
              <textarea
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                id="selfDescription"
                name="selfDescription"
                className="panel__textarea panel__textarea--short"
                placeholder="Briefly describe your experience and key skills..."
              />
            </div>

            <div className="info-box">
              <p>
                Either a <strong>Resume</strong> or a <strong>Self Description</strong>
                is required.
              </p>
            </div>
          </div>
        </div>

        <div className="interview-card__footer">
          <span className="footer-info">AI-Powered Strategy Generation</span>
          <button onClick={handleGenerateReport} className="generate-btn">
            Generate My Interview Strategy
          </button>
        </div>
      </div>

      {reports.length > 0 && (
        <section className="recent-reports">
          <h2>My Recent Interview Plans</h2>
          <ul className="reports-list">
            {reports.map((report) => (
              <li
                key={report._id}
                className="report-item"
                onClick={() => navigate(`/ai-suggestion/${report._id}`)}
              >
                <h3>{report.title || "Untitled Position"}</h3>
                <p className="report-meta">
                  Generated on {new Date(report.createdAt).toLocaleDateString()}
                </p>
                <p
                  className={`match-score ${report.matchScore >= 80 ? "score--high" : report.matchScore >= 60 ? "score--mid" : "score--low"}`}
                >
                  Match Score: {report.matchScore}%
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Home;