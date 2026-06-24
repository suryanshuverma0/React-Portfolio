import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

import ThemeToggle from "../../components/ui/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";

function Header({ setSidebarOpen }) {
  const location = useLocation();

  const { user } = useAuth();

  const getTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") return "Dashboard";
    if (path.includes("/profile")) return "Profile";
    if (path.includes("/education")) return "Education";
    if (path.includes("/stats")) return "Stats";
    if (path.includes("/experience")) return "Experience";
    if (path.includes("/projects")) return "Projects";
    if (path.includes("/certificates")) return "Certificates";
    if (path.includes("/skills")) return "Skills";
    if (path.includes("/settings")) return "Settings";

    return "Admin";
  };

  const getInitials = () => {
    if (!user?.email) return "A";

    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header
      className="
        sticky
        top-0
        z-30

        h-16

        bg-background/80

        backdrop-blur-xl

        border-b
        border-border

        px-4
        md:px-6
        lg:px-8

        flex
        items-center
        justify-between
      "
    >
      {/* LEFT */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            lg:hidden

            h-10
            w-10

            flex
            items-center
            justify-center

            rounded-control

            bg-surface

            border
            border-border

            transition
          "
        >
          <Menu size={18} />
        </button>

        <h1 className="text-title">
          {getTitle()}
        </h1>
      </div>

      {/* RIGHT */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <ThemeToggle />

        <div
          className="
            h-10
            w-10

            rounded-full

            bg-surface

            border
            border-border

            flex
            items-center
            justify-center

            text-label
          "
        >
          {getInitials()}
        </div>
      </div>
    </header>
  );
}

export default Header;