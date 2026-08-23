# Phase 6 Deployment Checklist

## Pre-Deployment

### Backend Setup
- [ ] Install dependencies: `npm install` (in backend directory)
- [ ] Verify `node-cron` in package.json
- [ ] All new files present:
  - [ ] `backend/models/UserIntegrations.model.js`
  - [ ] `backend/controllers/integrations.controller.js`
  - [ ] `backend/routes/integrations.routes.js`
  - [ ] `backend/services/integrations.service.js`
  - [ ] `backend/services/cronJobs.service.js`
- [ ] Server.js updated with integrations route and cron job init
- [ ] Environment variables configured in `.env`:
  - [ ] `GITHUB_CLIENT_ID`
  - [ ] `GITHUB_CLIENT_SECRET`
  - [ ] `BACKEND_URL`

### Frontend Setup
- [ ] All new component files present:
  - [ ] `frontend/src/components/Integrations/IntegrationButtons.jsx`
  - [ ] `frontend/src/components/Integrations/IntegrationButtons.css`
  - [ ] `frontend/src/components/Integrations/IntegrationDisplay.jsx`
  - [ ] `frontend/src/components/Integrations/IntegrationDisplay.css`
- [ ] Font Awesome library included in HTML or bundled

### GitHub OAuth Setup
- [ ] GitHub OAuth app created at github.com/settings/developers
- [ ] Client ID copied to `.env` as `GITHUB_CLIENT_ID`
- [ ] Client Secret generated and copied to `.env` as `GITHUB_CLIENT_SECRET`
- [ ] Callback URL configured: `http://localhost:5000/api/integrations/github/callback` (for dev)
- [ ] Verified client secret is kept secret

---

## Local Testing

### Backend Testing
- [ ] Backend starts without errors: `npm run dev`
- [ ] See log: `[Cron Jobs] Initialized. LeetCode sync scheduled for 2:00 AM daily`
- [ ] Database connection successful
- [ ] MongoDB has UserIntegrations collection accessible

### API Testing
- [ ] Use Postman/Insomnia to test endpoints
- [ ] `GET /api/integrations/profile` returns user integrations
- [ ] `GET /api/integrations/github/auth` returns authUrl
- [ ] `POST /api/integrations/leetcode/connect` with valid username returns data
- [ ] `POST /api/integrations/leetcode/connect` with invalid username returns error
- [ ] `POST /api/integrations/linkedin/connect` with valid URL works
- [ ] `POST /api/integrations/linkedin/connect` with invalid URL returns error
- [ ] `POST /api/integrations/disconnect` removes integration

### Frontend Testing
- [ ] Components import without errors
- [ ] `IntegrationButtons` displays all three platform buttons
- [ ] `IntegrationDisplay` shows data when integrations connected

### Integration Flow Testing (E2E)

#### GitHub OAuth
- [ ] Click "Connect GitHub"
- [ ] Redirected to GitHub login/authorization
- [ ] Authorize the app
- [ ] Redirected back to callback
- [ ] GitHub data appears (languages, repos, stats)
- [ ] "GitHub Connected" badge shows
- [ ] "View Profile" button works

#### LeetCode
- [ ] Click "Connect LeetCode"
- [ ] Modal appears
- [ ] Enter valid username (e.g., "twq")
- [ ] Data fetches and displays (problems solved, breakdown, rating)
- [ ] "LeetCode Verified" badge shows
- [ ] Invalid username shows error

#### LinkedIn
- [ ] Click "Connect LinkedIn"
- [ ] Modal appears
- [ ] Enter valid URL: `https://linkedin.com/in/test`
- [ ] Saves and displays
- [ ] Invalid URL shows error

#### Disconnect
- [ ] Click any "Disconnect" button
- [ ] Confirmation dialog appears
- [ ] After confirmation, data removed
- [ ] UI resets to "Connect" buttons

### Recruiter View Testing
- [ ] Fetch candidate with integrations: `GET /api/integrations/candidate/:id`
- [ ] IntegrationDisplay shows all connected platforms
- [ ] All data displays correctly
- [ ] Links to external profiles work

---

## Staging Deployment

### Environment Configuration
- [ ] Update `.env` with staging values
- [ ] GitHub OAuth app URLs point to staging domain
- [ ] Backend deployed to staging server
- [ ] Frontend deployed to staging domain
- [ ] CORS configured for staging origin

### Functionality Testing on Staging
- [ ] All endpoints respond correctly
- [ ] GitHub OAuth works with staging URL
- [ ] LeetCode API calls succeed
- [ ] Database operations work
- [ ] Cron job logs appear in staging logs

### Performance Testing
- [ ] GitHub API calls complete within timeout
- [ ] LeetCode GraphQL API calls succeed
- [ ] Database queries are fast
- [ ] No N+1 query issues

