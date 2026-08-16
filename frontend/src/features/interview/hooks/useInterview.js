import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { InterviewContext } from "../interview.context";
import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
  generateResumePdf,
} from "../services/interview.api";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

  const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    setLoading(true);
    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });
      setReport(response.interviewReport);
      return response.interviewReport;
    } finally {
      setLoading(false);
    }
  };

  const getReportById = async (reportId) => {
    setLoading(true);
    try {
      const response = await getInterviewReportById(reportId);
      setReport(response.interviewReport);
      return response.interviewReport;
    } finally {
      setLoading(false);
    }
  };

  const getReports = async () => {
    setLoading(true);
    try {
      const response = await getAllInterviewReports();
      setReports(response.interviewReports);
      return response.interviewReports;
    } finally {
      setLoading(false);
    }
  };

  const getResumePdf = async (reportId) => {
    setLoading(true);
    try {
      const response = await generateResumePdf({ interviewReportId: reportId });
      const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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
  }, [interviewId]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};