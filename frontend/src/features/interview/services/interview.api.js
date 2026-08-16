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

  const response = await API.post("/ai-suggestion", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getInterviewReportById = async (interviewId) => {
  const response = await API.get(`/ai-suggestion/report/${interviewId}`);
  return response.data;
};

export const getAllInterviewReports = async () => {
  const response = await API.get("/ai-suggestion");
  return response.data;
};

export const generateResumePdf = async ({ interviewReportId }) => {
  const response = await API.post(
    `/ai-suggestion/resume/pdf/${interviewReportId}`,
    null,
    { responseType: "blob" },
  );

  return response.data;
};