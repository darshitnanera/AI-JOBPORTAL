# Admin Dashboard User Guide

## Overview
The Admin Dashboard provides comprehensive platform management and monitoring capabilities for administrators. It includes user management, job moderation, application tracking, and analytics.

## Accessing the Admin Dashboard

### Prerequisites
1. Admin account must be created in the database
2. User must be logged in with admin role
3. Admin user creation requires setting `userType` to "admin" during signup

### Creating an Admin Account
```javascript
// Via API signup endpoint
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securePassword",
  "userType": "admin"  // Important: must be "admin"
}
```

### Accessing the Dashboard
1. Login with admin credentials
2. Navigate to `/admin/dashboard`
3. You will see the main admin dashboard interface

## Dashboard Sections

### 1. Overview Tab
Displays key platform metrics at a glance:
- **Total Users**: All registered users with active/inactive breakdown
- **Total Jobs**: All jobs with status breakdown (active/closed/expired)
- **Total Applications**: All applications with conversion rate
- **Quick Stats**: Additional metrics for shortlisted, accepted, and total applications

### 2. Users Tab
Manage all platform users with comprehensive controls.

#### Features:
- **User List**: Paginated table of all users (10 per page)
- **Filters**:
  - **Type Filter**: View specific user types
    - All Types
    - Candidates
    - Recruiters
  - **Status Filter**: View users by verification status
    - All Status
    - Active (verified)
    - Inactive (not verified)

#### Actions:
- **Deactivate/Activate**: Toggle user verification status
  - Active users can access all platform features
  - Inactive users have limited access
  - Click "Deactivate" to restrict access
  - Click "Activate" to restore access

- **Verify Recruiter**: Verify recruiter accounts
  - Only visible for unverified recruiters
  - Marks recruiter's company as verified
  - Recruiters can post jobs after verification

- **Delete User**: Permanently remove users
  - Confirmation required
  - Removes all associated data
  - Use with caution

#### Column Information:
- **Name**: User's full name
- **Email**: User's email address
- **Type**: User role (Candidate/Recruiter/Admin)
- **Status**: Verification status (Active/Inactive)

### 3. Jobs Tab
Moderate and manage job postings.

#### Features:
- **Job List**: Paginated table of all jobs (10 per page)
- **Filters**:
  - **Status Filter**:
    - All Status
    - Active: Job is currently accepting applications
    - Closed: Job posting closed by recruiter
    - Expired: Job posting expired

#### Actions:
- **Delete Job**: Remove inappropriate or duplicate job postings
  - Confirmation required
  - Candidates cannot see deleted jobs
  - Applications for deleted jobs are preserved

#### Column Information:
- **Job Title**: Role name/position
- **Company**: Company name
- **Posted By**: Recruiter who posted the job
- **Status**: Current status (Active/Closed/Expired)
- **Applications**: Number of applications received

### 4. Applications Tab
Review and moderate all job applications.

#### Features:
- **Application List**: All platform applications
- **Information Displayed**:
  - Candidate name
  - Job applied for
  - Company name
  - Application status with color coding:
    - Blue: Applied
    - Yellow: Under Review
    - Green: Shortlisted
    - Red: Rejected
    - Cyan: Accepted
  - Date when application was submitted

#### Use Cases:
- Monitor application flow
- Identify problematic applications
- Track candidate progress
- Verify application data

### 5. Analytics Tab
View platform trends and growth metrics.

#### Metrics Displayed:
- **Job Postings (Last 30 Days)**: Total new jobs posted in the past month
- **Applications (Last 30 Days)**: Total applications submitted in the past month
- **New Users (Last 30 Days)**: Total new user registrations in the past month

#### Uses:
- Monitor platform growth
- Track hiring activity
- Identify usage patterns
- Plan resource allocation

## Common Admin Tasks

### Task 1: Verify a New Recruiter
1. Go to **Users** tab
2. Filter by Type: "Recruiters"
3. Filter by Status: "Inactive"
4. Find the recruiter in the list
5. Click **"Verify"** button
6. Recruiter can now post jobs

