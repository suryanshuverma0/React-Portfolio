import api from "./axios";
import { getVisitorId } from "./visitorId";

/* ========================================
   VISITOR JOURNEY TRACKER

   Records what a visitor does on the public
   portfolio (pages, sections seen and for how
   long, scroll depth, clicks, outbound links,
   downloads, form submits) and ships it in
   small batches to /analytics/collect.

   Device, IP and location are derived on the
   server — only screen/language/UTM context is
   sent from here. Form field values are never
   recorded; only explicit trackEvent() calls
   attach meta.
========================================= */

const SESSION_KEY = "portfolio_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const FLUSH_INTERVAL_MS = 10 * 1000;
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const MAX_BATCH = 40;
const MIN_SECTION_DWELL_MS = 1000;
const SCROLL_MILESTONES = [25, 50, 75, 90, 100];

// Admin panel usage is not part of the visitor journey.
const IGNORED_PATH_PREFIXES = ["/dashboard"];

const endpoint = () => `${api.defaults.baseURL}/analytics/collect`;

let initialized = false;
let queue = [];
let context = null;

const page = {
  path: null,
  visibleSince: null,
  visibleMs: 0,
  scrollMilestones: new Set(),
};

// Last time engagement was reported to the server via heartbeat.
let engagementSince = null;

const sections = new Map(); // id -> { visible, enteredAt }
let sectionObserver = null;

/* ---------- helpers ---------- */

const safeStorage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode / storage disabled — session just won't persist */
    }
  },
};

const isIgnoredPath = (path = window.location.pathname) =>
  IGNORED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

const isVisible = () => document.visibilityState === "visible";

const cleanText = (text, max = 120) =>
  (text || "").replace(/\s+/g, " ").trim().slice(0, max);

const randomId = () =>
  crypto?.randomUUID?.() ||
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

// Returns the active session id, starting a new session after 30 minutes
// of inactivity. Shared across tabs via localStorage.
const touchSession = () => {
  const now = Date.now();
  let session = safeStorage.get(SESSION_KEY);
  let isNew = false;

  if (!session?.id || now - session.lastActivity > SESSION_TIMEOUT_MS) {
    session = { id: randomId() };
    isNew = true;
  }

  session.lastActivity = now;
  safeStorage.set(SESSION_KEY, session);

  return { id: session.id, isNew };
};

const buildContext = () => {
  const params = new URLSearchParams(window.location.search);
  const utm = {};

  ["source", "medium", "campaign", "term", "content"].forEach((key) => {
    const value = params.get(`utm_${key}`);
    if (value) utm[key] = value.slice(0, 100);
  });

  return {
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    language: navigator.language?.slice(0, 20),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connection: navigator.connection?.effectiveType,
    touch: navigator.maxTouchPoints > 0,
    colorScheme: window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
    landingUrl: `${window.location.pathname}${window.location.search}`.slice(0, 500),
    utm: Object.keys(utm).length ? utm : undefined,
  };
};

/* ---------- queue & transport ---------- */

