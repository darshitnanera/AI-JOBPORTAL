/**
 * Builds an ATS-friendly resume document from parsed resume data, entirely
 * client-side.
 *
 * Used for two things:
 *   1. Preview, when the backend preview is unavailable.
 *   2. PDF export fallback, via the browser's own print engine.
 *
 * Why print and not html2pdf.js: html2pdf rasterises the DOM to a canvas and
 * embeds it as an image, so the resulting PDF contains no selectable text and
 * an ATS parser extracts nothing from it. The browser's print pipeline emits
 * real text with real fonts, which is the whole point of an ATS-friendly
 * resume. It also costs no extra dependency.
 *
 * Page geometry lives in a single @page rule and layout is identical on
 * screen and in print, so preview and export cannot drift apart.
 */

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const arr = (v) => (Array.isArray(v) ? v : []);
const txt = (v) => String(v ?? "").trim();

/** A section is emitted only when it actually has content. */
const section = (title, body) =>
  body ? `<section class="s"><h2>${esc(title)}</h2>${body}</section>` : "";

const entry = ({ title, meta, sub, body }) => `
  <article class="e">
    <div class="e-h">
      <span class="e-t">${esc(title)}</span>
      ${meta ? `<span class="e-m">${esc(meta)}</span>` : ""}
    </div>
    ${sub ? `<div class="e-s">${esc(sub)}</div>` : ""}
    ${body ? `<p class="e-b">${esc(body)}</p>` : ""}
  </article>`;

export function buildResumeHTML(parsed, fullName = "") {
  const p = parsed || {};
  const c = p.contact || {};

  const contactLine = [c.email, c.phone, c.location, c.linkedin]
    .map(txt)
    .filter(Boolean)
    .map(esc)
    .join(" &nbsp;•&nbsp; ");

  const summary = txt(p.summary)
    ? `<p class="sum">${esc(p.summary)}</p>`
    : "";

  const skills = arr(p.skills).filter(Boolean).length
    ? `<p class="sk">${arr(p.skills).filter(Boolean).map(esc).join(" &nbsp;•&nbsp; ")}</p>`
    : "";

  const experience = arr(p.experience)
    .map((e) =>
      entry({
        title: txt(e.role) || txt(e.company),
        meta: txt(e.duration),
        sub: txt(e.role) && txt(e.company) ? txt(e.company) : "",
        body: txt(e.description),
      })
    )
    .join("");

  const education = arr(p.education)
    .map((e) =>
      entry({
        title: [txt(e.degree), txt(e.field)].filter(Boolean).join(", ") || txt(e.school),
        meta: txt(e.year),
        sub: txt(e.degree) || txt(e.field) ? txt(e.school) : "",
      })
    )
    .join("");

  const projects = arr(p.projects)
    .map((x) =>
      entry({
        title: txt(x.name),
        meta: arr(x.tech).filter(Boolean).join(", "),
        body: txt(x.description),
      })
    )
    .join("");

  const certifications = arr(p.certifications)
    .map((x) =>
      entry({
        title: txt(x.name),
        meta: txt(x.date),
        sub: txt(x.issuer),
      })
    )
    .join("");

  const name = txt(fullName) || txt(c.name) || "Resume";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(name)} — Resume</title>
<style>
  /* Single source of page geometry: preview and print cannot diverge. */
  @page { size: Letter; margin: 0.5in; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    /* Metric-compatible stack that resolves on Linux, macOS and Windows,
       so line breaks are stable wherever this is rendered. */
    font-family: "Carlito", "Calibri", "Liberation Sans", "DejaVu Sans",
                 Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #1a1a1a;
    background: #fff;
    /* On screen only; @page owns the printed margins. */
    max-width: 7.5in;
    margin: 0 auto;
    padding: 0.5in 0;
  }
  @media print { body { max-width: none; padding: 0; } }

  header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 14px; }
  h1 { font-size: 20pt; letter-spacing: 0.4px; }
  .c { margin-top: 5px; font-size: 9.5pt; color: #333; }

  h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    border-bottom: 1px solid #999;
    padding-bottom: 2px;
    margin-bottom: 7px;
  }

  .s { margin-bottom: 13px; break-inside: avoid; page-break-inside: avoid; }
  h2 { break-after: avoid; page-break-after: avoid; }

  .e { margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid; }
  .e-h { display: flex; justify-content: space-between; gap: 12px; }
  .e-t { font-weight: 700; }
  .e-m { font-size: 9.5pt; color: #444; white-space: nowrap; }
  .e-s { font-size: 10pt; color: #333; }
  .e-b { margin-top: 2px; text-align: justify; }

  .sum { text-align: justify; }
  .sk { line-height: 1.6; }

  p { orphans: 2; widows: 2; }
</style>
</head>
<body>
  <header>
    <h1>${esc(name)}</h1>
    ${contactLine ? `<div class="c">${contactLine}</div>` : ""}
  </header>
  ${section("Professional Summary", summary)}
  ${section("Skills", skills)}
  ${section("Experience", experience)}
  ${section("Education", education)}
  ${section("Projects", projects)}
  ${section("Certifications", certifications)}
</body>
</html>`;
}

/** Open the resume in a new tab for reading. */
export function openResumePreview(parsed, fullName) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(buildResumeHTML(parsed, fullName));
  w.document.close();
  return true;
}

/**
 * Export via the browser's print dialog ("Save as PDF"), producing a
 * real text-based PDF. Returns false if pop-ups are blocked.
 */
export function printResumeToPDF(parsed, fullName) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(buildResumeHTML(parsed, fullName));
  w.document.close();
  w.focus();
  // Let fonts settle before the print dialog measures the page.
  const go = () => {
    try {
      w.print();
    } catch {
      /* user can still print manually */
    }
  };
  if (w.document.fonts?.ready) w.document.fonts.ready.then(go).catch(go);
  else setTimeout(go, 400);
  return true;
}
