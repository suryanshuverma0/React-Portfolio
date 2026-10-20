import { PAGE_WIDTH, LINE_SPACING, strokeOutline, outlineToPath, unionBounds } from "./geometry";

/* ========================================
   Render a handwritten page to a PNG File
   (used when publishing it to the blog).
   Images are inlined as data URLs first so
   the canvas isn't tainted.
========================================= */

const toDataUrl = async (url) => {
  try {
    const blob = await (await fetch(url, { mode: "cors" })).blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const paperSvg = (paper, height) => {
  const s = LINE_SPACING;
  const lines = [];
  if (paper === "lined") {
    for (let y = s; y < height; y += s) lines.push(`<line x1="0" y1="${y - 0.5}" x2="${PAGE_WIDTH}" y2="${y - 0.5}" stroke="#c7d7ee" stroke-width="1"/>`);
    lines.push(`<line x1="72" y1="0" x2="72" y2="${height}" stroke="#f2b8b8" stroke-width="1.2"/>`);
  } else if (paper === "grid") {
    for (let y = 0; y < height; y += s) lines.push(`<line x1="0" y1="${y}" x2="${PAGE_WIDTH}" y2="${y}" stroke="#dbe3ee"/>`);
    for (let x = 0; x <= PAGE_WIDTH; x += s) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#dbe3ee"/>`);
  } else if (paper === "dotted") {
    for (let y = s / 2; y < height; y += s) for (let x = s / 2; x < PAGE_WIDTH; x += s) lines.push(`<circle cx="${x}" cy="${y}" r="1.4" fill="#b8c2cf"/>`);
  }
  return lines.join("");
};

export const inkToSvgString = async (ink) => {
  const elements = ink?.elements || [];
  const height = elements.length ? Math.max(300, Math.ceil(unionBounds(elements).maxY + 60)) : 300;
  const images = new Map(
    await Promise.all(elements.filter((e) => e.type === "image").map(async (e) => [e.url, await toDataUrl(e.url)])),
  );

  const ordered = [...elements.filter((e) => e.tool === "highlighter"), ...elements.filter((e) => e.tool !== "highlighter")];
  const body = ordered
    .map((el) => {
      if (el.type === "stroke") {
        const opacity = el.tool === "highlighter" ? ' fill-opacity="0.38"' : "";
        return `<path d="${outlineToPath(strokeOutline(el))}" fill="${esc(el.color)}"${opacity}/>`;
      }
      if (el.type === "shape") {
        const common = `stroke="${esc(el.color)}" stroke-width="${el.size}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
        const x = Math.min(el.x1, el.x2);
        const y = Math.min(el.y1, el.y2);
        const w = Math.abs(el.x2 - el.x1);
        const h = Math.abs(el.y2 - el.y1);
        if (el.shape === "line") return `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" ${common}/>`;
        if (el.shape === "rect") return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" ${common}/>`;
        return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${common}/>`;
      }
      const href = images.get(el.url);
      return href ? `<image href="${href}" x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" preserveAspectRatio="none"/>` : "";
    })
    .join("");

  return {
    width: PAGE_WIDTH,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_WIDTH} ${height}" width="${PAGE_WIDTH}" height="${height}"><rect width="100%" height="100%" fill="#fdfdfb"/>${paperSvg(ink?.paper || "lined", height)}${body}</svg>`,
  };
};

// 2× resolution PNG so it stays sharp on retina screens.
export const inkToPngFile = async (ink, filename = "handwritten-note.png") => {
  const { svg, width, height } = await inkToSvgString(ink);
  const scale = 2;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return new File([blob], filename, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
};
