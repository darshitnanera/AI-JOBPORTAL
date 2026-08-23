# Resume Parsing System with Claude API Integration

## Overview

This resume parsing system integrates Claude API (Anthropic) to extract and parse professional information from resumes. The system supports PDF, TXT, and DOCX files, and provides a complete pipeline for resume extraction, editing, PDF generation, and version control.

## Architecture

### Backend Components

#### 1. **Claude API Service** (`/backend/services/claudeApi.service.js`)
- `extractResumeData(resumeText)` - Extracts structured data using Claude API
- `generateResumeSummary(resumeData)` - Generates professional summary
- `validateResumeData(resumeData)` - Validates extracted data

**Key Features:**
- Uses Claude Opus 5 model for high-quality extraction
- Returns structured JSON with skills, experience, education, projects, certifications, and contact info
- Automatic data validation and cleaning

#### 2. **Resume Parser Service** (`/backend/services/resumeParser.service.js`)
- `extractTextFromPDF(pdfBuffer)` - Extracts text from PDF files
- `extractTextFromFile(fileBuffer, mimeType)` - Handles multiple file formats
- `parseResume(fileBuffer, mimeType)` - Complete parsing pipeline
- `parseResumeText(resumeText)` - Parse from raw text
- `updateResumSection(currentParsedResume, section, data)` - Update specific sections
- `mergeResumeData(original, updates)` - Merge user edits with extracted data

**Supported Formats:**
- PDF (via pdf-parse)
- TXT (plain text)
- DOCX (Word documents)

#### 3. **Resume Generator Service** (`/backend/services/resumeGenerator.service.js`)
- `generateResumePDF(parsedResume, fullName)` - Generate ATS-friendly PDF
- `generateResumeHTML_Export(parsedResume, fullName)` - Generate HTML preview
- `updateAndRegeneratePDF(parsedResume, section, data, fullName)` - Update and regenerate

**PDF Features:**
- Professional ATS-friendly format
- No images or complex styling that breaks ATS parsing
- Proper spacing and typography
- Uses Puppeteer for reliable PDF generation

#### 4. **Resume Controller** (`/backend/controllers/resume.controller.js`)

