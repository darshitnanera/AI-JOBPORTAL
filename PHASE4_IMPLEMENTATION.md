# PHASE 4: AI Job Matching & Scoring System Implementation

## Overview

This document describes the complete implementation of the AI Job Matching system for the QDC Job Portal. The system intelligently matches candidates with suitable jobs based on skills, experience, education, and certifications.

## Architecture

### Backend Services

#### 1. **jobMatcher.service.js**
Core matching algorithm that calculates job-candidate compatibility.

**Key Functions:**
- `calculateJobMatch(candidateData, jobData)` - Main matching function
- `generateLearningRecommendations(missingSkills, severity)` - Learning path generator

**Algorithm Weights:**
- Required skills match: 40%
- Experience level match: 30%
- Education relevance: 20%
- Additional skills bonus: 10%

**Output:** Match score (0-100), matching skills, missing skills, explanation

#### 2. **skillGapAnalyzer.service.js**
Detailed analysis of skill gaps and learning recommendations.

**Key Functions:**
- `analyzeSkillGaps(matchResult, jobData)` - Complete gap analysis
- `createLearningPath(missingSkills, jobDescription)` - Personalized learning path

**Features:**
- Skill categorization by difficulty
- Grouped skill gaps by category
- Learning timeline with phases
- Action items prioritized by importance

### Backend Models

#### 1. **jobMatch.model.js**
Stores matching results for candidate-job pairs.

```javascript
{
  candidateId: ObjectId,
  jobId: ObjectId,
  matchScore: Number (0-100),
  matchDetails: {
    skillMatch: {...},
    experienceMatch: {...},
    educationMatch: {...},
    explanation: String
  },
  lastUpdated: Date
}
```

#### 2. **jobRecommendation.model.js**
Stores personalized job recommendations for candidates.

```javascript
{
  candidateId: ObjectId,
  jobId: ObjectId,
  matchScore: Number,
  reason: String,
  status: "pending" | "viewed" | "applied" | "rejected" | "expired",
  recommendedAt: Date
}
```

### Backend Controllers & Routes

#### **jobMatch.controller.js**
Handles all job matching API endpoints.

**Endpoints:**

1. **GET /api/job-match/search?query=...&limit=20&skip=0**
   - Search jobs with AI match scores
   - Requires authentication (candidate)
   - Returns jobs sorted by match score

2. **GET /api/job-match/:jobId/match**
   - Get detailed match information for a job
   - Includes skill gaps and learning path
   - Requires authentication (candidate)

3. **GET /api/job-match/recommendations**
   - Get personalized recommendations for candidate
   - Returns top matching jobs with pending status
   - Requires authentication (candidate)

4. **POST /api/job-match/batch-match**
   - Batch match jobs for a specific candidate
   - Internal endpoint for scheduled jobs
   - Requires authentication (admin)

5. **POST /api/job-match/batch-match-all**
   - Batch match all candidates with all jobs
   - Nightly cron job
   - Requires authentication (admin)

6. **PATCH /api/job-match/recommendations/:recId/view**
   - Mark recommendation as viewed
   - Requires authentication (candidate)

7. **PATCH /api/job-match/recommendations/:recId/reject**
   - Reject a recommendation
   - Requires authentication (candidate)

### Frontend Components

#### 1. **MatchScore Component** (MatchScore.jsx)
Displays AI job match percentage with visual indicators.

**Props:**
- `score` (number): Match percentage (0-100)
- `size` (string): "small" | "medium" | "large" (default: "medium")
- `showDetails` (boolean): Show detailed breakdown
- `details` (object): Match details to display

**Features:**
- Conic gradient circular progress indicator
- Color-coded (green/blue/amber/red)
- Responsive sizing
- Optional detailed breakdown

#### 2. **SkillGap Component** (SkillGap.jsx)
Displays skill gaps, missing skills, and learning recommendations.

**Props:**
- `skillGaps` (object): Skill gap analysis data
- `matchingSkills` (array): List of matching skills

**Features:**
- Expandable sections
- Matching skills (green checkmarks)
- Missing skills (warning badges with difficulty)
- Learning recommendations with resources
- Action items prioritized by importance
- Learning timeline with phases

#### 3. **JobCardWithMatch Component** (JobCardWithMatch.jsx)
Job card with embedded AI match score.

**Features:**
- Company logo and basic info
- Match score badge with color coding
- Location, experience, salary
- Tech stack preview
- Status badges (Full-time, Applied, etc.)
- AI recommendation star indicator

