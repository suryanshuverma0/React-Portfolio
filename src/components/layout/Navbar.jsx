import {
  useEffect,
  useState,
} from "react";

import {
  Menu,
  X,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import Container
from "../ui/Container";

import ThemeToggle
from "../ui/ThemeToggle";

import NavItem
from "./NavItem";

import {
  navbarContent,
} from "../content/navbarContent";

function Navbar() {

  const navItems =
    navbarContent;

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    scrolled,
    setScrolled,
  ] = useState(false);

  const [
    activeSection,
    setActiveSection,
  ] = useState("Home");

  /* ========================================
     SCROLL DETECTION
  ========================================= */

  useEffect(() => {

    const handleScroll =
      () => {

        setScrolled(
          window.scrollY > 12
        );

        let current =
          "Home";

        navItems.forEach(
          (item) => {

            const sectionId =
              item.href.replace(
                "#",
                ""
              );

            const section =
              document.getElementById(
                sectionId
              );

            if (!section)
              return;

            const rect =
              section.getBoundingClientRect();

            if (
              rect.top <= 140 &&
              rect.bottom >= 140
            ) {

              current =
                item.label;
            }
          }
        );

        setActiveSection(
          current
        );
      };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );

  }, [navItems]);

  /* ========================================
     CLOSE MOBILE ON RESIZE
  ========================================= */

  useEffect(() => {

    const handleResize =
      () => {

        if (
          window.innerWidth >= 1024
        ) {

          setMobileOpen(
            false
          );
        }
      };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );

  }, []);

  return (

    <header
      className="
        fixed
        top-0
        left-0

        w-full

        z-50

        px-3
        sm:px-4

        pt-3
        sm:pt-4
      "
    >

      <Container>

        {/* NAVBAR */}

        <motion.div

          initial={{
            y: -24,
            opacity: 0,
          }}

          animate={{
            y: 0,
            opacity: 1,
          }}

          transition={{
            duration: 0.45,
          }}

          className={`
            glass

            flex
            items-center
            justify-between

            h-[62px]
            md:h-[68px]

            px-3
            sm:px-4
            md:px-5

            rounded-2xl

            transition-all
            duration-300

            ${
              scrolled
                ? `
                  shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                `
                : ""
            }
          `}
        >

          {/* LOGO */}

          <a

            href="#home"

            className="
              flex
              items-center

              gap-3

              min-w-0

              shrink-0
            "
          >

            {/* ICON */}

            <div
              className="
                h-9
                w-9

                md:h-10
                md:w-10

                rounded-xl

                bg-primary

                text-background

                flex
                items-center
                justify-center

                text-sm
                font-semibold

                shrink-0
              "
            >

              SV

            </div>

            {/* TEXT */}

            <div
              className="
                hidden
                sm:flex

                flex-col

                min-w-0
              "
            >

              <span
                className="
                  text-sm

                  font-semibold

                  tracking-tight

                  truncate
                "
              >

                Suryanshu Verma

              </span>

              <span
                className="
                  text-[11px]

                  text-muted

                  truncate
                "
              >

                Blockchain Engineer

              </span>

            </div>

          </a>

          {/* DESKTOP NAV */}

          <nav
            className="
              hidden
              lg:flex

              items-center

              gap-1
            "
          >

            {navItems.map(
              (item) => (

                <NavItem
                  key={item.label}

                  item={item}

                  active={
                    activeSection ===
                    item.label
                  }
                />

              )
            )}

          </nav>

          {/* ACTIONS */}

          <div
            className="
              flex
              items-center

              gap-2

              shrink-0
            "
          >

            <ThemeToggle />

            {/* MOBILE TOGGLE */}

            <button

              onClick={() =>
                setMobileOpen(
                  !mobileOpen
                )
              }

              aria-label="Toggle menu"

              className="
                lg:hidden

                h-10
                w-10

                rounded-xl

                flex
                items-center
                justify-center

                text-secondary

                hover:text-primary

                hover:bg-black/[0.04]
                dark:hover:bg-white/[0.05]

                transition-all
              "
            >

              {mobileOpen ? (

                <X size={18} />

              ) : (

                <Menu size={18} />

              )}

            </button>

          </div>

        </motion.div>

        {/* MOBILE MENU */}

        <AnimatePresence>

          {mobileOpen && (

            <motion.div

              initial={{
                opacity: 0,
                y: -10,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              exit={{
                opacity: 0,
                y: -10,
              }}

              transition={{
                duration: 0.2,
              }}

              className="
                lg:hidden

                mt-2
              "
            >

              <div
                className="
                  glass

                  rounded-2xl

                  p-2
                "
              >

                <nav
                  className="
                    flex
                    flex-col

                    gap-1
                  "
                >

                  {navItems.map(
                    (item) => (

                      <NavItem
                        key={item.label}

                        item={item}

                        mobile

                        active={
                          activeSection ===
                          item.label
                        }

                        onClick={() =>
                          setMobileOpen(
                            false
                          )
                        }
                      />

                    )
                  )}

                </nav>

              </div>

            </motion.div>

          )}

        </AnimatePresence>

      </Container>

    </header>
  );
}

export default Navbar;
