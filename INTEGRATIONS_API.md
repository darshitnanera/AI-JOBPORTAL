# External Integrations API Documentation

## Overview

The Integrations system allows candidates to connect their GitHub, LeetCode, and LinkedIn profiles to their AI JobPortal candidate profile. Recruiters can then view these verified credentials when reviewing candidate profiles.

## Features

### GitHub Integration
- OAuth2-based connection
- Fetches: programming languages, top repositories, followers, following, public repos count, commits (last 30 days)
- Automatic data fetching on connection
- Display: Languages bar chart, Featured repositories, Activity summary
- Verification badge: "GitHub Connected"

### LeetCode Integration
- Username-based connection via GraphQL API
- Fetches: total problems solved, Easy/Medium/Hard breakdown, contest rating, acceptance rate
- Nightly sync via cron job to keep data fresh
- Display: Problem count cards, Difficulty breakdown, Rating badge
- Verification badge: "LeetCode Verified"

### LinkedIn Integration
- Profile URL-based connection (no OAuth)
- Accepts: LinkedIn profile URL and optional headline
- Display: LinkedIn profile link and headline
- Verification badge: "LinkedIn Connected"

---

## API Endpoints

### GitHub Integration

#### 1. Initiate GitHub OAuth Flow
```
GET /api/integrations/github/auth
Authorization: Bearer <token>
```

**Response:**
```json
{
  "authUrl": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=..."
}
```

**Frontend Implementation:**
```javascript
// Get auth URL
const response = await axios.get('/api/integrations/github/auth', {
  headers: { Authorization: `Bearer ${token}` }
});

// Redirect user to GitHub authorization
window.location.href = response.data.authUrl;
```

#### 2. Handle GitHub OAuth Callback
```
GET /api/integrations/github/callback?code=<code>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "GitHub connected successfully",
  "integration": {
    "connected": true,
    "username": "github-username",
    "lastSync": "2024-08-22T10:30:00Z",
    "data": {
      "languages": [
        { "name": "JavaScript", "percentage": 45, "color": "#F7DF1E" },
        { "name": "TypeScript", "percentage": 30, "color": "#3178C6" }
      ],
      "topRepos": [
        {
          "name": "awesome-project",
          "url": "https://github.com/user/awesome-project",
          "description": "An awesome project",
          "stars": 150,
          "language": "JavaScript"
        }
      ],
      "commits": { "total": 0, "last30Days": 42 },
      "followers": 25,
      "following": 30,
      "publicRepos": 12,
      "profileUrl": "https://github.com/username",
      "avatar": "https://avatars.githubusercontent.com/u/123456"
    }
  }
}
```

---

### LeetCode Integration

#### 3. Connect LeetCode Account
```
POST /api/integrations/leetcode/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "leetcode-username"
}
```

**Response:**
```json
{
  "success": true,
  "message": "LeetCode connected successfully",
  "integration": {
    "connected": true,
    "username": "leetcode-username",
    "lastSync": "2024-08-22T10:30:00Z",
    "data": {
      "totalSolved": 145,
      "easy": 50,
      "medium": 70,
      "hard": 25,
      "rating": 1850,
      "ranking": 45230,
      "acceptanceRate": 62.5
    }
  }
}
```

**Error Response (User Not Found):**
```json
{
  "message": "LeetCode user not found"
}
```

**Frontend Implementation:**
```javascript
try {
  const response = await axios.post(
    '/api/integrations/leetcode/connect',
    { username: 'leetcode-username' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Connected:', response.data.integration);
} catch (error) {
  console.error('Error:', error.response.data.message);
}
```

---

### LinkedIn Integration

#### 4. Connect LinkedIn Profile
```
POST /api/integrations/linkedin/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "profileUrl": "https://linkedin.com/in/john-doe",
  "headline": "Software Engineer at Tech Company"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "LinkedIn connected successfully",
  "integration": {
    "connected": true,
    "profileUrl": "https://linkedin.com/in/john-doe",
    "headline": "Software Engineer at Tech Company",
    "profileVerified": true
  }
}
```

