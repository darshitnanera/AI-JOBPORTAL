import mongoose from "mongoose";
import {
  MockQuestion,
  MockInterviewAttempt,
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
} from "../models/mockInterview.model.js";
import {
  evaluateAnswer,
  evaluateAttempt,
  generateCoachingNotes,
} from "../services/interviewEvaluator.service.js";

/** Escape a user string so it can be used inside a RegExp literally. */
const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive exact match, so "Google" and "google" are one company. */
const exactCI = (value) => new RegExp(`^${escapeRegex(String(value).trim())}$`, "i");

const cleanKeyPoints = (input) => {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split("\n")
      : [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
};

// ═══════════════════════ RECRUITER: QUESTION BANK ═══════════════════════════

/** POST /api/mock-interview/questions */
export const createMockQuestion = async (req, res) => {
  try {
    const {
      companyName,
      targetRole,
      questionText,
      category,
      difficulty,
      modelAnswer,
      keyPoints,
      isActive,
    } = req.body;

    if (!companyName?.trim() || !targetRole?.trim() || !questionText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name, target role and question text are required",
      });
    }

    const points = cleanKeyPoints(keyPoints);
    if (points.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one key point is required — scoring depends on it",
      });
    }

    if (category && !QUESTION_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${QUESTION_CATEGORIES.join(", ")}`,
      });
    }

    if (difficulty && !QUESTION_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: `Difficulty must be one of: ${QUESTION_DIFFICULTIES.join(", ")}`,
      });
    }

    const question = await MockQuestion.create({
      createdBy: req.user.id,
      companyName: companyName.trim(),
      targetRole: targetRole.trim(),
      questionText: questionText.trim(),
      category: category || "Technical",
      difficulty: difficulty || "Medium",
      modelAnswer: (modelAnswer || "").trim(),
      keyPoints: points,
      isActive: isActive === undefined ? true : Boolean(isActive),
    });

    return res.status(201).json({ success: true, question });
  } catch (error) {
    console.error("[mockInterview] createMockQuestion:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create the question",
    });
  }
};

/** GET /api/mock-interview/questions?company=&role=&category= */
export const getMockQuestions = async (req, res) => {
  try {
    const { company, role, category } = req.query;

    const filter = { createdBy: req.user.id };
    if (company?.trim()) filter.companyName = exactCI(company);
    if (role?.trim()) filter.targetRole = exactCI(role);
    if (category?.trim()) filter.category = category.trim();

    const questions = await MockQuestion.find(filter).sort({ createdAt: -1 }).lean();

    // The recruiter's own filter dropdowns should list every value they have
    // published, not only the ones surviving the current filter.
    const all = await MockQuestion.find({ createdBy: req.user.id })
      .select("companyName targetRole")
      .lean();

    const companies = [...new Set(all.map((q) => q.companyName))].sort();
    const roles = [...new Set(all.map((q) => q.targetRole))].sort();

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
      filters: { companies, roles, categories: QUESTION_CATEGORIES },
    });
  } catch (error) {
    console.error("[mockInterview] getMockQuestions:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load your questions",
    });
  }
};

/** PUT /api/mock-interview/questions/:id */
export const updateMockQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid question id" });
    }

    const question = await MockQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    if (String(question.createdBy) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only edit questions you created",
      });
    }

    const {
      companyName,
      targetRole,
      questionText,
      category,
      difficulty,
      modelAnswer,
      keyPoints,
      isActive,
    } = req.body;

    if (companyName !== undefined) {
      if (!companyName.trim()) {
        return res.status(400).json({ success: false, message: "Company name cannot be empty" });
      }
      question.companyName = companyName.trim();
    }
    if (targetRole !== undefined) {
      if (!targetRole.trim()) {
        return res.status(400).json({ success: false, message: "Target role cannot be empty" });
      }
      question.targetRole = targetRole.trim();
    }
    if (questionText !== undefined) {
      if (!questionText.trim()) {
        return res.status(400).json({ success: false, message: "Question text cannot be empty" });
      }
      question.questionText = questionText.trim();
    }
    if (category !== undefined) {
      if (!QUESTION_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${QUESTION_CATEGORIES.join(", ")}`,
        });
      }
      question.category = category;
    }
    if (difficulty !== undefined) {
      if (!QUESTION_DIFFICULTIES.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: `Difficulty must be one of: ${QUESTION_DIFFICULTIES.join(", ")}`,
        });
      }
      question.difficulty = difficulty;
    }
    if (modelAnswer !== undefined) question.modelAnswer = (modelAnswer || "").trim();
    if (isActive !== undefined) question.isActive = Boolean(isActive);

    if (keyPoints !== undefined) {
      const points = cleanKeyPoints(keyPoints);
      if (points.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one key point is required — scoring depends on it",
        });
      }
      question.keyPoints = points;
    }

    await question.save();
    return res.status(200).json({ success: true, question });
  } catch (error) {
    console.error("[mockInterview] updateMockQuestion:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update the question" });
  }
};

