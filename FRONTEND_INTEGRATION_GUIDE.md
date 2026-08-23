# Frontend Integration Guide - Resume Parsing

## Adding Resume Parsing to Your App

### Step 1: Update Main Router

Add this to your main routing file (e.g., `App.jsx` or `Router.jsx`):

```jsx
import ResumeParsing from "./pages/ResumeParsing/ResumeParsing";

// In your route configuration:
<Route path="/resume-parsing" element={<ResumeParsing />} />
// Or with dashboard:
<Route path="/dashboard/resume" element={<ResumeParsing />} />
```

### Step 2: Add Navigation Link

Add this to your navigation/sidebar component:

```jsx
<NavLink to="/resume-parsing">
  <DocumentIcon size={20} />
  Resume Parser
</NavLink>
```

Or using Lucide icons:

```jsx
import { FileText, Upload } from "lucide-react";

<NavLink to="/resume-parsing" className="nav-link">
  <FileText size={20} />
  <span>Resume Parser</span>
</NavLink>
```

### Step 3: Verify API Configuration

Ensure your API URL is correctly configured in:

**Environment Variables** (`.env`):
```
VITE_API_URL=http://localhost:5000/api
# or for production:
VITE_API_URL=https://your-api-domain.com/api
```

**Component** (`ResumeParsing.jsx`):
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

### Step 4: Verify Authentication

The component automatically:
- Reads token from `localStorage.getItem("token")`
- Sends it in `Authorization: Bearer <token>` header
- Requires valid JWT token for all requests

Make sure your auth system stores tokens correctly.

### Step 5: Test Integration

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to Resume Parser**
   - Click on "Resume Parser" in navigation
   - Should see file upload area
   - Try uploading a resume PDF

4. **Test Features**
   - Upload resume
   - View parsed data
   - Edit sections
   - Download PDF
   - Check version history

---

## Optional Customizations

### 1. Custom Styling Integration

If using a custom theme, update CSS variables in component files:

```css
/* ResumeParsing.css */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
}
```

### 2. Add to User Dashboard

```jsx
// In dashboard component
import ResumeParsing from "../pages/ResumeParsing/ResumeParsing";

export function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="dashboard">
      {activeTab === "resume" && <ResumeParsing />}
      {/* ... other tabs */}
    </div>
  );
}
```

### 3. Breadcrumb Navigation

```jsx
<Breadcrumb>
  <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
  <BreadcrumbItem current>Resume Parser</BreadcrumbItem>
</Breadcrumb>
```

### 4. Custom Success Handlers

```jsx
// Add callback to ResumeParsing component
const handleParsingSuccess = (parsedResume) => {
  console.log("Resume parsed:", parsedResume);
  // Update user profile, show modal, etc.
};
```

### 5. Progress Indicators

Add progress indicators for parsing:

```jsx
// In FileUploadArea.jsx
{loading && (
  <div className="progress-indicator">
    <ProgressBar value={parseProgress} />
    <p>Parsing resume... {parseProgress}%</p>
  </div>
)}
```

### 6. Mobile Navigation

For mobile apps, ensure responsive navigation:

```jsx
// Responsive sidebar/drawer
<Drawer open={mobileOpen}>
  <NavLink to="/resume-parsing">Resume Parser</NavLink>
</Drawer>
```

---

## API Integration Points

### 1. User Profile Enhancement

After successful resume parsing, update user profile:

```jsx
// After resume upload
const updateUserProfile = async (parsedResume) => {
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      parsedResume: parsedResume,
      profileCompleted: true
    })
  });
};
```

### 2. Job Matching

Connect parsed skills to job matching:

```jsx
// Extract skills from parsed resume
const extractedSkills = parsedResume?.skills || [];

// Use for job filtering
const matchingJobs = jobs.filter(job =>
  job.requiredSkills.some(skill =>
    extractedSkills.includes(skill)
  )
);
```

### 3. Application Pre-filling

Pre-fill job applications with resume data:

```jsx
// When applying for a job
const applicationData = {
  jobId: jobId,
  candidateName: parsedResume.contact.name,
  email: parsedResume.contact.email,
  phone: parsedResume.contact.phone,
  resume: resumeUrl,
  parsedResume: parsedResume
};
```

---

## Troubleshooting

### Issue: 404 Not Found on API

**Solution:**
- Verify backend routes are registered
- Check API URL in environment variables
- Ensure token is valid

### Issue: CORS Error

**Solution:**
- Check CORS configuration in server.js
- Add frontend URL to `ALLOWED_ORIGINS`
- Verify credentials are sent with requests

### Issue: File Upload Failing

**Solution:**
- Check file size (max 10MB)
- Verify file format (PDF, TXT, DOCX)
- Check multer configuration in backend
- Ensure Cloudinary credentials are set

### Issue: Claude API Error

**Solution:**
- Verify ANTHROPIC_API_KEY is set
- Check API quota and billing
- Review error message in console logs
- Try with smaller resume file

### Issue: PDF Not Generating

**Solution:**
- Ensure Puppeteer is installed
- Check parsed resume has required data
- Verify headless browser can launch
- Check system memory availability

---

## Performance Optimization

### 1. Lazy Load Component

```jsx
import { lazy, Suspense } from 'react';

const ResumeParsing = lazy(() => 
  import('./pages/ResumeParsing/ResumeParsing')
);

// Use with Suspense
<Suspense fallback={<Loading />}>
  <ResumeParsing />
</Suspense>
```

### 2. Memoize Components

```jsx
import { memo } from 'react';

export const ParsedResumeDisplay = memo(
  function ParsedResumeDisplay({ resume, ...props }) {
    return <div>{/* ... */}</div>;
  }
);
```

### 3. Cache API Responses

```jsx
// Cache parsed resume data
const cachedResume = useRef(null);

const fetchResume = async () => {
  if (cachedResume.current) {
    return cachedResume.current;
  }
  
  const data = await fetch('/api/resume/parsed');
  cachedResume.current = data;
  return data;
};
```

---

## Security Checklist

- ✅ Token is stored securely (HttpOnly cookie recommended)
- ✅ API calls use HTTPS in production
- ✅ CORS is properly configured
- ✅ User can only access their own resume
- ✅ File uploads are validated server-side
- ✅ Sensitive data is not logged
- ✅ XSS protection is enabled
- ✅ CSRF tokens are used if needed

---

## Monitoring & Logging

### Frontend Logging

```jsx
// Add to ResumeParsing.jsx
useEffect(() => {
  console.log('Resume Parser mounted');
  return () => console.log('Resume Parser unmounted');
}, []);

// Log API calls
try {
  const response = await fetch(url);
  console.log('API Success:', response.status);
} catch (error) {
  console.error('API Error:', error);
  // Send to monitoring service
  trackError(error, 'resume-parsing');
}
```

### Backend Logging

```javascript
// Add to resume.controller.js
console.log('Resume upload started:', req.user.id);
console.log('Parsed resume:', JSON.stringify(parsedResume, null, 2));
console.log('Resume generation completed');
```

---

## Browser Compatibility

The Resume Parser is compatible with:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

Features used:
- Fetch API
- Local Storage
- File API
- CSS Grid/Flexbox

---

## Support & Troubleshooting

For issues:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify environment variables
4. Review RESUME_PARSING_README.md
5. Check backend logs
6. Test with sample resume file

---

## Next Steps

1. ✅ Route added to app
2. ✅ Navigation link added
3. ✅ API URL configured
4. ✅ Test functionality
5. ✅ Deploy to production
6. ✅ Monitor usage and errors
