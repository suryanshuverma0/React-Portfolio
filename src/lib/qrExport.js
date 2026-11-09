/* ========================================
   QR EXPORT — turn a rendered QR <svg> into
   a downloadable PNG (with optional caption)
   or SVG. Shared by the admin QR Studio and
   resume sharing.
========================================= */

export const downloadUrl = (url, filename) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const svgMarkup = (svg) => {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
};

export const downloadSvg = (svg, filename) => {
  const blob = new Blob([svgMarkup(svg)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Renders the QR (and caption) onto a canvas at `size` px wide.
export const svgToPng = (svg, { size = 1024, padding = 0.08, caption = "", background = "#ffffff", color = "#0a0a0a" } = {}) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgMarkup(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const pad = Math.round(size * padding);
      const captionHeight = caption ? Math.round(size * 0.12) : 0;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size + captionHeight;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);

      if (caption) {
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `600 ${Math.round(size * 0.05)}px Geist, Inter, system-ui, sans-serif`;
        ctx.fillText(caption, size / 2, size - pad / 2 + captionHeight / 2, size - pad * 2);
      }

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
