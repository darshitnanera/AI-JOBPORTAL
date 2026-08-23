import { useCallback, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { InterviewContext } from "../interview.context";
import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
  generateResumePdf,
} from "../services/interview.api";

const readableError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const {
    loading,
    setLoading,
    error,
    setError,
    report,
    setReport,
    reports,
    setReports,
  } = context;

  const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    setLoading(true);
    setError("");
    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });
      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (err) {
      setError(
        readableError(err, "We couldn't generate your interview plan. Please try again."),
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReportById = useCallback(
    async (reportId) => {
      setLoading(true);
      setError("");
      try {
        const response = await getInterviewReportById(reportId);
        setReport(response.interviewReport);
        return response.interviewReport;
      } catch (err) {
        setReport(null);
        setError(readableError(err, "We couldn't load this interview plan."));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setReport],
  );

  const getReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllInterviewReports();
      setReports(response.interviewReports || []);
      return response.interviewReports || [];
    } catch (err) {
      setReports([]);
      setError(readableError(err, "We couldn't load your saved plans."));
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setReports]);

  const getResumePdf = async (reportId) => {
    setLoading(true);
    setError("");
    try {
      const response = await generateResumePdf({ interviewReportId: reportId });
      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(readableError(err, "We couldn't generate that PDF."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
      return;
    }
    getReports();
  }, [interviewId, getReportById, getReports]);

  return {
    loading,
    error,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};
