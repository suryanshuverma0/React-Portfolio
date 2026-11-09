import { useEffect, useMemo, useState } from "react";

import { Link, useLocation } from "react-router-dom";

import { ArrowUpRight, Menu, X } from "lucide-react";

import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";

import Container from "../ui/Container";

import ThemeToggle from "../ui/ThemeToggle";

import Wordmark from "../ui/Wordmark";

import Magnetic from "../motion/Magnetic";

import NavItem from "./NavItem";

import { navbarContent } from "../content/navbarContent";

import { arrangeNavItems, useAppearance } from "../../lib/appearance";

function Navbar() {
  // Section links follow the order/visibility set in admin → Appearance.
  const { sections } = useAppearance();

  const navItems = useMemo(() => arrangeNavItems(navbarContent, sections), [sections]);

  const desktopItems = navItems.filter((item) => item.desktop !== false);

  const location = useLocation();

  const onRoutedPage = location.pathname !== "/";

  const [mobileOpen, setMobileOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  const [activeSection, setActiveSection] = useState("Home");

  // Thin reading-progress line along the top edge of the bar.
  const { scrollYProgress } = useScroll();

  const progress = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  });

  // Hidden at the very top so a zero-width line doesn't leave a 1px speck.
  const progressOpacity = useTransform(scrollYProgress, [0, 0.01], [0, 1]);

  /* ========================================
     ROUTED PAGE (e.g. /blog) — active nav
     item comes from the URL, not scroll
     position, since there are no in-page
     sections to detect here.
  ========================================= */

  useEffect(() => {
    if (!onRoutedPage) return;

    const matched = navItems.find(
      (item) =>
        !item.href.startsWith("#") &&
        location.pathname.startsWith(item.href),
    );

    setActiveSection(matched ? matched.label : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRoutedPage, location.pathname]);

  /* ========================================
     SCROLL DETECTION
  ========================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);

      if (onRoutedPage) return;

      let current = "Home";

      navItems.forEach((item) => {
        if (!item.href.startsWith("#")) return;

        const section = document.getElementById(item.href.slice(1));

        if (!section) return;

        const rect = section.getBoundingClientRect();

        if (rect.top <= 140 && rect.bottom >= 140) {
          current = item.label;
        }
      });

      setActiveSection(current);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems, onRoutedPage]);

  /* ========================================
     CLOSE MOBILE ON RESIZE
  ========================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock page scroll behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Off the homepage, in-page anchors must route back to "/" first.
  const PageLink = onRoutedPage ? Link : "a";

  const pageHref = (hash) => (onRoutedPage ? { to: `/${hash}` } : { href: hash });

  return (
    <header
      className="
        fixed
        top-0
        left-0

        w-full

        z-50

        pt-3
        sm:pt-4
      "
    >
      <Container>
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`
            relative

            flex
            items-center
            justify-between

            gap-3

            h-14
            md:h-[60px]

            pl-4
            pr-2
            md:pl-5

            rounded-full

            border

            backdrop-blur-xl
            backdrop-saturate-150

            transition-[background-color,border-color,box-shadow]
            duration-300

            ${
              scrolled || mobileOpen
                ? "bg-background/80 border-border shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]"
                : "bg-background/40 border-transparent"
            }
          `}
        >
          {/* PROGRESS */}

          {!onRoutedPage && (
            <span aria-hidden="true" className="absolute inset-x-6 bottom-0 h-px overflow-hidden">
              <motion.span
                style={{ scaleX: progress, opacity: progressOpacity }}
                className="block h-full origin-left bg-primary/60"
              />
            </span>
          )}

          {/* LOGO */}

          <PageLink
            {...(onRoutedPage ? { to: "/" } : { href: "#home" })}
            aria-label="Suryanshu Verma — home"
            className="shrink-0 min-w-0"
          >
            <Wordmark />
          </PageLink>

          {/* DESKTOP NAV */}

          <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5">
            {desktopItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                active={activeSection === item.label}
              />
            ))}
          </nav>

          {/* ACTIONS */}

          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle round />

            <Magnetic strength={0.25} className="hidden sm:inline-flex">
              <PageLink
                {...pageHref("#contact")}
                className="btn btn-primary h-10! px-4! text-[13.5px]!"
              >
                Let&apos;s talk
                <ArrowUpRight size={14} aria-hidden="true" />
              </PageLink>
            </Magnetic>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="
                lg:hidden

                h-10
                w-10

                rounded-full

                flex
                items-center
                justify-center

                text-primary

                hover:bg-surface

                transition-colors
              "
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </motion.div>

        {/* MOBILE MENU */}

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden mt-2 origin-top"
            >
              <div
                data-lenis-prevent
                className="
                  max-h-[calc(100svh-6rem)]

                  overflow-y-auto

                  rounded-[calc(28px*var(--radius-scale))]

                  border
                  border-border

                  bg-background/95

                  backdrop-blur-xl

                  shadow-[0_30px_60px_-20px_rgba(0,0,0,0.3)]

                  px-6
                  pt-3
                  pb-6
                "
              >
                <nav aria-label="Mobile" className="flex flex-col">
                  {navItems.map((item, index) => (
                    <NavItem
                      key={item.label}
                      item={item}
                      index={index}
                      mobile
                      active={activeSection === item.label}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>

                <PageLink
                  {...pageHref("#contact")}
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary w-full mt-6"
                >
                  Let&apos;s talk
                  <ArrowUpRight size={15} aria-hidden="true" />
                </PageLink>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}

export default Navbar;
