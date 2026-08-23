import puppeteer from "puppeteer";

/**
 * Generate professional ATS-friendly resume HTML
 * @param {Object} parsedResume - Parsed resume data
 * @param {string} fullName - Candidate full name
 * @returns {string} HTML content of resume
 */
function generateResumeHTML(parsedResume, fullName) {
  const { skills = [], experience = [], education = [], projects = [], certifications = [], contact = {}, summary = "" } = parsedResume;

  // Format contact information
  const contactLines = [];
  if (fullName) contactLines.push(fullName);
  if (contact.email) contactLines.push(contact.email);
  if (contact.phone) contactLines.push(contact.phone);
  if (contact.location) contactLines.push(contact.location);
  if (contact.linkedin) contactLines.push(contact.linkedin);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume - ${fullName}</title>
      <style>
        /* Page geometry is owned SOLELY by @page so that the on-screen
           preview and the downloaded PDF are byte-for-byte the same layout.
           Previously .container carried its own 0.5in padding *and*
           Puppeteer applied a 0.5in margin, giving 1in and pushing content
           off the page; a fixed height of 11in also clipped long resumes. */
        @page {
          size: Letter;
          margin: 0.5in;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          /* Calibri does not exist on Linux hosts (Render), so it silently
             fell back to a different metric font and re-flowed every line.
             This stack resolves identically on the server and in preview. */
          font-family: "Carlito", "Calibri", "Liberation Sans", "DejaVu Sans",
            Arial, Helvetica, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #333;
          background-color: #fff;
        }

        /* Auto width/height: the page box supplies the margins, the content
           flows naturally across as many pages as it needs. */
        .container {
          width: 100%;
          margin: 0;
          padding: 0;
          background: #fff;
        }

        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          margin-bottom: 0.2in;
          padding-bottom: 0.1in;
        }

        .header-name {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }

        .header-contact {
          font-size: 9pt;
          line-height: 1.3;
        }

        .header-contact-item {
          display: inline;
          margin-right: 12px;
        }

        .header-contact-item:after {
          content: " | ";
          margin-left: 12px;
        }

        .header-contact-item:last-child:after {
          content: "";
        }

        .section {
          margin-bottom: 0.15in;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          margin-bottom: 6px;
          padding-bottom: 3px;
          letter-spacing: 0.5px;
        }

        .summary {
          font-size: 10pt;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .entry {
          margin-bottom: 0.12in;
          page-break-inside: avoid;
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2px;
        }

        .entry-title {
          font-weight: bold;
          font-size: 10pt;
        }

        .entry-subtitle {
          font-style: italic;
          font-size: 10pt;
        }

        .entry-date {
          font-size: 9pt;
          color: #555;
        }

        .entry-description {
          font-size: 9pt;
          line-height: 1.35;
          margin-top: 2px;
        }

        .skills-list {
          font-size: 9pt;
          line-height: 1.4;
        }

        .skill-item {
          display: inline-block;
          margin-right: 8px;
          margin-bottom: 4px;
        }

        .skill-badge {
          background-color: #f0f0f0;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 8pt;
        }

        ul {
          margin-left: 0.2in;
          font-size: 9pt;
          line-height: 1.35;
        }

        li {
          margin-bottom: 2px;
        }

        .company-role {
          font-weight: bold;
        }

        /* Page-break control. These apply in BOTH media so the preview
           reflects the printed result. No screen-only overrides exist —
           divergent screen/print rules were the cause of the
           "looks right in the app, wrong in the PDF" bug. */
        .section {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* A heading must never be stranded at the foot of a page. */
        .section-title,
        .header {
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Individual entries stay whole rather than splitting mid-record. */
        .entry,
        .experience-item,
        .education-item,
        .project-item,
        .certification-item {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Avoid single dangling lines at a page boundary. */
        p, li {
          orphans: 2;
          widows: 2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-name">${fullName}</div>
          <div class="header-contact">
            ${contactLines.map((line) => `<span class="header-contact-item">${line}</span>`).join("")}
          </div>
        </div>

        <!-- Summary -->
        ${summary ? `<div class="section"><div class="summary">${summary}</div></div>` : ""}

        <!-- Experience -->
        ${
          experience.length > 0
            ? `
          <div class="section">
            <div class="section-title">Professional Experience</div>
            ${experience
              .map(
                (exp) => `
              <div class="entry">
                <div class="entry-header">
                  <div>
                    <div class="company-role">${exp.role}</div>
                    <div class="entry-subtitle">${exp.company}</div>
                  </div>
                  <div class="entry-date">${exp.duration}</div>
                </div>
                <div class="entry-description">${exp.description}</div>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <!-- Skills -->
        ${
          skills.length > 0
            ? `
          <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-list">
              ${skills.map((skill) => `<span class="skill-item"><span class="skill-badge">${skill}</span></span>`).join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Education -->
        ${
          education.length > 0
            ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${education
              .map(
                (edu) => `
              <div class="entry">
                <div class="entry-header">
                  <div>
                    <div class="company-role">${edu.degree}${edu.field ? ` in ${edu.field}` : ""}</div>
                    <div class="entry-subtitle">${edu.school}</div>
                  </div>
                  <div class="entry-date">${edu.year}</div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <!-- Projects -->
        ${
          projects.length > 0
            ? `
          <div class="section">
            <div class="section-title">Projects</div>
            ${projects
              .map(
                (proj) => `
              <div class="entry">
                <div class="entry-header">
                  <div class="entry-title">${proj.name}</div>
                </div>
                <div class="entry-description">${proj.description}</div>
                ${proj.tech && proj.tech.length > 0 ? `<div class="entry-description"><strong>Technologies:</strong> ${proj.tech.join(", ")}</div>` : ""}
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <!-- Certifications -->
        ${
          certifications.length > 0
            ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            ${certifications
              .map(
                (cert) => `
              <div class="entry">
                <div class="entry-header">
                  <div class="entry-title">${cert.name}</div>
                  ${cert.date ? `<div class="entry-date">${cert.date}</div>` : ""}
                </div>
                ${cert.issuer ? `<div class="entry-description"><strong>${cert.issuer}</strong></div>` : ""}
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `;
}

/**
 * Launch browser with appropriate options for environment
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function launchBrowser() {
  const isProduction = process.env.NODE_ENV === "production";

  return puppeteer.launch(
    isProduction
      ? {
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
          headless: true,
        }
      : {
          headless: true,
        }
  );
}

/**
 * Generate PDF from resume data
 * @param {Object} parsedResume - Parsed resume data
 * @param {string} fullName - Candidate full name
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateResumePDF(parsedResume, fullName) {
  let browser;

  try {
    if (!fullName) {
      throw new Error("Full name is required to generate resume");
    }

    const htmlContent = generateResumeHTML(parsedResume, fullName);

    browser = await launchBrowser();
    const page = await browser.newPage();

    // Set viewport to standard letter size
    await page.setViewport({
      width: 816,
      height: 1056,
      deviceScaleFactor: 1,
    });

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Render against print media explicitly, so the geometry we lay out is
    // the geometry that is measured. (page.pdf defaults to print, but being
    // explicit keeps preview and export provably in step.)
    await page.emulateMediaType("print");

    // Block until fonts are actually resolved. Without this, Puppeteer can
    // serialise the page mid-fallback and every line re-flows relative to
    // the preview.
    await page.evaluate(() => document.fonts.ready);

    // Page size and margins come from the @page rule in the stylesheet.
    // `preferCSSPageSize: true` makes CSS authoritative; passing `format`
    // or `margin` here as well would silently conflict with it, which is
    // what previously made the exported margins differ from the preview.
    const pdfBuffer = await page.pdf({
      displayHeaderFooter: false,
      printBackground: true,
      preferCSSPageSize: true,
    });

    await page.close();

    return pdfBuffer;
  } catch (error) {
    throw new Error(`PDF generation error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate HTML version of resume (for preview)
 * @param {Object} parsedResume - Parsed resume data
 * @param {string} fullName - Candidate full name
 * @returns {string} HTML content
 */
export function generateResumeHTML_Export(parsedResume, fullName) {
  return generateResumeHTML(parsedResume, fullName);
}

/**
 * Update resume section and regenerate PDF
 * @param {Object} parsedResume - Current parsed resume
 * @param {string} section - Section being updated
 * @param {any} data - New data for section
 * @param {string} fullName - Candidate full name
 * @returns {Promise<Object>} Updated resume data and new PDF buffer
 */
export async function updateAndRegeneratePDF(parsedResume, section, data, fullName) {
  const validSections = ["skills", "experience", "education", "projects", "certifications", "contact", "summary"];

  if (!validSections.includes(section)) {
    throw new Error(`Invalid section: ${section}`);
  }

  const updatedResume = {
    ...parsedResume,
    [section]: data,
  };

  const pdfBuffer = await generateResumePDF(updatedResume, fullName);

  return {
    success: true,
    parsedResume: updatedResume,
    pdfBuffer,
  };
}