### Task 2: Remove Spam Job Posting
1. Go to **Jobs** tab
2. Find the suspicious job
3. Review job details
4. Click **"Delete"** button
5. Confirm deletion

### Task 3: Deactivate Problematic User
1. Go to **Users** tab
2. Search/find the user
3. Click **"Deactivate"** button
4. User account is restricted
5. (Optional) Later click **"Activate"** to restore

### Task 4: Review Application Status
1. Go to **Applications** tab
2. Review applications and their statuses
3. Filter by status if needed
4. Check for any unusual patterns

### Task 5: Check Platform Growth
1. Go to **Analytics** tab
2. Review metrics for last 30 days
3. Analyze trends
4. Use data for reporting/planning

## Pagination
- Default page size: 10 items per page
- Use page numbers at bottom to navigate
- Filter changes reset to page 1
- Sorted by newest first

## Data Refresh
- Dashboard automatically loads data on tab change
- Click tab again to manually refresh
- Data updates in real-time from backend

## Best Practices

### Security:
- Keep admin credentials secure
- Don't share admin account
- Review user actions regularly
- Monitor for suspicious activity

### User Management:
- Deactivate problem users gradually
- Document reasons for deletions
- Verify recruiters before they can post
- Monitor application spam

### Job Moderation:
- Review jobs for appropriateness
- Remove duplicate postings
- Delete spam or test jobs
- Track job posting trends

### Data Management:
- Regular backups recommended
- Archive analytics reports
- Monitor database growth
- Clean up old test data

## Troubleshooting

### "Access Denied" Error
- Ensure you're logged in as admin
- Check that user role is "admin"
- Verify JWT token is valid
- Clear browser cache and retry

### Filters Not Working
- Ensure filters are set correctly
- Click apply/filter button
- Check API response in browser console
- Verify backend is running

### Data Not Loading
- Check internet connection
- Verify API endpoint is accessible
- Check browser console for errors
- Ensure backend server is running

### Slow Performance
- Close other applications
- Clear browser cache
- Check network connection
- Reduce pagination size

## API Endpoints Used

### Statistics
```
GET /api/admin/stats
Response: Platform statistics and metrics
```

### User Management
```
GET /api/admin/users?page=1&limit=10&type=candidate&status=active
PUT /api/admin/users/:userId/status
PUT /api/admin/users/:userId/verify-recruiter
DELETE /api/admin/users/:userId
```

### Job Management
```
GET /api/admin/jobs?page=1&limit=10&status=active
PUT /api/admin/jobs/:jobId/status
DELETE /api/admin/jobs/:jobId
```

### Application Management
```
GET /api/admin/applications?page=1&limit=20
PUT /api/admin/applications/:applicationId/status
```

### Analytics
```
GET /api/admin/analytics
Response: 30-day trend data
```

## Keyboard Shortcuts (Future)
- `Ctrl+U`: Go to Users tab
- `Ctrl+J`: Go to Jobs tab
- `Ctrl+A`: Go to Applications tab
- `Ctrl+F`: Focus on filter inputs

## FAQ

### Q: Can I export data from the dashboard?
A: Currently, no export feature exists. This is planned for future release.

### Q: How long is data retained?
A: All user actions and data are retained indefinitely in the database.

### Q: Can I undo a user deletion?
A: No, deletions are permanent. Ensure confirmation before deleting.

### Q: How often is analytics data updated?
A: Analytics data is calculated in real-time when the tab is accessed.

### Q: What's the maximum number of users I can manage?
A: Pagination handles large datasets efficiently. No practical limit.

### Q: Can multiple admins work simultaneously?
A: Yes, multiple admin accounts can access and modify data simultaneously.

## Support
For technical issues or questions:
1. Check browser console for error messages
2. Review this guide for common solutions
3. Contact backend team with specific error details
4. Include API response logs in bug reports

## Version
- Dashboard Version: 1.0.0
- API Version: 1.0.0
- Last Updated: August 2026

## Changelog

### Version 1.0.0
- Initial release
- User management
- Job moderation
- Application tracking
- Analytics dashboard
- Role-based access control