#### 4. **JobDetailsPageWithMatch Component** (JobDetailsPageWithMatch.jsx)
Enhanced job details page with matching analysis.

**Features:**
- Wraps existing JobDetailsPage
- Displays match score prominently
- Shows skill gap analysis
- Responsive layout (1 column on mobile)

## Integration Steps

### 1. Backend Setup

1. Copy service files:
   ```
   /backend/services/jobMatcher.service.js
   /backend/services/skillGapAnalyzer.service.js
   ```

2. Create models:
   ```
   /backend/models/jobMatch.model.js
   /backend/models/jobRecommendation.model.js
   ```

3. Create controller and routes:
   ```
   /backend/controllers/jobMatch.controller.js
   /backend/routes/jobMatch.routes.js
   ```

4. Update server.js:
   ```javascript
   import jobMatchRouter from "./routes/jobMatch.routes.js";
   app.use("/api/job-match", jobMatchRouter);
   ```

### 2. Frontend Setup

1. Create components:
   ```
   /frontend/src/components/MatchScore/MatchScore.jsx
   /frontend/src/components/MatchScore/MatchScore.css
   /frontend/src/components/SkillGap/SkillGap.jsx
   /frontend/src/components/SkillGap/SkillGap.css
   /frontend/src/components/JobCard/JobCardWithMatch.jsx
   /frontend/src/components/JobCard/JobCardWithMatch.css
   /frontend/src/components/JobDetailsPage/JobDetailsPageWithMatch.jsx
   ```

2. Update JobDetail page route:
   ```jsx
   // In router configuration
   // Change from:
   // import JobDetailsPage from "../../components/JobDetailsPage/JobDetailsPage";
   // To:
   import JobDetailsPageWithMatch from "../../components/JobDetailsPage/JobDetailsPageWithMatch";
   ```

3. Update job list to use JobCardWithMatch for logged-in users

### 3. Database Migrations

Run the following to create indexes for better performance:

```javascript
// In MongoDB
db.jobmatches.createIndex({ candidateId: 1, jobId: 1 }, { unique: true });
db.jobmatches.createIndex({ candidateId: 1, matchScore: -1 });
db.jobrecommendations.createIndex({ candidateId: 1, status: 1 });
db.jobrecommendations.createIndex({ candidateId: 1, matchScore: -1 });
```

## Scheduled Jobs (Cron)

### Nightly Job Matching

Set up a cron job to run at midnight (or your preferred time):

