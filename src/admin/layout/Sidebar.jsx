import { LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import SidebarItem from "../components/SidebarItem";
import { sidebarLinks } from "../constants/sidebarLinks";

function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const { logout, user } = useAuth();

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          onClick={() =>
            setSidebarOpen(false)
          }
          className="
            inset-0

            bg-black/50

            z-40

            lg:hidden
          "
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
                      overflow-y-auto

          top-0
          left-0

          z-50

          h-screen

          w-70

          bg-card

          border-r
          border-border

          flex
          flex-col

          p-4

          transition-transform
          duration-300

          lg:static
          lg:translate-x-0

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Mobile Close */}

        <div
          className="
            flex
            justify-end

            mb-4

            lg:hidden
          "
        >
          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="
              h-10
              w-10

              flex
              items-center
              justify-center

              rounded-control

              bg-surface

              border
              border-border
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Logo */}

        {/* <div className="mb-8">
          <h1 className="text-title">
            Portfolio CMS
          </h1>

          <p className="text-small">
            Admin Panel
          </p>
        </div> */}

        
            <div
              className="
                flex
                items-center

                gap-3
              "
            >
              <div
                className="
                  h-10
                  w-10
                  my-4

                  rounded-xl

                  bg-primary

                  text-background

                  flex
                  items-center
                  justify-center

                  text-sm
                  font-semibold
                "
              >
                SV
              </div>

              <div>
                <p
                  className="
                    text-label
                  "
                >
                  Suryanshu Verma
                </p>

                <p
                  className="
                    text-small
                  "
                >
                  Computer Engineer
                </p>
              </div>
            </div>

        {/* Navigation */}

        <div className="space-y-6">
          {sidebarLinks.map((section) => (
            <div
              key={section.section}
              className="space-y-2"
            >
              <p
                className="
                  text-muted

                  px-2

                  uppercase

                  tracking-wider
                "
              >
                {section.section}
              </p>

              {section.items.map((item) => (
                <SidebarItem
                  key={item.path}
                  {...item}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}

        <div className="mt-auto">
          <div
            className="
              card

              mb-4
            "
          >
            <p className="text-small truncate">
              {user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="
              w-full

              h-control

              flex
              items-center
              justify-center
              gap-2

              rounded-control

              bg-surface

              border
              border-border

              hover:opacity-80

              transition
            "
          >
            <LogOut size={18} />

            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;