import { useEffect, useState } from "react";

// Free live screenshots of any public page (WordPress mShots).
export const screenshotUrl = (url, w = 1280, h = 800) => `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${w}&h=${h}`;

export const isScreenshotUrl = (src = "") => src.startsWith("https://s0.wp.com/mshots/");
// GitHub's social cards are rendered on demand and the first (cold)
// request often fails.
const isGeneratedCard = (src = "") => src.startsWith("https://opengraph.githubassets.com/");

// Images that are generated on request: mShots answers with a 400×300
// "generating" placeholder until the screenshot exists; GitHub cards can
// error while rendering. Probe off-screen, retry, and only hand back a
// real image. Everything else passes straight through.
export function useReadyImage(src) {
  const [ready, setReady] = useState("");
  const probe = isScreenshotUrl(src) || isGeneratedCard(src);
  useEffect(() => {
    if (!probe) return undefined;
    let cancelled = false;
    let tries = 0;
    let timer;
    const attempt = () => {
      const url = tries ? `${src}${src.includes("?") ? "&" : "?"}r=${tries}` : src;
      const img = new Image();
      const retry = () => {
        if (!cancelled && ++tries < 8) timer = setTimeout(attempt, 3000);
      };
      img.onload = () => {
        if (cancelled) return;
        if (img.naturalWidth > 400) setReady(url);
        else retry();
      };
      img.onerror = retry;
      img.src = url;
    };
    attempt();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [src, probe]);
  if (!probe) return src;
  return ready.startsWith(src) ? ready : "";
}
