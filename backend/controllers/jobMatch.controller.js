import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import JobMatch from "../models/jobMatch.model.js";
import JobRecommendation from "../models/jobRecommendation.model.js";
import { calculateJobMatch } from "../services/jobMatcher.service.js";
import { analyzeSkillGaps, createLearningPath } from "../services/skillGapAnalyzer.service.js";

/**
 * True only when the candidate has resume content we can actually match on.
 *
 * `parsedResume` is declared as a nested object in the schema, so Mongoose
 * always materialises it as `{}` — it is ALWAYS truthy. Testing
 * `!candidate.parsedResume` therefore never caught the "no resume yet" case,
 * and the matcher scored every job against empty data, returning a flat
 * meaningless 10% to every candidate who had not uploaded anything.
 */
function hasUsableResume(candidate) {
  const r = candidate?.parsedResume;
  if (!r) return false;
  const len = (v) => (Array.isArray(v) ? v.length : 0);
  return (
    len(r.skills) > 0 ||
    len(r.experience) > 0 ||
    len(r.education) > 0 ||
    len(r.projects) > 0 ||
    Boolean(r.rawText && String(r.rawText).trim())
  );
}

/**
 * Search jobs with AI match scores for the logged-in candidate
 * GET /api/job-match/search?query=...
 */
export async function searchJobsWithMatch(req, res) {
  try {
    const candidateId = req.user._id;
    const { query, limit = 20, skip = 0 } = req.query;

    // Get candidate's parsed resume
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    // A candidate who has not uploaded a resume yet is a normal state, not a
    // client error. Returning 400 here made every new candidate's Jobs page
    // log a failed request. Answer 200 with no scores and let the caller
    // decide how to prompt.
    if (!hasUsableResume(candidate)) {
      return res.status(200).json({
        success: true,
        resumeRequired: true,
        message: "Upload and parse a resume to see match scores",
        jobs: [],
        count: 0,
      });
    }

    // Find jobs matching the query
    const searchFilter = query
      ? {
          $or: [
            { roleName: { $regex: query, $options: "i" } },
            { companyName: { $regex: query, $options: "i" } },
            { techStack: { $regex: query, $options: "i" } },
            { jobCriteria: { $regex: query, $options: "i" } },
          ],
          status: "active",
        }
      : { status: "active" };

    const jobs = await Job.find(searchFilter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ postDate: -1 });

    // Calculate match scores for each job
    const jobsWithMatches = await Promise.all(
      jobs.map(async (job) => {
        try {
          const match = await calculateJobMatch(candidate.parsedResume, job);

          // Store or update match in database
          await JobMatch.findOneAndUpdate(
            { candidateId, jobId: job._id },
            {
              matchScore: match.matchScore,
              matchDetails: match,
            },
            { upsert: true }
          );

          return {
            ...job.toObject(),
            matchScore: match.matchScore,
            matchDetails: match,
          };
        } catch (error) {
          console.error(`Error calculating match for job ${job._id}:`, error);
          return {
            ...job.toObject(),
            matchScore: 0,
            matchDetails: null,
            error: error.message,
          };
        }
      })
    );

    // Sort by match score
    jobsWithMatches.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      count: jobsWithMatches.length,
      jobs: jobsWithMatches,
    });
  } catch (error) {
    console.error("Error searching jobs with match:", error);
    res.status(500).json({
      success: false,
      message: "Error searching jobs",
      error: error.message,
    });
  }
}

/**
 * Get match details for a specific job
 * GET /api/job-match/:jobId/match
 */
export async function getJobMatch(req, res) {
  try {
    const candidateId = req.user._id;
    const { jobId } = req.params;

    // Get candidate and job data
    const candidate = await User.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      return res.status(404).json({
        success: false,
        message: "Candidate or job not found",
      });
    }

    // As above: no resume yet is a normal state. `match` is omitted so the
    // caller renders no score rather than a misleading zero.
    if (!hasUsableResume(candidate)) {
      return res.status(200).json({
        success: true,
        resumeRequired: true,
        message: "Upload and parse a resume to see your match for this role",
        match: null,
      });
    }

    // Calculate match
    const matchResult = calculateJobMatch(candidate.parsedResume, job);

    // Analyze skill gaps
    const skillGaps = analyzeSkillGaps(matchResult, job);

    // Create learning path for missing skills
    const learningPath = createLearningPath(
      skillGaps.missingSkills.map(s => s.name),
      job.overview
    );

    // Store match in database
    await JobMatch.findOneAndUpdate(
      { candidateId, jobId },
      {
        matchScore: matchResult.matchScore,
        matchDetails: matchResult,
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      match: {
        score: matchResult.matchScore,
        details: matchResult,
        skillGaps,
        learningPath,
      },
    });
  } catch (error) {
    console.error("Error getting job match:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating job match",
      error: error.message,
    });
  }
}

/**
 * Get personalized job recommendations for candidate
 * GET /api/job-match/recommendations
 */
