import React, { useCallback, useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import API from "../../utils/api";
import SelectionPhase from "./SelectionPhase";
import SimulatorPhase from "./SimulatorPhase";
import ResultsPhase from "./ResultsPhase";
import { BADGE_BRAND, H1, MAIN, PAGE, SUBTITLE } from "./ui";

const PHASES = {
  SELECTION: "selection",
  SIMULATOR: "simulator",
  RESULTS: "results",
};

/**
 * Candidate mock interview — three phases behind one route.
 *
 * Selection → Simulator → Results. The browser holds only the raw answer text;
 * every score, matched key point and piece of feedback comes back from
 * POST /api/mock-interview/submit and is rendered as received.
 */
export default function MockInterview() {
  const [phase, setPhase] = useState(PHASES.SELECTION);

  const [options, setOptions] = useState({ companies: [], roles: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [report, setReport] = useState(null);

  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError("");
    try {
      const { data } = await API.get("/api/mock-interview/options");
      setOptions({ companies: data?.companies || [], roles: data?.roles || [] });
    } catch (error) {
      setOptionsError(
        error?.response?.data?.message ||
          "We couldn't reach the mock interview service."
      );
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const fetchAttempts = useCallback(async () => {
    setAttemptsLoading(true);
    try {
      const { data } = await API.get("/api/mock-interview/attempts");
      setAttempts(data?.attempts || []);
    } catch {
      // Past attempts are supporting context, not the point of the page —
      // a failure here must not block starting a new session.
      setAttempts([]);
    } finally {
      setAttemptsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchAttempts();
  }, [fetchOptions, fetchAttempts]);

  const startSession = async (companyName, targetRole) => {
    setStarting(true);
    setStartError("");
    try {
      const { data } = await API.get("/api/mock-interview/session", {
        params: { company: companyName, role: targetRole },
      });
      setSession({
        companyName: data.companyName,
        targetRole: data.targetRole,
        questions: data.questions || [],
      });
      setAnswers({});
      setReport(null);
      setSubmitError("");
      setPhase(PHASES.SIMULATOR);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStartError(
        error?.response?.data?.message ||
          "We couldn't start that interview. Please try again."
      );
    } finally {
      setStarting(false);
    }
  };

  const handleAnswerChange = (questionId, value) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const handleFinish = async (durationSeconds) => {
    if (!session) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data } = await API.post("/api/mock-interview/submit", {
        companyName: session.companyName,
        targetRole: session.targetRole,
        durationSeconds,
        answers: session.questions.map((question) => ({
          questionId: question._id,
          response: answers[question._id] || "",
        })),
      });
      setReport(data);
      setPhase(PHASES.RESULTS);
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Refresh history so the attempt shows up if the candidate goes back.
      fetchAttempts();
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
          "We couldn't score your interview. Your answers are still here — try finishing again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const backToSelection = () => {
    setPhase(PHASES.SELECTION);
    setSession(null);
    setAnswers({});
    setReport(null);
    setSubmitError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const practiceAgain = () => {
    if (!session) return backToSelection();
    startSession(session.companyName, session.targetRole);
  };

  return (
    <div className={PAGE}>
      <Navbar />

      <main className={MAIN}>
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={H1}>AI mock interview</h1>
            <p className={SUBTITLE}>
              {phase === PHASES.SELECTION &&
                "Practise against real questions recruiters published for their own roles."}
              {phase === PHASES.SIMULATOR &&
                "Answer each question as you would in the room. You can move back and forth before finishing."}
              {phase === PHASES.RESULTS &&
                "Every score below was calculated server-side from the recruiter's key points."}
            </p>
          </div>

          {phase === PHASES.SELECTION ? (
            <span className={BADGE_BRAND}>
              <MessagesSquare size={14} />
              {options.companies.length} compan
              {options.companies.length === 1 ? "y" : "ies"}
            </span>
          ) : null}
        </header>

        {phase === PHASES.SELECTION ? (
          <SelectionPhase
            options={options}
            loading={optionsLoading}
            error={optionsError}
            onRetry={() => {
              fetchOptions();
              fetchAttempts();
            }}
            onStart={startSession}
            starting={starting}
            startError={startError}
            attempts={attempts}
            attemptsLoading={attemptsLoading}
          />
        ) : null}

        {phase === PHASES.SIMULATOR && session ? (
          <SimulatorPhase
            session={session}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onFinish={handleFinish}
            onQuit={backToSelection}
            submitting={submitting}
            submitError={submitError}
          />
        ) : null}

        {phase === PHASES.RESULTS && report ? (
          <ResultsPhase
            report={report}
            onPracticeAgain={practiceAgain}
            onBackToSelection={backToSelection}
          />
        ) : null}
      </main>
    </div>
  );
}