const send = (payload, useBeacon) => {
  const body = JSON.stringify(payload);

  if (useBeacon && navigator.sendBeacon) {
    // text/plain keeps this a "simple" CORS request (no preflight).
    const queued = navigator.sendBeacon(endpoint(), new Blob([body], { type: "text/plain" }));
    if (queued) return;
  }

  fetch(endpoint(), {
    method: "POST",
    body,
    headers: { "Content-Type": "text/plain" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => {
    /* analytics must never break the page */
  });
};

export const flush = (useBeacon = false) => {
  while (queue.length) {
    const sid = queue[0].sid;
    let count = 0;

    while (count < queue.length && count < MAX_BATCH && queue[count].sid === sid) {
      count += 1;
    }

    const batch = queue.splice(0, count);

    send(
      {
        sessionId: sid,
        visitorId: getVisitorId(),
        sentAt: Date.now(),
        context: context || undefined,
        events: batch.map((entry) => {
          const event = { ...entry };
          delete event.sid;
          return event;
        }),
      },
      useBeacon,
    );
  }
};

const push = (event) => {
  const { id: sid, isNew } = touchSession();

  // A visitor who idles past the session timeout and comes back starts a
  // fresh session — open it with a page_view so it has an entry page.
  if (isNew && event.type !== "page_view" && page.path) {
    queue.push({ sid, type: "page_view", path: page.path, title: document.title, ts: Date.now() });
  }

  const entry = { sid, path: page.path || window.location.pathname, ts: Date.now(), ...event };
  queue.push(entry);

  if (queue.length >= MAX_BATCH) flush();

  return entry;
};

export const trackEvent = (type, data = {}) => {
  if (isIgnoredPath()) return;

  push({ type, ...data });
};

/* ---------- page time ---------- */

const pageVisibleMs = () =>
  page.visibleMs + (page.visibleSince ? Date.now() - page.visibleSince : 0);

const sendHeartbeat = () => {
  if (!engagementSince || isIgnoredPath(page.path || undefined)) return;

  const now = Date.now();
  const value = now - engagementSince;
  engagementSince = isVisible() ? now : null;

  if (value > 0) push({ type: "heartbeat", value });
};

const leaveCurrentPage = () => {
  if (!page.path || isIgnoredPath(page.path)) return;

  closeAllSections();
  sendHeartbeat();
  push({ type: "page_leave", path: page.path, value: pageVisibleMs() });
};

export const trackPageView = (path) => {
  leaveCurrentPage();

  page.path = path;
  page.visibleMs = 0;
  page.visibleSince = isVisible() ? Date.now() : null;
  page.scrollMilestones = new Set();

  if (isIgnoredPath(path)) {
    flush();
    return;
  }

  engagementSince = isVisible() ? Date.now() : null;

  const event = push({ type: "page_view", path, title: document.title });

  // react-helmet sets the new title asynchronously after the route renders.
  setTimeout(() => {
    event.title = cleanText(document.title, 200);
  }, 800);

  scanSections();
};

/* ---------- sections ---------- */

const sectionInView = (entry) =>
  entry.isIntersecting &&
  (entry.intersectionRatio >= 0.5 ||
    entry.intersectionRect.height >= window.innerHeight * 0.5);

const openSection = (id) => {
  const state = sections.get(id);
  if (state && !state.enteredAt) state.enteredAt = Date.now();
};

const closeSection = (id) => {
  const state = sections.get(id);
  if (!state?.enteredAt) return;

  const dwell = Date.now() - state.enteredAt;
  const enteredAt = state.enteredAt;
  state.enteredAt = null;

  if (dwell >= MIN_SECTION_DWELL_MS && !isIgnoredPath(page.path || undefined)) {
    // Stamped with the entry time so the journey timeline orders sections
    // by when they were reached.
    push({ type: "section_view", section: id, value: dwell, ts: enteredAt });
  }
};

function closeAllSections() {
  sections.forEach((_, id) => closeSection(id));
}

const reopenVisibleSections = () => {
  sections.forEach((state, id) => {
    if (state.visible) openSection(id);
  });
};

function scanSections() {
  if (!sectionObserver) return;

  document.querySelectorAll("section[id]").forEach((el) => {
    const existing = sections.get(el.id);
    if (existing?.el === el) return;

    if (existing) {
      closeSection(el.id);
      sectionObserver.unobserve(existing.el);
    }

    sections.set(el.id, { el, visible: false, enteredAt: null });
    sectionObserver.observe(el);
  });

  // Forget sections removed by a route change.
  sections.forEach((state, id) => {
    if (!document.body.contains(state.el)) {
      closeSection(id);
      sectionObserver.unobserve(state.el);
      sections.delete(id);
    }
  });
}

/* ---------- scroll depth ---------- */

let scrollTimer = null;

const onScroll = () => {
  if (scrollTimer) return;

  scrollTimer = setTimeout(() => {
    scrollTimer = null;

    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const percent = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100));

    SCROLL_MILESTONES.forEach((milestone) => {
      if (percent >= milestone && !page.scrollMilestones.has(milestone)) {
        page.scrollMilestones.add(milestone);
        trackEvent("scroll_depth", { value: milestone });
      }
    });
  }, 400);
};

