# Phase 6: External Integrations Setup Guide

## Quick Start

This guide walks you through setting up GitHub, LeetCode, and LinkedIn integrations for the AI JobPortal.

---

## Table of Contents

1. [Backend Setup](#backend-setup)
2. [GitHub OAuth Setup](#github-oauth-setup)
3. [Frontend Integration](#frontend-integration)
4. [Testing the Integration](#testing-the-integration)
5. [Deployment Considerations](#deployment-considerations)

---

## Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

The backend now includes `node-cron` for scheduling LeetCode data sync. It should be installed automatically.

Verify by checking `backend/package.json` includes:
```json
"node-cron": "^3.0.3"
```

### Step 2: Environment Variables

Update your `.env` file (copy from `.env.example`):

```env
# Database & Authentication
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# GitHub OAuth Configuration (Required for GitHub integration)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
BACKEND_URL=http://localhost:5000

# Other existing variables...
```

### Step 3: Database Models

The integration uses a new `UserIntegrations` model created at:
```
backend/models/UserIntegrations.model.js
```

This model stores:
- GitHub: username, access token, languages, repos, followers, activity
- LeetCode: username, problem count, difficulty breakdown, rating
- LinkedIn: profile URL, headline

**No database migration needed** - MongoDB will auto-create the collection on first use.

### Step 4: Start Backend

```bash
npm run dev
```

You should see:
```
[Server] Started on port 5000
[WebSocket] Listening on /messages namespace
[Cron Jobs] Initialized. LeetCode sync scheduled for 2:00 AM daily
```

---

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers (GitHub Settings > Developer settings > OAuth Apps)
2. Click "New OAuth App"
3. Fill in the form:
   - **Application name**: `AI JobPortal` (or your app name)
   - **Homepage URL**: `http://localhost:5000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:5000/api/integrations/github/callback`
   - **Application description**: (optional)

4. Click "Register application"

5. You'll see:
   - **Client ID**: Copy this to `.env` as `GITHUB_CLIENT_ID`
   - **Client Secret**: Click "Generate a new client secret" and copy to `.env` as `GITHUB_CLIENT_SECRET`

### Step 2: Update Environment Variables

```env
GITHUB_CLIENT_ID=Ived1234567890abcdef
GITHUB_CLIENT_SECRET=ghp_1234567890abcdefghijklmnopqrstuvwxyz
BACKEND_URL=http://localhost:5000
```

### Step 3: Test the Flow

1. Start the backend: `npm run dev`
2. Frontend requests `/api/integrations/github/auth`
3. User is redirected to GitHub authorization page
4. After authorization, redirects to callback endpoint
5. Backend exchanges code for access token
6. GitHub data is fetched and stored in database

---

## Frontend Integration

### Step 1: Add Integrations Component to Profile Page

Find your candidate profile page (e.g., `frontend/src/pages/CandidateProfile.jsx`):

```jsx
import IntegrationButtons from '../components/Integrations/IntegrationButtons';

export default function CandidateProfile() {
  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      {/* ... other profile sections ... */}
      
      {/* Add this section for integrations */}
      <IntegrationButtons />
    </div>
  );
}
```

### Step 2: Display Integration Data in Recruiter View

In your recruiter's candidate view page:

```jsx
import IntegrationDisplay from '../components/Integrations/IntegrationDisplay';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function RecruiterCandidateView({ candidateId }) {
  const [candidate, setCandidates] = useState(null);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await axios.get(
          `/api/integrations/candidate/${candidateId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCandidates(response.data.candidate);
      } catch (error) {
        console.error('Error fetching candidate:', error);
      }
    };

    fetchCandidate();
  }, [candidateId, token]);

  if (!candidate) return <div>Loading...</div>;

  return (
    <div className="candidate-view">
      <h1>{candidate.user.name}</h1>
      {/* ... other candidate info ... */}
      
      {/* Display integrations */}
      <IntegrationDisplay 
        integrations={candidate.integrations}
        candidateName={candidate.user.name}
      />
    </div>
  );
}
```

### Step 3: Ensure Font Awesome is Included

Both IntegrationButtons and IntegrationDisplay use Font Awesome icons. Make sure your main HTML file includes:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

Or add to your Vite config for bundling.

---

## Testing the Integration

### Test GitHub Connection

1. **Navigate to Integration Section**
   - Go to candidate profile page
   - Scroll to "External Integrations" section

2. **Click "Connect GitHub"**
   - Should redirect to GitHub login
   - GitHub asks for authorization
   - Grants `user:email`, `public_repo`, `read:user` scopes

3. **Authorize and Return**
   - Should redirect back to profile
   - GitHub data should be fetched and displayed
   - Shows: languages, top repos, followers, public repos count, 30-day commits

4. **Verify Display**
   - GitHub Connected badge appears
   - Languages bar chart shows top programming languages
   - Featured repositories list shows top 3 repos
   - Stats show followers, public repos, 30-day commits

### Test LeetCode Connection

1. **Click "Connect LeetCode"**
   - Modal opens asking for LeetCode username
   - Enter a valid username (e.g., "twq", "lee215")

2. **Submit and Verify**
   - System fetches LeetCode stats via GraphQL API
   - If user not found, shows error message
   - If successful, displays: problems solved, difficulty breakdown, rating

3. **Verify Display**
   - LeetCode Verified badge appears
   - Shows total problems solved
   - Displays Easy/Medium/Hard breakdown with bars
   - Shows contest rating if available

### Test LinkedIn Connection

1. **Click "Connect LinkedIn"**
   - Modal opens asking for LinkedIn profile URL
   - Enter valid URL: `https://linkedin.com/in/your-profile`
   - Optionally add headline

2. **Submit and Verify**
   - URL format is validated
   - If invalid format, shows error
   - If valid, saves profile URL

3. **Verify Display**
   - LinkedIn Connected badge appears
   - Shows "View LinkedIn Profile" button
   - Headline displayed (if provided)

### Test Disconnect

1. **Click "Disconnect" button**
   - Confirmation dialog appears
   - After confirmation, integration is removed
   - Data no longer displayed
   - Button changes back to "Connect"

---

## Nightly LeetCode Sync

The system includes automatic LeetCode data sync:

### How It Works

1. **Cron Job Schedule**: Daily at 2:00 AM
2. **Function**: `syncAllLeetCodeData()` in `services/integrations.service.js`
3. **Process**:
   - Finds all users with connected LeetCode accounts
   - Fetches latest data from LeetCode GraphQL API
   - Updates `lastSync` timestamp
   - Keeps data fresh for recruiters

### Checking Cron Job Status

1. **Server Logs**
   ```
   [Cron Job] Starting nightly LeetCode data sync at ...
   [Cron Job] LeetCode data sync completed successfully
   ```

2. **Database**
   - Check `UserIntegrations` collection
   - Verify `leetcode.lastSync` is recent

### Customizing Schedule

Edit `backend/services/cronJobs.service.js`:

```javascript
// Default: 2:00 AM
cron.schedule("0 2 * * *", async () => {

// Change to 3:00 AM
cron.schedule("0 3 * * *", async () => {

// Run every 6 hours
cron.schedule("0 */6 * * *", async () => {

// Run every day at noon
cron.schedule("0 12 * * *", async () => {
```

---

## API Reference

### User-Facing Endpoints

#### Get User's Integrations
```bash
GET /api/integrations/profile
Authorization: Bearer <token>
```

#### Initiate GitHub OAuth
```bash
GET /api/integrations/github/auth
Authorization: Bearer <token>
```

#### Connect LeetCode
```bash
POST /api/integrations/leetcode/connect
Authorization: Bearer <token>
Content-Type: application/json

{ "username": "leetcode-username" }
```

#### Connect LinkedIn
```bash
POST /api/integrations/linkedin/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "profileUrl": "https://linkedin.com/in/john-doe",
  "headline": "Software Engineer"
}
```

#### Disconnect Integration
```bash
POST /api/integrations/disconnect
Authorization: Bearer <token>
Content-Type: application/json

{ "platform": "github" }  // or "leetcode" or "linkedin"
```

### Recruiter Endpoints

#### Get Candidate Profile with Integrations
```bash
GET /api/integrations/candidate/:candidateId
Authorization: Bearer <token>
```

---

## Deployment Considerations

### Production Setup

#### 1. Update GitHub OAuth URLs

1. Go to your GitHub OAuth app settings
2. Update:
   - **Homepage URL**: Your production domain (e.g., `https://jobportal.com`)
   - **Authorization callback URL**: `https://jobportal.com/api/integrations/github/callback`

#### 2. Update Environment Variables

```env
# Production GitHub OAuth
GITHUB_CLIENT_ID=your_prod_client_id
GITHUB_CLIENT_SECRET=your_prod_client_secret
BACKEND_URL=https://your-backend-domain.com
```

#### 3. Frontend URL Configuration

Ensure frontend requests are sent to production backend:
```javascript
// Use environment-specific API base URL
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.jobportal.com';
```

#### 4. CORS Configuration

Update `backend/server.js` CORS settings for production:
```javascript
const ALLOWED_ORIGINS = [
  "https://jobportal.com",
  "https://www.jobportal.com",
  "https://your-production-domain.com"
];
```

#### 5. Enable HTTPS

All OAuth flows require HTTPS in production. Use:
- Let's Encrypt (free SSL certificates)
- Cloudflare SSL
- AWS Certificate Manager

#### 6. Monitor Cron Jobs

In production, monitor the cron job execution:
- Check server logs for `[Cron Job]` messages
- Set up log aggregation (e.g., ELK, Datadog)
- Create alerts for failed syncs

#### 7. Rate Limiting

Consider implementing rate limits for API calls:
```javascript
// Use express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/integrations/', limiter);
```

#### 8. Error Monitoring

Set up error tracking (Sentry, LogRocket):
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## Troubleshooting

### GitHub OAuth Issues

**Problem**: Redirect fails with "redirect_uri_mismatch"
- **Solution**: Verify callback URL in GitHub app settings matches `BACKEND_URL + /api/integrations/github/callback`

**Problem**: "Client ID and Client Secret are required"
- **Solution**: Check `.env` file has `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### LeetCode API Issues

**Problem**: "LeetCode user not found"
- **Solution**: 
  - Verify username spelling (case-sensitive)
  - Check user profile is public on LeetCode

**Problem**: GraphQL API timeout
- **Solution**: 
  - LeetCode API might be slow, retry after 5 seconds
  - Check network connectivity

### Frontend Issues

**Problem**: Integration buttons don't show
- **Solution**:
  - Check Font Awesome is loaded
  - Verify component import path
  - Check browser console for errors

**Problem**: Authorization token expired
- **Solution**:
  - Refresh token and retry
  - Implement token refresh mechanism

---

## File Structure

```
AI-JOBPORTAL/
├── backend/
│   ├── models/
│   │   └── UserIntegrations.model.js       # New: Integration data model
│   ├── controllers/
│   │   └── integrations.controller.js      # New: Integration endpoints
│   ├── routes/
│   │   └── integrations.routes.js          # New: Integration routes
│   ├── services/
│   │   ├── integrations.service.js         # New: Shared functions
│   │   └── cronJobs.service.js             # New: Cron job setup
│   ├── server.js                           # Modified: Added integrations route
│   ├── package.json                        # Modified: Added node-cron
│   └── .env.example                        # Modified: Added GitHub OAuth vars
│
├── frontend/
│   └── src/
│       └── components/
│           └── Integrations/               # New: Integration components
│               ├── IntegrationButtons.jsx
│               ├── IntegrationButtons.css
│               ├── IntegrationDisplay.jsx
│               └── IntegrationDisplay.css
│
├── INTEGRATIONS_API.md                     # New: Complete API documentation
└── INTEGRATION_SETUP_GUIDE.md              # New: This file
```

---

## Security Best Practices

1. **GitHub Access Token**
   - Stored in database (one-way, for API calls)
   - Never exposed to frontend
   - Consider token rotation/refresh

2. **Data Privacy**
   - Only show user's own integration data by default
   - Recruiters see integrations only when authorized
   - Implement data access logging

3. **Input Validation**
   - LinkedIn URLs validated with regex
   - LeetCode usernames sanitized before API calls
   - All inputs checked server-side

4. **Rate Limiting**
   - Implement rate limits on integration endpoints
   - Prevent abuse of GitHub/LeetCode APIs

5. **Environment Variables**
   - Never commit `.env` file
   - Use `.env.example` for reference
   - Rotate secrets regularly

---

## Next Steps

1. **Complete GitHub OAuth Setup** (if using GitHub integration)
2. **Test All Integrations Locally**
3. **Update Candidate Profile Page** to include IntegrationButtons
4. **Update Recruiter View** to include IntegrationDisplay
5. **Deploy to Staging** and test end-to-end
6. **Deploy to Production**
7. **Monitor Logs** for integration sync status
8. **Gather User Feedback** and iterate

---

## Support & Issues

For issues or questions:
1. Check browser console for error messages
2. Review server logs for backend errors
3. Verify all environment variables are set
4. Check API response in Network tab (DevTools)
5. Refer to INTEGRATIONS_API.md for detailed endpoint documentation

---

## Version History

- **v1.0** (2024-08-22): Initial release
  - GitHub OAuth integration
  - LeetCode username connection with GraphQL API
  - LinkedIn profile URL linking
  - Nightly LeetCode sync via cron job
  - Frontend components for connection and display
