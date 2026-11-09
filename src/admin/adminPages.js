import { lazy } from "react";

/* ========================================
   ADMIN PAGES — one place for every lazily
   loaded dashboard screen.

   Each page is its own chunk so visitors to
   the portfolio never download admin code.
   Inside the dashboard, though, waiting on a
   chunk is what made navigation blink — so
   the layout preloads every page once the
   browser is idle, and the sidebar preloads
   a page on hover/focus. After that, every
   click renders instantly.
========================================= */

const loaders = {
  "/dashboard": () => import("./pages/Dashboard"),
  "/dashboard/profile": () => import("./pages/Profile"),
  "/dashboard/education": () => import("./pages/Education"),
  "/dashboard/stats": () => import("./pages/Stats"),
  "/dashboard/experience": () => import("./pages/Experience"),
  "/dashboard/services": () => import("./pages/Services"),
  "/dashboard/projects": () => import("./pages/Projects"),
  "/dashboard/certificates": () => import("./pages/Certificates"),
  "/dashboard/skill": () => import("./pages/Skills"),
  "/dashboard/analytics": () => import("./pages/Analytics"),
  "/dashboard/visitors": () => import("./pages/Visitors"),
  "/dashboard/visitors/:sessionId": () => import("./pages/VisitorSession"),
  "/dashboard/users": () => import("./pages/Users"),
  "/dashboard/blog": () => import("./pages/Blog"),
  "/dashboard/blog/editor": () => import("./pages/BlogEditor"),
  "/dashboard/blog/comments": () => import("./pages/BlogComments"),
  "/dashboard/blog/analytics": () => import("./pages/BlogAnalytics"),
  "/dashboard/messages": () => import("./pages/Messages"),
  "/dashboard/security": () => import("./pages/Security"),
  "/dashboard/storage": () => import("./pages/Storage"),
  "/dashboard/card": () => import("./pages/CardAdmin"),
  "/dashboard/notes": () => import("./pages/Notes"),
  "/dashboard/automations": () => import("./pages/Automations"),
  "/dashboard/report": () => import("./pages/ExecutiveReport"),
  "/dashboard/goals": () => import("./pages/Goals"),
  "/dashboard/audit": () => import("./pages/AuditLog"),
  "/dashboard/system": () => import("./pages/SystemHealth"),
  "/dashboard/settings": () => import("./pages/Settings"),
  "/dashboard/appearance": () => import("./pages/Appearance"),
  "/dashboard/devices": () => import("./pages/Devices"),
  "/dashboard/qr": () => import("./pages/QrStudio"),
  "/dashboard/resume": () => import("./pages/ResumeBuilder"),
  "/dashboard/research": () => import("./pages/ResearchAdmin"),
  "/dashboard/products": () => import("./pages/ProductsAdmin"),
};

// A failed preload (offline, deploy swapped chunks) must not stay cached as
// a rejected promise — drop it so the real navigation retries.
const pending = new Map();

const load = (key) => {
  if (!pending.has(key)) {
    pending.set(
      key,
      loaders[key]().catch((error) => {
        pending.delete(key);
        throw error;
      }),
    );
  }

  return pending.get(key);
};

const page = (key) => lazy(() => load(key));

export const AdminLayout = lazy(() => import("./layout/AdminLayout"));

export const Dashboard = page("/dashboard");
export const Profile = page("/dashboard/profile");
export const Education = page("/dashboard/education");
export const Stats = page("/dashboard/stats");
export const Experience = page("/dashboard/experience");
export const Services = page("/dashboard/services");
export const Projects = page("/dashboard/projects");
export const Certificates = page("/dashboard/certificates");
export const Skills = page("/dashboard/skill");
export const Analytics = page("/dashboard/analytics");
export const Visitors = page("/dashboard/visitors");
export const VisitorSession = page("/dashboard/visitors/:sessionId");
export const Users = page("/dashboard/users");
export const AdminBlog = page("/dashboard/blog");
export const BlogEditor = page("/dashboard/blog/editor");
export const BlogComments = page("/dashboard/blog/comments");
export const BlogAnalytics = page("/dashboard/blog/analytics");
export const Messages = page("/dashboard/messages");
export const Security = page("/dashboard/security");
export const Storage = page("/dashboard/storage");
export const CardAdmin = page("/dashboard/card");
export const Notes = page("/dashboard/notes");
export const Automations = page("/dashboard/automations");
export const ExecutiveReport = page("/dashboard/report");
export const Goals = page("/dashboard/goals");
export const AuditLog = page("/dashboard/audit");
export const SystemHealth = page("/dashboard/system");
export const Settings = page("/dashboard/settings");
export const Appearance = page("/dashboard/appearance");
export const Devices = page("/dashboard/devices");
export const QrStudio = page("/dashboard/qr");
export const ResumeBuilder = page("/dashboard/resume");
export const ResearchAdmin = page("/dashboard/research");
export const ProductsAdmin = page("/dashboard/products");

// Preload the chunk behind a sidebar link (exact path match).
export const preloadAdminPage = (path) => {
  if (loaders[path]) load(path).catch(() => {});
};

// Warm every admin chunk, a few at a time, while the browser is idle.
export const preloadAllAdminPages = () => {
  const queue = Object.keys(loaders);

  const idle = (fn) =>
    "requestIdleCallback" in window
      ? window.requestIdleCallback(fn, { timeout: 2000 })
      : setTimeout(fn, 200);

  const next = () => {
    const batch = queue.splice(0, 3);
    if (!batch.length) return;

    Promise.allSettled(batch.map(load)).then(() => idle(next));
  };

  idle(next);
};
