import {
  LayoutDashboard,
  User,
  FolderKanban,
  Award,
  Brain,
  Settings,
  School,
  Activity,
  Briefcase,
  Layers3,
  BarChart3,
  Users as UsersIcon,
  Newspaper,
  Mail,
  ShieldCheck,
  Footprints,
  Database,
  Nfc,
  NotebookPen,
  Workflow,
  FileBarChart,
  ChartNoAxesCombined,
  Target,
  ScrollText,
  HeartPulse,
  Paintbrush,
  FileUser,
  QrCode,
  Smartphone,
  FlaskConical,
  Package,
  LayoutList,
  LockKeyhole,
  Heart,
  CalendarDays,
  Bookmark as BookmarkIcon,
} from "lucide-react";

/*
  Grouped navigation. Each group has an id (remembered open/closed state),
  an icon (shown in the collapsed rail) and items; `keywords` help the
  sidebar filter and the Ctrl+K palette find a page by what it does.
*/
export const sidebarLinks = [
  {
    id: "overview",
    section: "Overview",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, keywords: "home overview kpi" },
      { label: "Executive Report", path: "/dashboard/report", icon: FileBarChart, keywords: "weekly summary score" },
      { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3, keywords: "traffic views visitors charts" },
      { label: "Visitors", path: "/dashboard/visitors", icon: Footprints, keywords: "sessions journeys live map companies" },
      { label: "Goals & Funnels", path: "/dashboard/goals", icon: Target, keywords: "conversion funnel" },
    ],
  },
  {
    id: "portfolio",
    section: "Portfolio",
    icon: Briefcase,
    items: [
      { label: "Profile", path: "/dashboard/profile", icon: User, keywords: "name headline about photo" },
      { label: "Experience", path: "/dashboard/experience", icon: Briefcase, keywords: "jobs work internship" },
      { label: "Education", path: "/dashboard/education", icon: School, keywords: "degree college school" },
      { label: "Projects", path: "/dashboard/projects", icon: FolderKanban, keywords: "work case study github" },
      { label: "Research", path: "/dashboard/research", icon: FlaskConical, keywords: "papers publications conference journal" },
      { label: "Products", path: "/dashboard/products", icon: Package, keywords: "saas apps live shipped website mobile" },
      { label: "Skills", path: "/dashboard/skill", icon: Brain, keywords: "technologies tools" },
      { label: "Services", path: "/dashboard/services", icon: Layers3, keywords: "offer freelance" },
      { label: "Certificates", path: "/dashboard/certificates", icon: Award, keywords: "courses certifications" },
      { label: "Stats", path: "/dashboard/stats", icon: Activity, keywords: "numbers counters" },
    ],
  },
  {
    id: "content",
    section: "Content & sharing",
    icon: Newspaper,
    items: [
      { label: "Blog", path: "/dashboard/blog", icon: Newspaper, keywords: "posts articles write" },
      { label: "Blog Analytics", path: "/dashboard/blog/analytics", icon: ChartNoAxesCombined, keywords: "readers comments" },
      { label: "Messages", path: "/dashboard/messages", icon: Mail, keywords: "contact inbox email" },
      { label: "Homepage sections", path: "/dashboard/sections", icon: LayoutList, keywords: "show hide enable disable reorder sections homepage order" },
      { label: "Appearance", path: "/dashboard/appearance", icon: Paintbrush, keywords: "theme colours fonts sections order hide show" },
      { label: "Resume Builder", path: "/dashboard/resume", icon: FileUser, keywords: "cv pdf ats" },
      { label: "QR Studio", path: "/dashboard/qr", icon: QrCode, keywords: "qr code share print" },
      { label: "NFC Card", path: "/dashboard/card", icon: Nfc, keywords: "business card tap" },
    ],
  },
  {
    id: "personal",
    section: "Life · locked",
    icon: LockKeyhole,
    items: [
      { label: "Life dashboard", path: "/dashboard/life", icon: Heart, keywords: "personal life kpi overview lock passphrase" },
      { label: "Planner", path: "/dashboard/planner", icon: CalendarDays, keywords: "tasks todo habits daily weekly monthly yearly goals streak tracker" },
      { label: "Notes", path: "/dashboard/notes", icon: NotebookPen, keywords: "write ink pen" },
      { label: "Bookmarks", path: "/dashboard/bookmarks", icon: BookmarkIcon, keywords: "links saved reading list snippets urls" },
    ],
  },
  {
    id: "system",
    section: "System",
    icon: Settings,
    items: [
      { label: "Security", path: "/dashboard/security", icon: ShieldCheck, keywords: "password passkey mfa blocklist" },
      { label: "Devices", path: "/dashboard/devices", icon: Smartphone, keywords: "sessions install app push qr sign in" },
      { label: "Users", path: "/dashboard/users", icon: UsersIcon, keywords: "accounts" },
      { label: "Audit Log", path: "/dashboard/audit", icon: ScrollText, keywords: "history actions logins" },
      { label: "System Health", path: "/dashboard/system", icon: HeartPulse, keywords: "status uptime database redis" },
      { label: "Automations", path: "/dashboard/automations", icon: Workflow, keywords: "alerts backups email" },
      { label: "Storage", path: "/dashboard/storage", icon: Database, keywords: "files images cloudinary" },
      { label: "Settings", path: "/dashboard/settings", icon: Settings, keywords: "site seo contact socials maintenance" },
    ],
  },
];

// Screens reached from inside a page rather than the sidebar.
const EXTRA_TITLES = [
  { path: "/dashboard/blog/comments", label: "Blog Comments" },
  { path: "/dashboard/blog/new", label: "New Post" },
  { path: "/dashboard/visitors/", label: "Visitor Session" },
];

const EDIT_POST = /^\/dashboard\/blog\/[^/]+\/edit$/;

// Title for any admin path: the longest sidebar (or extra) path it sits under.
export const getAdminTitle = (pathname) => {
  if (EDIT_POST.test(pathname)) return "Edit Post";

  const candidates = [...sidebarLinks.flatMap((section) => section.items), ...EXTRA_TITLES];

  const match = candidates
    .filter(({ path }) => pathname === path || pathname.startsWith(path.endsWith("/") ? path : `${path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return match?.label || "Admin";
};