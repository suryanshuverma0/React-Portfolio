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
} from "lucide-react";

export const sidebarLinks = [
  {
    section: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Executive Report",
        path: "/dashboard/report",
        icon: FileBarChart,
      },
      {
        label: "Notes",
        path: "/dashboard/notes",
        icon: NotebookPen,
      },
      {
        label: "Profile",
        path: "/dashboard/profile",
        icon: User,
      },
      {
        label: "Education",
        path: "/dashboard/education",
        icon: School,
      },
      {
        label: "Stats",
        path: "/dashboard/stats",
        icon: Activity,
      },
      {
        label: "Experience",
        path: "/dashboard/experience",
        icon: Briefcase,
      },
       {
        label: "Services",
        path: "/dashboard/services",
        icon: Layers3,
      },
      {
        label: "Projects",
        path: "/dashboard/projects",
        icon: FolderKanban,
      },
      {
        label: "Certificates",
        path: "/dashboard/certificates",
        icon: Award,
      },
      {
        label: "Skills",
        path: "/dashboard/skill",
        icon: Brain,
      },
      {
        label: "Blog",
        path: "/dashboard/blog",
        icon: Newspaper,
      },
      {
        label: "Blog Analytics",
        path: "/dashboard/blog/analytics",
        icon: ChartNoAxesCombined,
      },
      {
        label: "Messages",
        path: "/dashboard/messages",
        icon: Mail,
      },
      {
        label: "Analytics",
        path: "/dashboard/analytics",
        icon: BarChart3,
      },
      {
        label: "Visitors",
        path: "/dashboard/visitors",
        icon: Footprints,
      },
      {
        label: "Goals & Funnels",
        path: "/dashboard/goals",
        icon: Target,
      },
      {
        label: "NFC Card",
        path: "/dashboard/card",
        icon: Nfc,
      },
    ],
  },

  {
    section: "SYSTEM",
    items: [
      {
        label: "Users",
        path: "/dashboard/users",
        icon: UsersIcon,
      },
      {
        label: "Security",
        path: "/dashboard/security",
        icon: ShieldCheck,
      },
      {
        label: "Audit Log",
        path: "/dashboard/audit",
        icon: ScrollText,
      },
      {
        label: "System Health",
        path: "/dashboard/system",
        icon: HeartPulse,
      },
      {
        label: "Automations",
        path: "/dashboard/automations",
        icon: Workflow,
      },
      {
        label: "Storage",
        path: "/dashboard/storage",
        icon: Database,
      },
      {
        label: "Settings",
        path: "/dashboard/settings",
        icon: Settings,
      },
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