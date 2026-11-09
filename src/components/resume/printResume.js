import { TEMPLATE_BY_ID, TEMPLATES } from "./resumeModel";

// Prints only the resume (see ResumePrintPortal): paper size + margins via
// @page, the document title becomes the suggested PDF file name.
export const printResume = ({ config, name }) => {
  const template = TEMPLATE_BY_ID.get(config?.template) || TEMPLATES[0];
  const style = { ...template.defaults, ...(config?.style || {}) };
  const size = style.pageSize === "letter" ? "letter" : "A4";

  const pageStyle = document.createElement("style");
  pageStyle.textContent = `@page { size: ${size}; margin: ${style.margin}in; }`;
  document.head.appendChild(pageStyle);

  const previousTitle = document.title;
  // Becomes the suggested PDF file name.
  document.title = `${(name || "Resume").trim().replace(/\s+/g, "_")}_Resume`;
  document.body.classList.add("printing-resume");

  const cleanup = () => {
    document.body.classList.remove("printing-resume");
    document.title = previousTitle;
    pageStyle.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  // Let fonts finish before the print snapshot.
  (document.fonts?.ready || Promise.resolve()).then(() => {
    window.print();
    // Browsers without afterprint: tidy up once the dialog has had time to snapshot.
    if (!("onafterprint" in window)) setTimeout(cleanup, 5000);
  });
};