```bash
0 0 * * * curl -X POST http://localhost:5000/api/job-match/batch-match-all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

Or use a Node.js scheduler like `node-cron`:

```javascript
import cron from 'node-cron';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const response = await fetch('/api/job-match/batch-match-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Batch matching completed:', await response.json());
  } catch (error) {
    console.error('Batch matching error:', error);
  }
});
```

## Usage Examples

### For Candidates

#### 1. View Job with Match Score
```javascript
// User navigates to /job/:jobId
// Component automatically fetches and displays match data
```

#### 2. Search Jobs by Match
```javascript
// User types a search query
// API returns jobs sorted by match score
// Each job shows match percentage
```

#### 3. Get Recommendations
```javascript
// User visits recommendations section
// API returns top 10 matching jobs
// Recommendations can be marked as viewed or rejected
```

### For Recruiters/Admins

#### 1. Manual Batch Matching
```bash
POST /api/job-match/batch-match
{
  "candidateId": "...",
  "matchThreshold": 50
}
```

#### 2. Bulk Matching All
```bash
POST /api/job-match/batch-match-all
```

## Algorithm Details

### Skill Matching
- Normalizes skill names (lowercase, trim)
- Uses substring matching for variations (e.g., "Node.js" matches "nodejs")
- Calculates percentage of required skills matched

### Experience Matching
- Parses experience level from strings (e.g., "2-3 years", "5+ years")
- Compares candidate experience to required experience
- 100% if candidate has equal or more experience
- Partial score based on percentage of required years

### Education Matching
- Checks if candidate has any matching education level
- Supports fuzzy matching of degree names
- 100% if matching education found, 50% if candidate has education but no requirements, 50% default

### Additional Skills Bonus
- Identifies tech-related additional skills
- Adds up to 10% bonus for relevant extra skills

## Customization

### Adjust Algorithm Weights
In `jobMatcher.service.js`, line ~150:

```javascript
const finalScore = Math.round(
  (skillMatch.matchPercentage * 0.40) +  // Change these weights
  (experienceScore * 0.30) +
  (educationScore * 0.20) +
  additionalBonus
);
```

### Add More Skill Resources
In `skillGapAnalyzer.service.js`, expand `skillResources` object:

```javascript
const skillResources = {
  'your-skill': ['Resource 1', 'Resource 2', 'Resource 3'],
  // ...
};
```

### Change Difficulty Categories
In `skillGapAnalyzer.service.js`, adjust difficulty arrays:

```javascript
const easySkills = [/* ... */];
const mediumSkills = [/* ... */];
const hardSkills = [/* ... */];
```

## Performance Optimization

### Database Indexes
Already created on:
- `jobmatches.candidateId + jobId` (unique)
- `jobmatches.candidateId + matchScore`
- `jobrecommendations.candidateId + status`
- `jobrecommendations.candidateId + matchScore`

### Caching Strategy
Consider caching match results in Redis:
- Cache matches for 24 hours
- Invalidate on job updates
- Use candidate + job ID as key

### Batch Processing
- Nightly job processes all candidates (configurable threshold)
- Only creates recommendations for score >= 50
- Uses async processing to avoid blocking

## Testing

### Test Cases

1. **Skill Matching**
   ```javascript
   const candidate = {
     skills: ['JavaScript', 'React', 'Node.js']
   };
   const job = {
     techStack: ['JavaScript', 'React', 'Python']
   };
   // Expected: 66.67% match (2/3)
   ```

2. **Experience Matching**
   ```javascript
   const candidate = {
     experience: [/* 3 jobs */]  // ~3 years
   };
   const job = {
     experience: "2-3 years"
   };
   // Expected: 100% match (meets requirement)
   ```

3. **Overall Match**
   ```javascript
   // All scores at 100% should give ~105% (capped at 100%)
   ```

## Troubleshooting

### Match score always 0
- Check if candidate has parsed resume with skills
- Verify job has techStack/jobCriteria defined
- Check browser console for errors

### Missing recommendations
- Check if batch-match-all job ran successfully
- Verify recommendation threshold (default 50)
- Check database for JobRecommendation records

### Slow performance on search
- Verify database indexes exist
- Check query complexity in jobMatch controller
- Consider implementing Redis caching

## Future Enhancements

1. **Machine Learning**
   - Train ML model on successful vs unsuccessful applications
   - Refine weights based on actual outcomes

2. **Skill Inference**
   - Automatically infer related skills
   - Detect skill deprecation

3. **Career Path Recommendations**
   - Suggest learning paths for career growth
   - Identify next-step roles

4. **Team Composition**
   - Match candidates for team needs
   - Identify skill gaps in hiring

5. **Salary Prediction**
   - Estimate salary based on skills and experience
   - Identify overqualified/underqualified matches

## Support & Maintenance

### Regular Tasks

1. **Weekly**
   - Check error logs for matching issues
   - Review failed recommendations

2. **Monthly**
   - Update skill resources
   - Adjust algorithm weights based on feedback
   - Check database performance

3. **Quarterly**
   - Review algorithm accuracy
   - Update skill difficulty categories
   - Analyze recommendation effectiveness

## Files Created

### Backend
- `/backend/services/jobMatcher.service.js`
- `/backend/services/skillGapAnalyzer.service.js`
- `/backend/models/jobMatch.model.js`
- `/backend/models/jobRecommendation.model.js`
- `/backend/controllers/jobMatch.controller.js`
- `/backend/routes/jobMatch.routes.js`

### Frontend
- `/frontend/src/components/MatchScore/MatchScore.jsx`
- `/frontend/src/components/MatchScore/MatchScore.css`
- `/frontend/src/components/SkillGap/SkillGap.jsx`
- `/frontend/src/components/SkillGap/SkillGap.css`
- `/frontend/src/components/JobCard/JobCardWithMatch.jsx`
- `/frontend/src/components/JobCard/JobCardWithMatch.css`
- `/frontend/src/components/JobDetailsPage/JobDetailsPageWithMatch.jsx`

## API Quick Reference

```
GET  /api/job-match/search?query=...       # Search with matches
GET  /api/job-match/:jobId/match           # Get detailed match
GET  /api/job-match/recommendations        # Get recommendations
POST /api/job-match/batch-match            # Batch match single candidate
POST /api/job-match/batch-match-all        # Batch match all candidates
PATCH /api/job-match/recommendations/:id/view    # Mark viewed
PATCH /api/job-match/recommendations/:id/reject  # Reject
```

## Conclusion

The PHASE 4 AI Job Matching system provides intelligent, data-driven job recommendations to candidates while helping them understand their qualifications and skill gaps. The system is highly customizable, scalable, and designed for continuous improvement.