**Endpoints:**

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/resume/upload` | Upload and parse resume file |
| POST | `/api/resume/extract` | Extract from raw text |
| GET | `/api/resume/parsed` | Get parsed resume |
| PUT | `/api/resume/update` | Update resume section |
| POST | `/api/resume/generate-pdf` | Generate PDF |
| GET | `/api/resume/preview` | Get HTML preview |
| GET | `/api/resume/versions` | Get version history |
| POST | `/api/resume/restore-version` | Restore previous version |
| DELETE | `/api/resume/parsed` | Delete parsed resume |

#### 5. **Resume Routes** (`/backend/routes/resume.routes.js`)
- Authentication via JWT tokens
- Multer file upload with validation
- File size limit: 10MB
- Supported MIME types: PDF, TXT, DOCX

#### 6. **User Model Update** (`/backend/models/user.model.js`)
```javascript
{
  parsedResume: {
    skills: [String],
    experience: [{company, role, duration, description}],
    education: [{school, degree, field, year}],
    projects: [{name, description, tech: [String]}],
    certifications: [{name, issuer, date}],
    contact: {email, phone, location, linkedin},
    summary: String,
    rawText: String
  },
  resumeVersions: [{
    version: Number,
    parsedData: Mixed,
    createdAt: Date,
    notes: String
  }]
}
```

### Frontend Components

#### 1. **ResumeParsing.jsx** - Main Page Component
- State management for parsed resume data
- API integration
- Tab navigation (Display, Edit, Versions)
- File upload and text extraction handlers
- PDF generation and preview

#### 2. **FileUploadArea.jsx** - Upload Component
- Drag-and-drop file upload
- Text input mode for manual paste
- File validation
- Supported formats display

#### 3. **ParsedResumeDisplay.jsx** - Display/Edit Component
- Display parsed resume sections
- Inline editing of each section
- Add/remove items within sections
- Save changes with API

**Sections:**
- Contact Information
- Professional Summary
- Experience
- Education
- Skills
- Projects
- Certifications

#### 4. **ResumeVersions.jsx** - Version History Component
- List all saved versions
- Restore from any previous version
- Version metadata (date, notes)

## API Response Format

### Successful Resume Upload
```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully",
  "parsedResume": {
    "skills": ["Python", "JavaScript", "React"],
    "experience": [
      {
        "company": "Tech Corp",
        "role": "Senior Developer",
        "duration": "2020-2023",
        "description": "Led development of core features..."
      }
    ],
    "education": [
      {
        "school": "University XYZ",
        "degree": "Bachelor of Science",
        "field": "Computer Science",
        "year": "2020"
      }
    ],
    "projects": [
      {
        "name": "AI Chatbot",
        "description": "Built intelligent chatbot",
        "tech": ["Python", "TensorFlow"]
      }
    ],
    "certifications": [
      {
        "name": "AWS Solutions Architect",
        "issuer": "Amazon",
        "date": "2022"
      }
    ],
    "contact": {
      "email": "user@example.com",
      "phone": "+1-234-567-8900",
      "location": "New York, NY",
      "linkedin": "https://linkedin.com/in/username"
    },
    "summary": "Experienced software engineer..."
  },
  "resumeUrl": "https://cloudinary.com/...",
  "version": 1
}
```

## Environment Configuration

Add to `.env`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Installation & Setup

### Backend
```bash
cd backend
npm install
# Dependencies added:
# - anthropic
# - pdf-parse
# - pdf-lib
# - html2pdf.js
```

### Frontend
```bash
cd frontend
npm install
```

## Usage Flow

### 1. Upload Resume
```javascript
const response = await fetch('/api/resume/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData // Contains resume file
});
```

### 2. Parse and Extract
- Claude API automatically extracts:
  - All skills mentioned
  - Work experience with dates
  - Education history
  - Projects undertaken
  - Certifications obtained
  - Contact information

### 3. Edit Parsed Data
```javascript
const response = await fetch('/api/resume/update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    section: 'skills',
    data: ['Python', 'JavaScript', 'React', 'Node.js']
  })
});
```

### 4. Generate PDF
```javascript
const response = await fetch('/api/resume/generate-pdf', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const blob = await response.blob();
// Download or preview
```

### 5. Version Control
- Each update creates a new version
- Restore any previous version with one click
- Full audit trail of changes

## Key Features

### 1. **Accurate Extraction**
- Uses Claude Opus 5 for intelligent parsing
- Handles various resume formats
- Extracts contextual information

### 2. **ATS-Friendly PDF**
- Clean, simple formatting
- No images or complex layouts
- Proper spacing and fonts
- Compatible with applicant tracking systems

### 3. **Version Control**
- Automatic versioning on each update
- Restore functionality
- Change tracking with notes

### 4. **Flexible Editing**
- Edit any parsed section
- Add/remove items
- Merge with original data

### 5. **Security**
- JWT authentication required
- File size validation
- Type checking
- Data sanitization

## Claude API Integration Details

### Model Used
- **Claude Opus 5** - For highest accuracy resume parsing
- Can be downgraded to **Claude Haiku 4.5** for cost optimization

### Extraction Prompt
The system uses a structured prompt to extract:
```
Extract all professional information from this resume in JSON format with fields:
- skills (string array)
- experience (array of {company, role, duration, description})
- education (array of {school, degree, field, year})
- projects (array of {name, description, tech})
- certifications (array of {name, issuer, date})
- contact (object with email, phone, location, linkedin)
- summary (string)
```

### Response Processing
- JSON validation and parsing
- Automatic error handling
- Data type coercion
- Empty array defaults for missing sections

## Error Handling

The system handles:
- Invalid file formats
- Corrupted PDFs
- Encoding issues
- API failures
- Network timeouts
- Large file uploads

## Performance Optimization

### File Processing
- Client-side file validation before upload
- Memory-efficient file handling
- Streaming PDF generation

### Caching
- Resume data cached in user model
- Version history for quick restore
- Lazy loading of versions

### API Calls
- Batch operations where possible
- Efficient state management
- Minimal re-renders

## Future Enhancements

1. **Advanced Matching**
   - Match skills to job requirements
   - Calculate job fit percentage
   - Suggest missing skills

2. **Resume Optimization**
   - AI suggestions for improvement
   - Keyword optimization
   - Format recommendations

3. **Bulk Processing**
   - Upload multiple resumes
   - Batch parsing
   - Comparative analysis

4. **Export Options**
   - DOCX export
   - Multiple PDF templates
   - JSON export for integrations

## Troubleshooting

### PDF Parsing Issues
- Ensure PDF is not corrupted
- Try text extraction mode
- Check file size (max 10MB)

### Claude API Errors
- Verify ANTHROPIC_API_KEY is set
- Check API quota and limits
- Review rate limiting

### File Upload Issues
- Validate file format
- Check file size
- Ensure proper MIME type

## Dependencies

### Backend
- `anthropic` - Claude API client
- `pdf-parse` - PDF text extraction
- `puppeteer` - PDF generation
- `multer` - File upload handling
- `mongoose` - Database
- `express` - Web framework

### Frontend
- `React` - UI framework
- `lucide-react` - Icons
- `CSS` - Styling

## Support & Documentation

For more information:
- [Anthropic Documentation](https://docs.anthropic.com)
- [Claude API Reference](https://docs.anthropic.com/en/api/messages)
- [PDF Parse Documentation](https://github.com/modeettidigital/pdf-parse)