/* ---------- clicks ---------- */

const classifyLink = (anchor) => {
  const href = anchor.getAttribute("href") || "";

  if (/^(mailto|tel|sms):/i.test(href)) return "contact_link";

  if (
    anchor.hasAttribute("download") ||
    /\.(pdf|docx?|zip|pptx?)(\?|#|$)/i.test(href) ||
    /(resume|cv)\b/i.test(href)
  ) {
    return "download";
  }

  try {
    const url = new URL(anchor.href, window.location.href);
    if (/^https?:$/.test(url.protocol) && url.hostname !== window.location.hostname) {
      return "outbound_click";
    }
  } catch {
    /* ignore malformed hrefs */
  }

  return "click";
};

const onClick = (e) => {
  const el = e.target?.closest?.("a, button, [role='button'], [data-track]");
  if (!el || el.closest("[data-track-ignore]")) return;

  const anchor = el.closest("a[href]");
  const type = anchor ? classifyLink(anchor) : "click";

  let target;
  if (anchor) {
    const href = anchor.getAttribute("href");
    target = href?.startsWith("#") ? href : anchor.href;
  }

  let hostLabel;
  try {
    hostLabel = target && !target.startsWith("#") ? new URL(target).hostname.replace(/^www\./, "") : undefined;
  } catch {
    hostLabel = undefined;
  }

  const label =
    cleanText(el.dataset.track) ||
    cleanText(el.getAttribute("aria-label")) ||
    cleanText(el.getAttribute("title")) ||
    cleanText(el.innerText) ||
    cleanText(el.querySelector("img")?.getAttribute("alt")) ||
    hostLabel ||
    el.tagName.toLowerCase();

  const section =
    el.closest("section[id]")?.id ||
    (el.closest("nav, header") ? "navbar" : el.closest("footer") ? "footer" : undefined);

  trackEvent(type, {
    label,
    section,
    target: target?.slice(0, 500),
  });
};

/* ---------- visibility & lifecycle ---------- */

const onVisibilityChange = () => {
  if (isVisible()) {
    page.visibleSince = Date.now();
    engagementSince = Date.now();
    reopenVisibleSections();
    return;
  }

  if (page.visibleSince) {
    page.visibleMs += Date.now() - page.visibleSince;
    page.visibleSince = null;
  }

  closeAllSections();
  sendHeartbeat();
  flush(true);
};

const onPageHide = () => {
  leaveCurrentPage();
  page.path = null;
  flush(true);
};

const onPageShow = (e) => {
  // Restored from the back/forward cache — the old page was "left" in
  // pagehide, so count it as a fresh view.
  if (e.persisted) trackPageView(window.location.pathname);
};

export const initTracker = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  context = buildContext();

  if ("IntersectionObserver" in window) {
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const state = sections.get(entry.target.id);
          if (!state || state.el !== entry.target) return;

          state.visible = sectionInView(entry);

          if (state.visible && isVisible()) openSection(entry.target.id);
          else if (!state.visible) closeSection(entry.target.id);
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    // Sections mount asynchronously (page transitions, data loading), so
    // keep picking up new ones.
    let scanTimer = null;
    new MutationObserver(() => {
      clearTimeout(scanTimer);
      scanTimer = setTimeout(scanSections, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("click", onClick, { capture: true, passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);

  setInterval(() => flush(), FLUSH_INTERVAL_MS);
  setInterval(() => {
    if (isVisible() && page.path && !isIgnoredPath(page.path)) sendHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
};