/** DELETE /api/mock-interview/questions/:id */
export const deleteMockQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid question id" });
    }

    const question = await MockQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    if (String(question.createdBy) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete questions you created",
      });
    }

    await question.deleteOne();
    return res.status(200).json({ success: true, message: "Question deleted", id });
  } catch (error) {
    console.error("[mockInterview] deleteMockQuestion:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete the question" });
  }
};

// ═══════════════════════════ CANDIDATE: PRACTICE ════════════════════════════

/**
 * GET /api/mock-interview/options
 *
 * Every company/role pairing that currently has at least one active question,
 * with counts so the candidate knows how long each session will be.
 */
export const getMockInterviewOptions = async (req, res) => {
  try {
    const pairs = await MockQuestion.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { company: "$companyName", role: "$targetRole" },
          questionCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.company": 1, "_id.role": 1 } },
    ]);

    const companyMap = new Map();
    const roleMap = new Map();

    for (const pair of pairs) {
      const company = pair._id.company;
      const role = pair._id.role;

      if (!companyMap.has(company)) {
        companyMap.set(company, { companyName: company, questionCount: 0, roles: [] });
      }
      const entry = companyMap.get(company);
      entry.questionCount += pair.questionCount;
      entry.roles.push({ targetRole: role, questionCount: pair.questionCount });

      roleMap.set(role, (roleMap.get(role) || 0) + pair.questionCount);
    }

    const companies = [...companyMap.values()];
    const roles = [...roleMap.entries()]
      .map(([targetRole, questionCount]) => ({ targetRole, questionCount }))
      .sort((a, b) => a.targetRole.localeCompare(b.targetRole));

    return res.status(200).json({ success: true, companies, roles });
  } catch (error) {
    console.error("[mockInterview] getMockInterviewOptions:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load the available mock interviews",
    });
  }
};

/**
 * GET /api/mock-interview/session?company=&role=
 *
 * The candidate must never receive `modelAnswer` or `keyPoints` — they are the
 * answer sheet. They are excluded at the query level so they cannot leak.
 */
export const getMockInterviewSession = async (req, res) => {
  try {
    const { company, role } = req.query;

    if (!company?.trim() || !role?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Both company and role are required to start a session",
      });
    }

    const questions = await MockQuestion.find({
      isActive: true,
      companyName: exactCI(company),
      targetRole: exactCI(role),
    })
      .select("questionText category difficulty companyName targetRole")
      .sort({ createdAt: 1 })
      .lean();

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No published questions for that company and role yet",
      });
    }

    return res.status(200).json({
      success: true,
      companyName: questions[0].companyName,
      targetRole: questions[0].targetRole,
      totalQuestions: questions.length,
      questions: questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        category: q.category,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    console.error("[mockInterview] getMockInterviewSession:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load the interview session",
    });
  }
};

/**
 * POST /api/mock-interview/submit
 *
 * Body: { companyName, targetRole, answers: [{ questionId, response }], durationSeconds }
 *
 * Scoring happens here and only here. The client sends raw text; every number
 * in the response was computed server-side from the recruiter's key points.
 */
