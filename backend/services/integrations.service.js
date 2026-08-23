import axios from "axios";
import UserIntegrations from "../models/UserIntegrations.model.js";

/**
 * Fetch LeetCode data for a username
 */
export const fetchLeetCodeData = async (username) => {
  try {
    const query = `
      query {
        matchedUser(username: "${username}") {
          username
          profile {
            realName
            avatar
            ranking
            reputation
            userAvatar
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
            totalSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          contestBadges {
            name
            badge
          }
        }
      }
    `;

    const response = await axios.post("https://leetcode.com/graphql", { query }, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    const userData = response.data.data?.matchedUser;

    if (!userData) {
      return null;
    }

    // Parse submission stats
    const acSubmissions = userData.submitStats?.acSubmissionNum || [];
    let easy = 0,
      medium = 0,
      hard = 0,
      total = 0;

    acSubmissions.forEach((submission) => {
      total += submission.count;
      if (submission.difficulty === "Easy") easy = submission.count;
      if (submission.difficulty === "Medium") medium = submission.count;
      if (submission.difficulty === "Hard") hard = submission.count;
    });

    return {
      totalSolved: total,
      easy,
      medium,
      hard,
      rating: userData.profile?.reputation || 0,
      ranking: userData.profile?.ranking || 0,
      acceptanceRate: calculateAcceptanceRate(userData.submitStats),
    };
  } catch (error) {
    console.error("Error fetching LeetCode data:", error.message);
    return null;
  }
};

/**
 * Calculate acceptance rate from submission stats
 */
const calculateAcceptanceRate = (submitStats) => {
  try {
    if (!submitStats?.totalSubmissionNum) return 0;

    let totalSubs = 0,
      totalAC = 0;

    submitStats.totalSubmissionNum.forEach((sub) => {
      totalSubs += sub.submissions;
    });

    submitStats.acSubmissionNum?.forEach((sub) => {
      totalAC += sub.submissions;
    });

    return totalSubs > 0 ? Math.round((totalAC / totalSubs) * 100) / 100 : 0;
  } catch {
    return 0;
  }
};

/**
 * Sync LeetCode data for all connected users
 * Called by cron job nightly
 */
export const syncAllLeetCodeData = async () => {
  try {
    console.log("[LeetCode Sync] Starting nightly sync...");

    const integrations = await UserIntegrations.find({
      "leetcode.connected": true,
    });

    let syncedCount = 0;
    let failedCount = 0;

    for (const integration of integrations) {
      try {
        const username = integration.leetcode.username;
        const data = await fetchLeetCodeData(username);

        if (data) {
          integration.leetcode.data = data;
          integration.leetcode.lastSync = new Date();
          await integration.save();
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to sync ${integration.userId}:`, error.message);
        failedCount++;
      }
    }

    console.log(
      `[LeetCode Sync] Completed. Synced: ${syncedCount}, Failed: ${failedCount}`
    );
  } catch (error) {
    console.error("Error in LeetCode sync:", error.message);
  }
};

/**
 * Fetch GitHub data for a user
 */
export const fetchGitHubUserData = async (accessToken) => {
  try {
    // Fetch user info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Fetch repositories
    const reposResponse = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { sort: "stars", per_page: 10 },
    });

    const repos = reposResponse.data;
    const languageMap = {};
    const topRepos = [];

    // Calculate languages and get top repos
    for (const repo of repos.slice(0, 5)) {
      if (!repo.fork) {
        topRepos.push({
          name: repo.name,
          url: repo.html_url,
          description: repo.description || "",
          stars: repo.stargazers_count,
          language: repo.language || "Unknown",
        });

        if (repo.language) {
          languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
        }
      }
    }

    // Calculate language percentages
    const totalRepos = Object.values(languageMap).reduce((a, b) => a + b, 0);
    const languages = Object.entries(languageMap).map(([name, count]) => ({
      name,
      percentage: totalRepos > 0 ? Math.round((count / totalRepos) * 100) : 0,
      color: getLanguageColor(name),
    }));

    // Fetch commit history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let commits30Days = 0;
    try {
      const commitsResponse = await axios.get("https://api.github.com/user/events/public", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 100 },
      });

      const pushEvents = commitsResponse.data.filter((event) => event.type === "PushEvent");
      const recentCommits = pushEvents.filter(
        (event) => new Date(event.created_at) > thirtyDaysAgo
      );

      recentCommits.forEach((event) => {
        commits30Days += event.payload?.commits?.length || 0;
      });
    } catch (err) {
      console.log("Could not fetch commit data:", err.message);
    }

    return {
      username: githubUser.login,
      avatar: githubUser.avatar_url,
      profileUrl: githubUser.html_url,
      followers: githubUser.followers,
      following: githubUser.following,
      publicRepos: githubUser.public_repos,
      languages: languages.sort((a, b) => b.percentage - a.percentage),
      topRepos,
      commits: {
        total: 0,
        last30Days: commits30Days,
      },
    };
  } catch (error) {
    console.error("Error fetching GitHub data:", error.message);
    return null;
  }
};

/**
 * Get language color based on language name
 */
const getLanguageColor = (language) => {
  const colors = {
    JavaScript: "#F7DF1E",
    TypeScript: "#3178C6",
    Python: "#3776AB",
    Java: "#007396",
    "C++": "#00599C",
    "C#": "#239120",
    Go: "#00ADD8",
    Rust: "#CE422B",
    PHP: "#777BB4",
    Ruby: "#CC342D",
    Swift: "#FA7343",
    Kotlin: "#7F52FF",
    "HTML": "#E34C26",
    CSS: "#563D7C",
    SQL: "#336791",
    Shell: "#89E051",
  };

  return colors[language] || "#858585";
};

/**
 * Validate LinkedIn URL format
 */
export const isValidLinkedInUrl = (url) => {
  const linkedInRegex = /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/;
  return linkedInRegex.test(url);
};

/**
 * Get full candidate profile with integrations
 */
export const getCandidateFullProfile = async (userId) => {
  try {
    const integration = await UserIntegrations.findOne({ userId });

    return integration || {
      github: { connected: false },
      leetcode: { connected: false },
      linkedin: { connected: false },
    };
  } catch (error) {
    console.error("Error getting candidate profile:", error.message);
    return null;
  }
};
