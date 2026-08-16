import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../hooks/useInterview";
import "../style/interview.scss";

const NAV_ITEMS = [
  {
    id: "technical",
    label: "Technical Questions",
    icon: "<>",
  },
  {
    id: "behavioral",
    label: "Behavioral Questions",
    icon: "{}",
  },
  {
    id: "roadmap",
    label: "Road Map",
    icon: "→",
  },
];

const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="q-card">
      <div className="q-card__header" onClick={() => setOpen((value) => !value)}>
        <span className="q-card__index">Q{index + 1}</span>
        <p className="q-card__question">{item.question}</p>
        <span className={`q-card__chevron ${open ? "q-card__chevron--open" : ""}`}>
          v
        </span>
      </div>
      {open && (
        <div className="q-card__body">
          <div className="q-card__section">
            <span className="q-card__tag q-card__tag--intention">Intention</span>
            <p>{item.intention}</p>
          </div>
          <div className="q-card__section">
            <span className="q-card__tag q-card__tag--answer">Model Answer</span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const RoadMapDay = ({ day }) => (
  <div className="roadmap-day">
    <div className="roadmap-day__header">
      <span className="roadmap-day__badge">Day {day.day}</span>
      <h3 className="roadmap-day__focus">{day.focus}</h3>
    </div>
    <ul className="roadmap-day__tasks">
      {day.tasks.map((task, index) => (
        <li key={index}>
          <span className="roadmap-day__bullet" />
          {task}
        </li>
      ))}
    </ul>
  </div>
);

const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const { report, loading, getResumePdf } = useInterview();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  if (loading || !report) {
    return (
      <main className="loading-screen">
        <h1>Loading your interview plan...</h1>
      </main>
    );
  }

  const scoreColor =
    report.matchScore >= 80
      ? "score--high"
      : report.matchScore >= 60
        ? "score--mid"
        : "score--low";

  return (
    <div className="interview-page">
      <div className="interview-layout">
        <nav className="interview-nav">
          <div className="nav-content">
            <p className="interview-nav__label">Sections</p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`interview-nav__item ${activeNav === item.id ? "interview-nav__item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="interview-nav__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => getResumePdf(interviewId)}
            className="button primary-button"
          >
            Download Resume
          </button>
        </nav>

        <div className="interview-divider" />

        <main className="interview-content">
          {activeNav === "technical" && (
            <section>
              <div className="content-header">
                <h2>Technical Questions</h2>
                <span className="content-header__count">
                  {report.technicalQuestions.length} questions
                </span>
              </div>
              <div className="q-list">
                {report.technicalQuestions.map((question, index) => (
                  <QuestionCard key={index} item={question} index={index} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "behavioral" && (
            <section>
              <div className="content-header">
                <h2>Behavioral Questions</h2>
                <span className="content-header__count">
                  {report.behavioralQuestions.length} questions
                </span>
              </div>
              <div className="q-list">
                {report.behavioralQuestions.map((question, index) => (
                  <QuestionCard key={index} item={question} index={index} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section>
              <div className="content-header">
                <h2>Preparation Road Map</h2>
                <span className="content-header__count">
                  {report.preparationPlan.length}-day plan
                </span>
              </div>
              <div className="roadmap-list">
                {report.preparationPlan.map((day) => (
                  <RoadMapDay key={day.day} day={day} />
                ))}
              </div>
            </section>
          )}
        </main>

        <div className="interview-divider" />

        <aside className="interview-sidebar">
          <div className="match-score">
            <p className="match-score__label">Match Score</p>
            <div className={`match-score__ring ${scoreColor}`}>
              <span className="match-score__value">{report.matchScore}</span>
              <span className="match-score__pct">%</span>
            </div>
            <p className="match-score__sub">Strong match for this role</p>
          </div>

          <div className="sidebar-divider" />

          <div className="skill-gaps">
            <p className="skill-gaps__label">Skill Gaps</p>
            <div className="skill-gaps__list">
              {report.skillGaps.map((gap, index) => (
                <span key={index} className={`skill-tag skill-tag--${gap.severity}`}>
                  {gap.skill}
                </span>
              ))}
            </div>
          </div>

          <button onClick={() => navigate("/ai-suggestion")} className="button">
            Back
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Interview;