**LinkedIn URL Format Validation:**
- Valid: `https://linkedin.com/in/john-doe` or `https://www.linkedin.com/in/john-doe`
- Valid: `https://linkedin.com/company/tech-company` or `https://www.linkedin.com/company/tech-company`
- Invalid: `linkedin.com/in/john-doe` (missing https://)
- Invalid: `https://linkedin.com/john-doe` (missing /in/ or /company/)

---

### General Integration Endpoints

#### 5. Get All User Integrations
```
GET /api/integrations/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "integration": {
    "github": {
      "connected": true,
      "username": "john-doe",
      "lastSync": "2024-08-22T10:30:00Z",
      "data": { ... }
    },
    "leetcode": {
      "connected": true,
      "username": "johndoe",
      "lastSync": "2024-08-22T09:15:00Z",
      "data": { ... }
    },
    "linkedin": {
      "connected": true,
      "profileUrl": "https://linkedin.com/in/john-doe",
      "headline": "Software Engineer"
    }
  }
}
```

#### 6. Disconnect an Integration
```
POST /api/integrations/disconnect
Authorization: Bearer <token>
Content-Type: application/json

{
  "platform": "github"  // or "leetcode" or "linkedin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "github disconnected successfully"
}
```

---

### Recruiter-Specific Endpoints

#### 7. Get Candidate Profile with Integrations
```
GET /api/integrations/candidate/:candidateId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "candidate": {
    "user": { ... user data ... },
    "integrations": {
      "github": { ... github data ... },
      "leetcode": { ... leetcode data ... },
      "linkedin": { ... linkedin data ... }
    }
  }
}
```

---

## Environment Variables

Add these to your `.env` file:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
BACKEND_URL=http://localhost:5000  # or your production URL
```

### Setting up GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:5000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:5000/api/integrations/github/callback`
4. Copy the Client ID and Client Secret to your `.env` file

---

## Frontend Components

### IntegrationButtons Component
Located at: `frontend/src/components/Integrations/IntegrationButtons.jsx`

Shows connection buttons for all three platforms. Handles:
- GitHub OAuth flow
- LeetCode username input modal
- LinkedIn URL input modal
- Disconnection with confirmation
- Error handling and loading states

**Usage:**
```jsx
import IntegrationButtons from './components/Integrations/IntegrationButtons';

export default function ProfilePage() {
  return (
    <div>
      <h1>My Profile</h1>
      <IntegrationButtons />
    </div>
  );
}
```

### IntegrationDisplay Component
Located at: `frontend/src/components/Integrations/IntegrationDisplay.jsx`

Displays connected integrations in candidate/recruiter profiles. Shows:
- GitHub: Languages chart, Featured repos, Stats (followers, public repos, commits)
- LeetCode: Problem count, Difficulty breakdown, Rating, Acceptance rate
- LinkedIn: Profile headline and link

**Usage:**
```jsx
import IntegrationDisplay from './components/Integrations/IntegrationDisplay';

export default function CandidateProfile({ integrations }) {
  return (
    <div>
      <h1>Candidate Profile</h1>
      <IntegrationDisplay integrations={integrations} candidateName="John Doe" />
    </div>
  );
}
```

---

## Backend Services

### integrations.service.js
Core service functions for integration operations:
- `fetchLeetCodeData(username)` - Fetch LeetCode user data via GraphQL
- `fetchGitHubUserData(accessToken)` - Fetch GitHub user data with repos and languages
- `isValidLinkedInUrl(url)` - Validate LinkedIn URL format
- `syncAllLeetCodeData()` - Sync all connected LeetCode users (called by cron job)
- `getCandidateFullProfile(userId)` - Get complete profile with all integrations

### cronJobs.service.js
Cron job setup for automated tasks:
- LeetCode nightly sync at 2:00 AM
- Can be extended for other scheduled tasks

---

## Nightly LeetCode Sync

The system includes a nightly cron job that syncs LeetCode data for all connected users.

### Setup in server.js

```javascript
import { initializeCronJobs } from "./services/cronJobs.service.js";

// After database connection
connectDB();
setupSocketManager(io);
initializeCronJobs();  // Initialize cron jobs
```

### Cron Schedule
- **Time**: 2:00 AM daily
- **Timezone**: Server timezone
- **Function**: Updates all connected users' LeetCode statistics

### Customizing Schedule
Edit `backend/services/cronJobs.service.js` to change the schedule:

```javascript
// Change to run at 3:00 AM instead
cron.schedule("0 3 * * *", async () => {
  // ...
});

// Or run every 6 hours
cron.schedule("0 */6 * * *", async () => {
  // ...
});
```

---

## Data Models

### UserIntegrations Schema
```javascript
{
  userId: ObjectId,  // Reference to User
  github: {
    connected: Boolean,
    username: String,
    accessToken: String,
    lastSync: Date,
    data: {
      languages: Array,
      topRepos: Array,
      commits: { total: Number, last30Days: Number },
      followers: Number,
      following: Number,
      publicRepos: Number,
      profileUrl: String,
      avatar: String
    }
  },
  leetcode: {
    connected: Boolean,
    username: String,
    lastSync: Date,
    data: {
      totalSolved: Number,
      easy: Number,
      medium: Number,
      hard: Number,
      rating: Number,
      ranking: Number,
      acceptanceRate: Number
    }
  },
  linkedin: {
    connected: Boolean,
    profileUrl: String,
    headline: String,
    profileVerified: Boolean
  }
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **400**: Bad request (missing/invalid parameters)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not found (user/resource doesn't exist)
- **500**: Server error

Example error response:
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## Security Considerations

1. **GitHub Access Token**: Stored securely in database, only used server-side
2. **Token Expiration**: Implement token refresh logic if tokens expire
3. **Data Privacy**: Only display user's own data, with recruiter access control
4. **API Rate Limiting**: Consider implementing rate limits for API calls
5. **Validation**: All URLs and inputs are validated before processing

---

## Testing the Integration

### Test GitHub Connection
1. Create a GitHub OAuth app
2. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`
3. Click "Connect GitHub" button
4. Authorize the app on GitHub
5. Should redirect back and display GitHub data

### Test LeetCode Connection
1. Go to IntegrationButtons component
2. Click "Connect LeetCode"
3. Enter a valid LeetCode username (e.g., "twq")
4. Should fetch and display LeetCode stats

### Test LinkedIn Connection
1. Go to IntegrationButtons component
2. Click "Connect LinkedIn"
3. Enter a valid LinkedIn profile URL
4. Should save and display LinkedIn info

---

## Troubleshooting

### GitHub OAuth Redirect Error
- Ensure `BACKEND_URL` matches your callback URL in GitHub app settings
- Check that Client ID and Secret are correct
- Verify CORS settings allow GitHub origin

### LeetCode Data Not Found
- Verify username is spelled correctly (case-sensitive)
- Check if user profile is public on LeetCode
- Check browser console for GraphQL errors

### Cron Job Not Running
- Ensure `node-cron` is installed: `npm install node-cron`
- Check server logs for initialization message
- Verify `initializeCronJobs()` is called after database connection

---

## Future Enhancements

- [ ] GitHub OAuth token refresh
- [ ] Automatic GitHub data sync (not just on connection)
- [ ] Real-time LeetCode updates via webhooks
- [ ] LinkedIn profile public data fetching
- [ ] Integration analytics dashboard
- [ ] Skill matching based on GitHub languages
- [ ] Difficulty-based job recommendations (LeetCode)
- [ ] Social profile verification badges
