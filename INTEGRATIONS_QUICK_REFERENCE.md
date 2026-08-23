# Integrations Quick Reference

## File Locations

### Backend Models
- `backend/models/UserIntegrations.model.js` - Integration data schema

### Backend Routes & Controllers
- `backend/routes/integrations.routes.js` - API route definitions
- `backend/controllers/integrations.controller.js` - Route handlers

### Backend Services
- `backend/services/integrations.service.js` - Utility functions
- `backend/services/cronJobs.service.js` - Cron job setup

### Frontend Components
- `frontend/src/components/Integrations/IntegrationButtons.jsx` - Connection UI
- `frontend/src/components/Integrations/IntegrationDisplay.jsx` - Display UI

### Documentation
- `INTEGRATIONS_API.md` - Complete API reference
- `INTEGRATION_SETUP_GUIDE.md` - Setup instructions
- `PHASE_6_IMPLEMENTATION_SUMMARY.md` - Implementation overview

---

## API Endpoints (Quick Summary)

```bash
# Get integrations
GET /api/integrations/profile

# GitHub
GET /api/integrations/github/auth
GET /api/integrations/github/callback?code=...

# LeetCode
POST /api/integrations/leetcode/connect
Body: { "username": "leetcode_username" }

# LinkedIn
POST /api/integrations/linkedin/connect
Body: { "profileUrl": "https://linkedin.com/in/...", "headline": "..." }

# Disconnect
POST /api/integrations/disconnect
Body: { "platform": "github" | "leetcode" | "linkedin" }

# Recruiter View
GET /api/integrations/candidate/:candidateId
```

---

## Environment Variables

```env
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
BACKEND_URL=http://localhost:5000
```

---

## Component Usage

### IntegrationButtons
Shows connection buttons and handles all OAuth/form flows.

```jsx
import IntegrationButtons from './components/Integrations/IntegrationButtons';

export default function Profile() {
  return <IntegrationButtons />;
}
```

### IntegrationDisplay
Shows connected integration data in read-only format.

```jsx
import IntegrationDisplay from './components/Integrations/IntegrationDisplay';

export default function CandidateView({ integrations }) {
  return <IntegrationDisplay integrations={integrations} candidateName="John" />;
}
```

---

## GitHub OAuth Setup (3 Steps)

1. **Create OAuth App**
   - Go to github.com/settings/developers
   - Create "New OAuth App"
   - Set callback: `http://localhost:5000/api/integrations/github/callback`

2. **Copy Credentials**
   - Copy Client ID → `GITHUB_CLIENT_ID`
   - Copy Client Secret → `GITHUB_CLIENT_SECRET`

3. **Set Environment Variables**
   ```env
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   BACKEND_URL=http://localhost:5000
   ```

---

## Data Structure

### GitHub Data
```json
{
  "connected": true,
  "username": "john-doe",
  "data": {
    "languages": [{"name": "JavaScript", "percentage": 45, "color": "#F7DF1E"}],
    "topRepos": [{"name": "repo", "stars": 10, "language": "JavaScript"}],
    "commits": {"last30Days": 42},
    "followers": 25,
    "publicRepos": 12
  }
}
```

### LeetCode Data
```json
{
  "connected": true,
  "username": "leetcode-user",
  "data": {
    "totalSolved": 145,
    "easy": 50,
    "medium": 70,
    "hard": 25,
    "rating": 1850,
    "acceptanceRate": 62.5
  }
}
```

### LinkedIn Data
```json
{
  "connected": true,
  "profileUrl": "https://linkedin.com/in/john-doe",
  "headline": "Software Engineer"
}
```

---

## Testing

### Test GitHub
1. Click "Connect GitHub"
2. Authorize on GitHub
3. See languages, repos, stats

### Test LeetCode
1. Click "Connect LeetCode"
2. Enter username (e.g., "twq")
3. See problems solved, difficulty breakdown

### Test LinkedIn
1. Click "Connect LinkedIn"
2. Enter URL: `https://linkedin.com/in/your-profile`
3. See "View LinkedIn Profile" button

