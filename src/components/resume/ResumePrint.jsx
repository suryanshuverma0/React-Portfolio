import { createPortal } from "react-dom";

import ResumeDocument from "./ResumeDocument";

/* ========================================
   PRINT / PDF — the browser's own "Save as
   PDF" keeps every word as real text (what
   ATS systems need), unlike image-based PDF
   libraries. A full-size copy of the resume
   lives at <body> level, hidden on screen;
   printResume() shows only it, sets paper
   size + margins, and names the file.
========================================= */

export function ResumePrintPortal({ config, data, siteUrl }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="resume-print-portal" aria-hidden>
      <ResumeDocument config={config} data={data} siteUrl={siteUrl} paged={false} />
    </div>,
    document.body,
  );
}
