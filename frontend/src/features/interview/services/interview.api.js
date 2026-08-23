import API from "../../../utils/api";

export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
}) => {
  const formData = new FormData();
  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);
  if (resumeFile) {
    formData.append("resume", resumeFile);
  }

  const response = await API.post("/api/ai-suggestion", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getInterviewReportById = async (interviewId) => {
  const response = await API.get(`/api/ai-suggestion/report/${interviewId}`);
  return response.data;
};

export const getAllInterviewReports = async () => {
  const response = await API.get("/api/ai-suggestion");
  return response.data;
};

export const generateResumePdf = async ({ interviewReportId }) => {
  const response = await API.post(
    `/api/ai-suggestion/resume/pdf/${interviewReportId}`,
    null,
    { responseType: "blob" },
  );

  return response.data;
};

/**
 * Personalised job recommendations produced by the matching engine.
 * Returns [] for users the endpoint does not apply to (e.g. recruiters).
 */
export const getJobRecommendations = async (limit = 6) => {
  const response = await API.get("/api/job-match/recommendations", {
    params: { limit },
  });
  return response.data?.recommendations || [];
};

/** The candidate's stored parsed resume, or null when none exists. */
export const getParsedResume = async () => {
  const response = await API.get("/api/resume/parsed");
  return response.data?.parsedResume || null;
};
