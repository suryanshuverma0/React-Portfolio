// Canonical origin — the apex domain 308-redirects here.
export const SITE_URL = "https://www.suryanshuverma.com.np";

export const SITE_NAME = "Suryanshu Verma";

export const TWITTER_HANDLE = "@SuryanshuVerma5";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

// Crawlers need absolute URLs; uploaded images already are.
export const absoluteUrl = (value) => {
  if (!value) return DEFAULT_OG_IMAGE;

  if (/^https?:\/\//i.test(value)) return value;

  return `${SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};