export async function getRecommendations(req, res) {
  try {
    const candidateId = req.user._id;
    const { limit = 10 } = req.query;

    // Find top recommendations
    const recommendations = await JobRecommendation.find({
      candidateId,
      status: "pending",
    })
      .populate("jobId")
      .sort({ matchScore: -1 })
      .limit(parseInt(limit));

    // Format response
    const formattedRecommendations = recommendations.map((rec) => ({
      id: rec._id,
      jobId: rec.jobId._id,
      job: rec.jobId,
      matchScore: rec.matchScore,
      reason: rec.reason,
      recommendedAt: rec.recommendedAt,
    }));

    res.status(200).json({
      success: true,
      recommendations: formattedRecommendations,
      count: formattedRecommendations.length,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
      error: error.message,
    });
  }
}

/**
 * Batch match jobs for a candidate (for nightly cron job)
 * POST /api/job-match/batch-match
 * Internal endpoint for scheduled matching
 */
export async function batchMatchJobs(req, res) {
  try {
    const { candidateId, matchThreshold = 50 } = req.body;

    // Get candidate
    const candidate = await User.findById(candidateId);
    if (!candidate || !hasUsableResume(candidate)) {
      return res.status(400).json({
        success: false,
        message: "Candidate or parsed resume not found",
      });
    }

    // Get all active jobs
    const jobs = await Job.find({ status: "active" });

    // Calculate matches
    const matches = [];
    const recommendations = [];

    for (const job of jobs) {
      try {
        const match = calculateJobMatch(candidate.parsedResume, job);

        if (match.matchScore >= matchThreshold) {
          // Store match
          const storedMatch = await JobMatch.findOneAndUpdate(
            { candidateId, jobId: job._id },
            {
              matchScore: match.matchScore,
              matchDetails: match,
            },
            { upsert: true, new: true }
          );

          matches.push(storedMatch);

          // Create recommendation if not already exists
          const existingRec = await JobRecommendation.findOne({
            candidateId,
            jobId: job._id,
          });

          if (!existingRec) {
            const rec = await JobRecommendation.create({
              candidateId,
              jobId: job._id,
              matchScore: match.matchScore,
              reason: match.explanation,
            });
            recommendations.push(rec);
          }
        }
      } catch (error) {
        console.error(`Error matching job ${job._id}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Matched ${matches.length} jobs, created ${recommendations.length} recommendations`,
      matchesCount: matches.length,
      recommendationsCount: recommendations.length,
    });
  } catch (error) {
    console.error("Error batch matching jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error batch matching jobs",
      error: error.message,
    });
  }
}

/**
 * Batch match all candidates (for nightly cron job)
 * POST /api/job-match/batch-match-all
 * Internal endpoint for scheduled matching
 */
export async function batchMatchAllCandidates(req, res) {
  try {
    // Get all candidates with parsed resumes
    const candidates = await User.find({
      userType: "candidate",
      "parsedResume.skills": { $exists: true, $ne: [] },
    });

    // Get all active jobs
    const jobs = await Job.find({ status: "active" });

    let totalMatches = 0;
    let totalRecommendations = 0;

    for (const candidate of candidates) {
      for (const job of jobs) {
        try {
          const match = calculateJobMatch(candidate.parsedResume, job);

          // Store match only if score >= 40
          if (match.matchScore >= 40) {
            await JobMatch.findOneAndUpdate(
              { candidateId: candidate._id, jobId: job._id },
              {
                matchScore: match.matchScore,
                matchDetails: match,
              },
              { upsert: true }
            );
            totalMatches++;

            // Create recommendation if not already exists and score >= 50
            if (match.matchScore >= 50) {
              const existingRec = await JobRecommendation.findOne({
                candidateId: candidate._id,
                jobId: job._id,
                status: "pending",
              });

              if (!existingRec) {
                await JobRecommendation.create({
                  candidateId: candidate._id,
                  jobId: job._id,
                  matchScore: match.matchScore,
                  reason: match.explanation,
                });
                totalRecommendations++;
              }
            }
          }
        } catch (error) {
          console.error(
            `Error matching candidate ${candidate._id} with job ${job._id}:`,
            error
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${candidates.length} candidates`,
      stats: {
        candidatesProcessed: candidates.length,
        jobsMatched: totalMatches,
        recommendationsCreated: totalRecommendations,
      },
    });
  } catch (error) {
    console.error("Error batch matching all candidates:", error);
    res.status(500).json({
      success: false,
      message: "Error batch matching all candidates",
      error: error.message,
    });
  }
}

/**
 * Mark recommendation as viewed
 * PATCH /api/job-match/recommendations/:recId/view
 */
export async function markRecommendationViewed(req, res) {
  try {
    const { recId } = req.params;
    const candidateId = req.user._id;

    const recommendation = await JobRecommendation.findOneAndUpdate(
      { _id: recId, candidateId },
      {
        status: "viewed",
        viewedAt: new Date(),
      },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    res.status(200).json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error("Error marking recommendation as viewed:", error);
    res.status(500).json({
      success: false,
      message: "Error updating recommendation",
      error: error.message,
    });
  }
}

/**
 * Reject a recommendation
 * PATCH /api/job-match/recommendations/:recId/reject
 */
export async function rejectRecommendation(req, res) {
  try {
    const { recId } = req.params;
    const candidateId = req.user._id;

    const recommendation = await JobRecommendation.findOneAndUpdate(
      { _id: recId, candidateId },
      {
        status: "rejected",
        rejectedAt: new Date(),
      },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    res.status(200).json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error("Error rejecting recommendation:", error);
    res.status(500).json({
      success: false,
      message: "Error updating recommendation",
      error: error.message,
    });
  }
}
