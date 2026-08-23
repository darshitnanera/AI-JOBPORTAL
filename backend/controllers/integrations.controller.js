import axios from "axios";
import UserIntegrations from "../models/UserIntegrations.model.js";
import User from "../models/user.model.js";
import {
  fetchLeetCodeData,
  fetchGitHubUserData,
  isValidLinkedInUrl,
  getCandidateFullProfile,
} from "../services/integrations.service.js";

// ─── GitHub Integration ──────────────────────────────────────────────────────

export const initiateGitHubAuth = (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL}/api/integrations/github/callback`;
    const scope = "user:email,public_repo,read:user";

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ message: "Error initiating GitHub auth", error: error.message });
  }
};

export const handleGitHubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = req.user?.id;

    if (!code) {
      return res.status(400).json({ message: "No authorization code received" });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ message: "Failed to get access token" });
    }

    // Fetch GitHub user data
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Store integration
    let integration = await UserIntegrations.findOne({ userId });

    if (!integration) {
      integration = new UserIntegrations({ userId });
    }

    integration.github.connected = true;
    integration.github.username = githubUser.login;
    integration.github.accessToken = accessToken;
    integration.github.data.followers = githubUser.followers;
    integration.github.data.following = githubUser.following;
    integration.github.data.publicRepos = githubUser.public_repos;
    integration.github.data.profileUrl = githubUser.html_url;
    integration.github.data.avatar = githubUser.avatar_url;

    // Fetch repos and languages
    await fetchGitHubData(accessToken, integration);

    integration.github.lastSync = new Date();
    await integration.save();

    res.json({
      success: true,
      message: "GitHub connected successfully",
      integration: integration.github,
    });
  } catch (error) {
    console.error("GitHub callback error:", error);
    res.status(500).json({ message: "Error processing GitHub callback", error: error.message });
  }
};

const fetchGitHubData = async (accessToken, integration) => {
  try {
    // Fetch repositories
    const reposResponse = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { sort: "stars", per_page: 10 },
    });

    const repos = reposResponse.data;
    const languageMap = {};

    // Calculate languages and get top repos
    const topRepos = [];

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

    integration.github.data.topRepos = topRepos;
    integration.github.data.languages = languages.sort((a, b) => b.percentage - a.percentage);

    // Fetch commit history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const commitsResponse = await axios.get("https://api.github.com/user/events/public", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 100 },
      });

      const pushEvents = commitsResponse.data.filter((event) => event.type === "PushEvent");
      const recentCommits = pushEvents.filter(
        (event) => new Date(event.created_at) > thirtyDaysAgo
      );

      let totalCommits = 0;
      recentCommits.forEach((event) => {
        totalCommits += event.payload?.commits?.length || 0;
      });

      integration.github.data.commits.last30Days = totalCommits;
    } catch (err) {
      console.log("Could not fetch commit data:", err.message);
      integration.github.data.commits.last30Days = 0;
    }
  } catch (error) {
    console.error("Error fetching GitHub data:", error.message);
  }
};

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
  };

  return colors[language] || "#858585";
};

// ─── LeetCode Integration ────────────────────────────────────────────────────

export const connectLeetCode = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user?.id;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Verify username exists and fetch data
    const leetcodeData = await fetchLeetCodeData(username);

    if (!leetcodeData) {
      return res.status(404).json({ message: "LeetCode user not found" });
    }

    let integration = await UserIntegrations.findOne({ userId });

    if (!integration) {
      integration = new UserIntegrations({ userId });
    }

    integration.leetcode.connected = true;
    integration.leetcode.username = username;
    integration.leetcode.data = leetcodeData;
    integration.leetcode.lastSync = new Date();

    await integration.save();

    res.json({
      success: true,
      message: "LeetCode connected successfully",
      integration: integration.leetcode,
    });
  } catch (error) {
    console.error("LeetCode connection error:", error);
    res.status(500).json({ message: "Error connecting LeetCode", error: error.message });
  }
};


// ─── LinkedIn Integration ────────────────────────────────────────────────────

export const connectLinkedIn = async (req, res) => {
  try {
    const { profileUrl, headline } = req.body;
    const userId = req.user?.id;

    if (!profileUrl) {
      return res.status(400).json({ message: "LinkedIn profile URL is required" });
    }

    // Validate LinkedIn URL format
    if (!isValidLinkedInUrl(profileUrl)) {
      return res.status(400).json({ message: "Invalid LinkedIn profile URL format" });
    }

    let integration = await UserIntegrations.findOne({ userId });

    if (!integration) {
      integration = new UserIntegrations({ userId });
    }

    integration.linkedin.connected = true;
    integration.linkedin.profileUrl = profileUrl;
    integration.linkedin.headline = headline || "";
    integration.linkedin.profileVerified = true;

    await integration.save();

    res.json({
      success: true,
      message: "LinkedIn connected successfully",
      integration: integration.linkedin,
    });
  } catch (error) {
    res.status(500).json({ message: "Error connecting LinkedIn", error: error.message });
  }
};


// ─── Get All Integrations ───────────────────────────────────────────────────

export const getUserIntegrations = async (req, res) => {
  try {
    const userId = req.user?.id;

    let integration = await UserIntegrations.findOne({ userId });

    if (!integration) {
      integration = new UserIntegrations({ userId });
      await integration.save();
    }

    res.json({
      success: true,
      integration: {
        github: integration.github,
        leetcode: integration.leetcode,
        linkedin: integration.linkedin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching integrations", error: error.message });
  }
};

export const disconnectIntegration = async (req, res) => {
  try {
    const { platform } = req.body;
    const userId = req.user?.id;

    if (!["github", "leetcode", "linkedin"].includes(platform)) {
      return res.status(400).json({ message: "Invalid platform" });
    }

    let integration = await UserIntegrations.findOne({ userId });

    if (!integration) {
      return res.status(404).json({ message: "No integrations found" });
    }

    integration[platform].connected = false;
    integration[platform].accessToken = "";

    await integration.save();

    res.json({
      success: true,
      message: `${platform} disconnected successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error disconnecting integration", error: error.message });
  }
};

// ─── Sync LeetCode Data (for cron job) ───────────────────────────────────────

export const syncLeetCodeData = async (userId) => {
  try {
    const integration = await UserIntegrations.findOne({ userId });

    if (!integration || !integration.leetcode.connected) {
      return;
    }

    const username = integration.leetcode.username;
    const data = await fetchLeetCodeData(username);

    if (data) {
      integration.leetcode.data = data;
      integration.leetcode.lastSync = new Date();
      await integration.save();
    }
  } catch (error) {
    console.error("Error syncing LeetCode data:", error.message);
  }
};

// ─── Get Candidate Profile with Integrations ────────────────────────────────

export const getCandidateProfileWithIntegrations = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const user = await User.findById(candidateId);

    if (!user) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const integrations = await UserIntegrations.findOne({ userId: candidateId });

    res.json({
      success: true,
      candidate: {
        user,
        integrations: integrations || {
          github: { connected: false },
          leetcode: { connected: false },
          linkedin: { connected: false },
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};
