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
    ],
  },

  {
    section: "SYSTEM",
    items: [
      {
        label: "Settings",
        path: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];
