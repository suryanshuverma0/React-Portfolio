import { SITE_URL } from "./site";

/* ========================================
   GOOGLE ANALYTICS 4

   Runs alongside the first-party tracker in
   ./tracker.js — it doesn't replace it.

   - Loads only in production builds, on the
     real domain (not localhost or Vercel
     preview URLs).
   - This is an SPA, so the automatic page_view
     is turned off and one is sent per route
     change. In GA4 → Data streams → Enhanced
     measurement, turn OFF "Page changes based
     on browser history events" or every route
     change is counted twice.
   - Admin pages, token URLs and the card
     preview are never sent.
   - Once an admin signs in on a browser, that
     browser is opted out for good, so your own
     visits don't inflate the numbers.
========================================= */

// Measurement IDs are public (they ship in the page either way), so the
// real one is the default; VITE_GA_MEASUREMENT_ID overrides it.
const DEFAULT_MEASUREMENT_ID = "G-0B78W40WRH";

const MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || DEFAULT_MEASUREMENT_ID;

const SITE_HOST = new URL(SITE_URL).hostname.replace(/^www\./, "");

// /reset-password/:token and /link-passkey/:token carry secrets in the URL.
const IGNORED_PATH_PREFIXES = ["/dashboard", "/reset-password", "/link-passkey", "/link-device"];

const OPT_OUT_KEY = "ga_opt_out";

// react-helmet-async sets the new <title> shortly after a route renders.
const TITLE_SETTLE_MS = 600;

let initialized = false;
let lastLocation = null;

const isProductionHost = () => {
  const host = window.location.hostname;
  return host === SITE_HOST || host === `www.${SITE_HOST}`;
};

const isOptedOut = () => {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
};

const isIgnoredPath = (path) =>
  new URLSearchParams(window.location.search).has("preview") ||
  IGNORED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

export const isGAEnabled = () =>
  typeof window !== "undefined" &&
  Boolean(MEASUREMENT_ID) &&
  import.meta.env.PROD &&
  isProductionHost() &&
  !isOptedOut();

const gtag = (...args) => {
  window.gtag?.(...args);
};

// Loads gtag.js once the browser is idle so it never competes with the
// first paint. Commands sent before then wait in dataLayer.
const loadScript = () => {
  const inject = () => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(inject, { timeout: 3000 });
  } else {
    setTimeout(inject, 1500);
  }
};

export const initGA = () => {
  if (initialized || !isGAEnabled()) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the arguments object itself, not an array.
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  loadScript();
};

// Called for an admin session: stop sending now and on every later visit
// from this browser, signed in or not.
export const optOutOfGA = () => {
  try {
    localStorage.setItem(OPT_OUT_KEY, "1");
  } catch {
    /* storage disabled — the in-memory flag below still applies */
  }

  if (MEASUREMENT_ID) window[`ga-disable-${MEASUREMENT_ID}`] = true;
};

export const gaPageView = (path) => {
  if (!initialized || isOptedOut() || isIgnoredPath(path)) return;

  const location = window.location.href;
  const referrer = lastLocation || document.referrer || undefined;
  lastLocation = location;

  setTimeout(() => {
    gtag("event", "page_view", {
      page_location: location,
      page_path: path,
      page_title: document.title,
      page_referrer: referrer,
    });
  }, TITLE_SETTLE_MS);
};

// Custom events. Never pass personal data (names, emails, message text) —
// Google's terms forbid sending PII to Analytics.
export const gaEvent = (name, params = {}) => {
  if (!initialized || isOptedOut() || isIgnoredPath(window.location.pathname)) return;

  gtag("event", name, params);
};