### Security Testing
- [ ] GitHub token not exposed in responses
- [ ] No sensitive data in logs
- [ ] CORS properly restricts origins
- [ ] Input validation prevents injection attacks
- [ ] Authentication required on all protected endpoints

---

## Production Deployment

### Pre-Production Checklist
- [ ] All staging tests passed
- [ ] Production GitHub OAuth app created
- [ ] Production environment variables set
- [ ] SSL/HTTPS configured
- [ ] Database backups configured
- [ ] Error monitoring set up (Sentry/LogRocket optional)
- [ ] Cron job monitoring configured

### Domain & Security
- [ ] Production domain configured
- [ ] HTTPS enforced
- [ ] GitHub OAuth callback URL uses HTTPS
- [ ] CORS configured for production domain
- [ ] Rate limiting implemented
- [ ] Secrets not committed to git

### Database
- [ ] MongoDB connection string points to production
- [ ] Backups scheduled
- [ ] Connection pooling configured
- [ ] Database replicas set up (if applicable)

### Deployment Steps
- [ ] Backend deployed to production
- [ ] Environment variables verified in production
- [ ] Frontend deployed to production
- [ ] CDN cache cleared (if applicable)
- [ ] DNS propagated (if domain changed)

### Production Verification
- [ ] Health check endpoint responds
- [ ] Backend logs show successful startup
- [ ] Cron job initialized in production
- [ ] Test endpoints respond correctly
- [ ] Database operations work

### Production Testing
- [ ] Manual GitHub OAuth flow test
- [ ] Manual LeetCode connection test
- [ ] Manual LinkedIn connection test
- [ ] Manual disconnect test
- [ ] Recruiter view test with real candidate

---

## Post-Deployment

### Monitoring Setup
- [ ] Server logs monitored for errors
- [ ] Cron job logs checked daily
- [ ] Error tracking active
- [ ] Performance metrics baseline established
- [ ] Uptime monitoring configured

### Documentation
- [ ] Team notified of new features
- [ ] End users notified of new integrations
- [ ] Support team trained on new features
- [ ] Documentation published
- [ ] FAQs updated

### Data Collection (Optional)
- [ ] Track integration adoption rate
- [ ] Monitor API call frequency
- [ ] Track error rates
- [ ] Gather user feedback

---

## Rollback Plan

If issues occur:
1. [ ] Database restore available
2. [ ] Previous backend version available
3. [ ] Rollback procedures documented
4. [ ] Team knows how to execute rollback
5. [ ] Communication plan for users

---

## Known Limitations & Future Work

### Current Limitations
- [ ] GitHub tokens don't auto-refresh (valid for user session)
- [ ] LeetCode sync only on connect and nightly (not real-time)
- [ ] LinkedIn only stores URL (no profile data fetch)
- [ ] No integration analytics dashboard

### Future Enhancements (Not in Phase 6)
- [ ] Real-time GitHub activity webhook
- [ ] LinkedIn public profile data scraping
- [ ] Integration-based job matching
- [ ] Skill extraction from GitHub languages
- [ ] Difficulty-based LeetCode recommendations
- [ ] Integration data export
- [ ] Social media verification badges

---

## Troubleshooting During Deployment

### Issue: "GITHUB_CLIENT_ID not defined"
**Solution**: Verify `.env` file is loaded and contains the variable

### Issue: "Cron job not starting"
**Solution**: Ensure `node-cron` is installed and `initializeCronJobs()` is called

### Issue: "LeetCode user not found"
**Solution**: Verify username is correct (case-sensitive) and profile is public

### Issue: "GitHub OAuth redirect mismatch"
**Solution**: Ensure callback URL in GitHub app settings matches backend URL

### Issue: "CORS error on integration requests"
**Solution**: Add frontend origin to CORS whitelist in server.js

---

## Sign-Off

- [ ] Backend Team: _________________ Date: _______
- [ ] Frontend Team: ________________ Date: _______
- [ ] QA Team: _____________________ Date: _______
- [ ] DevOps Team: _________________ Date: _______
- [ ] Product Owner: _______________ Date: _______

---

## Notes

Use this space for any deployment-specific notes:

```
[Your notes here]
```

---

## Contact Information

For issues or questions during deployment:

- **Backend Issues**: [Contact info]
- **Frontend Issues**: [Contact info]
- **DevOps/Deployment**: [Contact info]
- **On-Call Support**: [Contact info]

---

## Deployment Time Estimate

- Development environment: 30 minutes
- Staging environment: 1 hour
- Production environment: 1.5 hours
- Total (including testing): 4-5 hours

---

## Final Review

Before going live:
1. [ ] All checklist items completed
2. [ ] All tests passed
3. [ ] Documentation reviewed
4. [ ] Team trained
5. [ ] Stakeholders notified
6. [ ] Rollback plan in place
7. [ ] Monitoring active
8. [ ] Support team ready

✅ Ready for deployment!
