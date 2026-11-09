// WordPress mShots: free on-the-fly homepage screenshots (no key, no upload).
export const screenshotUrl = (url, w = 1280, h = 800) => `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${w}&h=${h}`;