export const submitMockInterview = async (req, res) => {
  try {
    const { companyName, targetRole, answers, durationSeconds } = req.body;

    if (!companyName?.trim() || !targetRole?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name and target role are required",
      });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one answer is required",
      });
    }

    const ids = answers
      .map((a) => a?.questionId)
      .filter((id) => mongoose.isValidObjectId(id));

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid question ids were submitted",
      });
    }

    const questions = await MockQuestion.find({
      _id: { $in: ids },
      companyName: exactCI(companyName),
      targetRole: exactCI(targetRole),
    }).lean();

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Those questions no longer exist for this company and role",
      });
    }

    const byId = new Map(questions.map((q) => [String(q._id), q]));

    const graded = [];
    for (const submitted of answers) {
      const question = byId.get(String(submitted?.questionId));
      if (!question) continue; // Ignore ids that were deleted mid-session.

      const responseText =
        typeof submitted?.response === "string" ? submitted.response : "";

      const result = evaluateAnswer(
        responseText,
        question.keyPoints,
        question.modelAnswer
      );

      graded.push({
        questionId: question._id,
        questionText: question.questionText,
        category: question.category,
        difficulty: question.difficulty,
        response: responseText,
        score: result.score,
        matchedKeyPoints: result.matchedKeyPoints,
        missingKeyPoints: result.missingKeyPoints,
        feedback: result.feedback,
        tips: result.tips,
        modelAnswer: question.modelAnswer || "",
      });
    }

    if (graded.length === 0) {
      return res.status(400).json({
        success: false,
        message: "None of the submitted answers matched a live question",
      });
    }

    const overallScore = evaluateAttempt(graded);

    // Optional, additive only. A failure here cannot change a single score.
    const coachingNotes = await generateCoachingNotes(
      graded.map((g) => ({
        questionText: g.questionText,
        response: g.response,
        score: g.score,
        missingKeyPoints: g.missingKeyPoints,
      }))
    );
    if (coachingNotes) {
      graded.forEach((g, index) => {
        if (coachingNotes[index]) g.tips = [...g.tips, coachingNotes[index]];
      });
    }

    const duration = Number(durationSeconds);

    const attempt = await MockInterviewAttempt.create({
      candidateId: req.user.id,
      companyName: questions[0].companyName,
      targetRole: questions[0].targetRole,
      answers: graded.map((g) => ({
        questionId: g.questionId,
        questionText: g.questionText,
        response: g.response,
        score: g.score,
        matchedKeyPoints: g.matchedKeyPoints,
        missingKeyPoints: g.missingKeyPoints,
        feedback: g.feedback,
      })),
      overallScore,
      totalQuestions: graded.length,
      durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 0,
      completedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      attempt: {
        _id: attempt._id,
        companyName: attempt.companyName,
        targetRole: attempt.targetRole,
        overallScore: attempt.overallScore,
        totalQuestions: attempt.totalQuestions,
        durationSeconds: attempt.durationSeconds,
        completedAt: attempt.completedAt,
      },
      overallScore,
      // Full per-question feedback, including the model answer now that the
      // session is over and the candidate can no longer game it.
      results: graded,
    });
  } catch (error) {
    console.error("[mockInterview] submitMockInterview:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to score your interview",
    });
  }
};

/** GET /api/mock-interview/attempts */
export const getMockInterviewAttempts = async (req, res) => {
  try {
    const attempts = await MockInterviewAttempt.find({ candidateId: req.user.id })
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error("[mockInterview] getMockInterviewAttempts:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load your past attempts",
    });
  }
};

/**
 * GET /api/exam/results  (alias mounted at /api/exam)
 *
 * The Candidate Dashboard's "Exams taken" tile and average were reading a
 * route that did not exist, so they always rendered empty. Mock interview
 * attempts are the real assessment record, so they are projected into the
 * exam-result shape the dashboard already expects:
 *   { _id, title, category, score, total, passed, takenAt }
 */
export const getExamResults = async (req, res) => {
  try {
    const attempts = await MockInterviewAttempt.find({ candidateId: req.user.id })
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();

    const results = attempts.map((attempt) => ({
      _id: attempt._id,
      title: `${attempt.targetRole} mock interview`,
      category: attempt.companyName,
      score: attempt.overallScore,
      total: 100,
      passed: attempt.overallScore >= 60,
      takenAt: attempt.completedAt || attempt.createdAt,
    }));

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("[mockInterview] getExamResults:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load your exam results",
    });
  }
};