### Test Disconnect
1. Click any "Disconnect" button
2. Confirm removal
3. Data removed from display

---

## Nightly Sync

**What**: LeetCode data syncs automatically at 2:00 AM
**Where**: `backend/services/cronJobs.service.js`
**How to Change**: Edit cron pattern (see file for examples)
**How to Monitor**: Check server logs for "[Cron Job]" messages

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "GitHub callback failed" | Wrong callback URL | Update GitHub app settings |
| "Missing GITHUB_CLIENT_ID" | Environment variable not set | Add to `.env` |
| "LeetCode user not found" | Wrong username | Check spelling, verify public profile |
| "Invalid LinkedIn URL" | Wrong format | Use: `https://linkedin.com/in/...` |
| "No token provided" | Missing authorization header | Add `Authorization: Bearer <token>` |

---

## Key Functions

### integrations.service.js
- `fetchLeetCodeData(username)` - Get LeetCode stats
- `fetchGitHubUserData(accessToken)` - Get GitHub data
- `isValidLinkedInUrl(url)` - Validate URL format
- `syncAllLeetCodeData()` - Batch sync all users

### integrations.controller.js
- `initiateGitHubAuth()` - Start OAuth
- `handleGitHubCallback()` - Process OAuth callback
- `connectLeetCode()` - Save LeetCode username
- `connectLinkedIn()` - Save LinkedIn URL
- `getUserIntegrations()` - Get user's data
- `disconnectIntegration()` - Remove integration

---

## Component Props

### IntegrationDisplay
```jsx
<IntegrationDisplay 
  integrations={integrations}  // Integration data object
  candidateName="John Doe"     // Candidate name (optional)
/>
```

---

## Response Format (All Endpoints)

**Success:**
```json
{
  "success": true,
  "message": "...",
  "integration": { ... }
}
```

**Error:**
```json
{
  "message": "Error description",
  "error": "Detailed error"
}
```

---

## Database Model

**Collection**: `userintegrations`

**Key Fields**:
- `userId` - Reference to User
- `github.connected` - Boolean
- `leetcode.connected` - Boolean
- `linkedin.connected` - Boolean
- `*.lastSync` - Last update timestamp
- `*.data` - Actual integration data

---

## Security Notes

✅ GitHub tokens stored securely (server-side only)
✅ All inputs validated before API calls
✅ URLs validated with regex
✅ Token never exposed to frontend
✅ Recruiter access controlled via middleware
✅ Rate limiting recommended for production

---

## Mobile Responsive

Both components are fully mobile-responsive:
- Single column on mobile
- Full width buttons
- Touch-friendly modals
- Readable text sizing

---

## Performance

- GitHub data: Fetched on connect (one-time)
- LeetCode data: Fetched on connect + nightly sync
- LinkedIn data: URL only (no external calls)
- Database queries: Optimized with indexes on userId

---

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE: ⚠️ Not tested

---

## Dependencies Added

```json
"node-cron": "^3.0.3"
```

All other dependencies already in package.json.

---

## Deployment Checklist

- [ ] GitHub OAuth app created with production URLs
- [ ] Environment variables set in production
- [ ] HTTPS enabled (required for OAuth)
- [ ] CORS configured for production domains
- [ ] Components integrated into pages
- [ ] Tested all flows locally first
- [ ] Cron job monitoring set up
- [ ] Error tracking configured
- [ ] Documentation available to team

---

## One-Liner Setup

```bash
# 1. Install dependencies
npm install

# 2. Create GitHub OAuth app and get credentials
# 3. Update .env with credentials
# 4. Add IntegrationButtons to profile page
# 5. Add IntegrationDisplay to recruiter view
# 6. npm run dev
```

That's it! Ready to test.

---

## Need Help?

1. Check **INTEGRATIONS_API.md** for detailed endpoint docs
2. Check **INTEGRATION_SETUP_GUIDE.md** for setup steps
3. Check **PHASE_6_IMPLEMENTATION_SUMMARY.md** for overview
4. Check **inline comments** in source files
5. Check **error messages** in browser console / server logs
