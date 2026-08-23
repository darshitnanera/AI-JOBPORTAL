# PHASE 4 - Quick Start Guide

## 5-Minute Integration

### Step 1: Add Backend Files (2 minutes)

1. **Copy service files:**
   ```bash
   # Copy jobMatcher.service.js and skillGapAnalyzer.service.js to /backend/services/
   ```

2. **Copy model files:**
   ```bash
   # Copy jobMatch.model.js and jobRecommendation.model.js to /backend/models/
   ```

3. **Copy controller and route files:**
   ```bash
   # Copy jobMatch.controller.js to /backend/controllers/
   # Copy jobMatch.routes.js to /backend/routes/
   ```

### Step 2: Update Backend Server (1 minute)

**In `/backend/server.js`:**

```javascript
// Add import
import jobMatchRouter from "./routes/jobMatch.routes.js";

// Add route (after job router)
app.use("/api/job-match", jobMatchRouter);
```

### Step 3: Add Frontend Components (2 minutes)

1. **Copy component files:**
   ```bash
   # Copy all component files from /components/ directories
   # - MatchScore/
   # - SkillGap/
   # - JobCard/
   # - JobDetailsPage/JobDetailsPageWithMatch.jsx
   ```

### Step 4: Update Frontend Routes (Optional)

**To show match scores in job details page:**

1. Open `/frontend/src/pages/JobDetail/JobDetail.jsx`
2. Replace the import:
   ```jsx
   // Change from:
   import JobDetailPage from "../../components/JobDetailsPage/JobDetailsPage";
   
   // To:
   import JobDetailsPageWithMatch from "../../components/JobDetailsPage/JobDetailsPageWithMatch";
   ```

3. Use the new component:
   ```jsx
   <JobDetailsPageWithMatch />
   ```

## Testing

### Test 1: Verify Backend API

```bash
# Get an auth token first, then:
curl -X GET http://localhost:5000/api/job-match/search?query=developer \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Test Match Calculation

```bash
# Get match for a specific job
curl -X GET http://localhost:5000/api/job-match/JOB_ID/match \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Get Recommendations

```bash
# Get job recommendations
curl -X GET http://localhost:5000/api/job-match/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What Gets Calculated

### Match Score (0-100%)
- **40%** - Required skills match
- **30%** - Experience level match
- **20%** - Education relevance
- **10%** - Additional skills bonus

### Outputs for Each Job
1. **Match Score** - Overall percentage
2. **Matching Skills** - Green checkmarks (you have these)
3. **Missing Skills** - Warning badges (you need to learn)
4. **Gap Severity** - Easy/Medium/Hard
5. **Learning Path** - Recommended resources and timeline

## Using the Components

### MatchScore Component
```jsx
import MatchScore from "./MatchScore";

<MatchScore 
  score={85} 
  size="large"
  showDetails={true}
  details={matchData}
/>
```

### SkillGap Component
```jsx
import SkillGap from "./SkillGap";

<SkillGap 
  skillGaps={skillGapsData}
  matchingSkills={['React', 'JavaScript']}
/>
```

### JobCardWithMatch Component
```jsx
import JobCardWithMatch from "./JobCardWithMatch";

<JobCardWithMatch 
  job={jobData}
  matchScore={75}
  isApplied={false}
/>
```

## Common Issues & Solutions

### Issue: "Candidate profile not found or resume not parsed"
**Solution:** Make sure the candidate has:
1. Uploaded a resume
2. Resume has been parsed (via resume parser service)
3. User is logged in

### Issue: Match scores are all 0
**Solution:** 
1. Check if job has `techStack` or `jobCriteria` defined
2. Check if candidate resume has parsed skills
3. Check browser console for errors

### Issue: No recommendations showing
**Solution:**
1. Run the batch match job manually: `POST /api/job-match/batch-match-all`
2. Check that recommendations have `status: 'pending'`
3. Verify match threshold (default 50%)

## Performance Tips

1. **Cache match results** - Results are cached for 24 hours
2. **Batch matching** - Run nightly to avoid real-time computation
3. **Database indexes** - Already created in models

## Customization

### Change Algorithm Weights

In `/backend/services/jobMatcher.service.js` (line ~150):

```javascript
const finalScore = Math.round(
  (skillMatch.matchPercentage * 0.40) +  // Change this
  (experienceScore * 0.30) +              // Or this
  (educationScore * 0.20) +               // Or this
  additionalBonus
);
```

### Add More Skill Resources

In `/backend/services/skillGapAnalyzer.service.js`:

```javascript
const skillResources = {
  'new-skill': ['Resource 1', 'Resource 2', 'Resource 3'],
};
```

## Next Steps

1. **Test with real candidates** - Upload resumes and view matches
2. **Set up nightly batch job** - Run recommendations matching
3. **Monitor performance** - Check match accuracy
4. **Gather feedback** - Adjust weights based on user feedback
5. **Add more features** - Career path, salary prediction, etc.

## Database Records

After first match, you'll see:

### JobMatch Records
```
{
  candidateId: "...",
  jobId: "...",
  matchScore: 75,
  matchDetails: {...},
  lastUpdated: Date
}
```

### JobRecommendation Records
```
{
  candidateId: "...",
  jobId: "...",
  matchScore: 75,
  reason: "You have 5/7 required skills...",
  status: "pending",
  recommendedAt: Date
}
```

## Support

For issues or questions:
1. Check PHASE4_IMPLEMENTATION.md for detailed docs
2. Review test cases in backend/tests/jobMatcher.test.js
3. Check browser console for client-side errors
4. Check server logs for backend errors

## Files Added

**Backend:**
- `backend/services/jobMatcher.service.js` - Core matching logic
- `backend/services/skillGapAnalyzer.service.js` - Skill analysis
- `backend/models/jobMatch.model.js` - Match data store
- `backend/models/jobRecommendation.model.js` - Recommendations store
- `backend/controllers/jobMatch.controller.js` - API endpoints
- `backend/routes/jobMatch.routes.js` - Routes
- `backend/tests/jobMatcher.test.js` - Test suite

**Frontend:**
- `frontend/src/components/MatchScore/MatchScore.jsx` - Score display
- `frontend/src/components/MatchScore/MatchScore.css` - Score styling
- `frontend/src/components/SkillGap/SkillGap.jsx` - Gap analysis
- `frontend/src/components/SkillGap/SkillGap.css` - Gap styling
- `frontend/src/components/JobCard/JobCardWithMatch.jsx` - Card with score
- `frontend/src/components/JobCard/JobCardWithMatch.css` - Card styling
- `frontend/src/components/JobDetailsPage/JobDetailsPageWithMatch.jsx` - Enhanced job page

**Documentation:**
- `PHASE4_IMPLEMENTATION.md` - Complete implementation guide
- `PHASE4_QUICK_START.md` - This file

## You're Ready!

The AI Job Matching system is now ready to use. Start by:

1. Uploading a resume as a candidate
2. Navigating to a job listing
3. Seeing the match score and skill gaps
4. Getting personalized learning recommendations

Good luck! 🚀
