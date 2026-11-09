import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// `round` is the borderless circle used inside the public navbar pill.
function ThemeToggle({ round = false }) {
  // The pre-paint script in index.html (and the site's default mode from
  // admin → Appearance) already set <html class="dark">. Read that rather
  // than recomputing it, and follow it if something else changes it.
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDarkMode(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // TOGGLE THEME
  const toggleTheme = () => {
    const newTheme = !darkMode;

    setDarkMode(newTheme);

    document.documentElement.classList.toggle("dark", newTheme);

    try {
      localStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch {
      /* private mode — the toggle still works for this visit */
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className={`
        ${round ? "h-10 w-10 rounded-full hover:bg-surface!" : "glass h-control w-11 rounded-control"}

        relative

        flex
        items-center
        justify-center

        text-secondary
        hover:text-primary

        hover:bg-black/5
        dark:hover:bg-white/5

        transition-all
        duration-300

        active:scale-95
      `}
    >
      {/* SUN ICON */}
      <Sun
        size={18}
        strokeWidth={2.2}
        className={`
          absolute

          transition-all
          duration-300

          ${
            darkMode
              ? `
                rotate-0
                scale-100
                opacity-100
              `
              : `
                -rotate-90
                scale-0
                opacity-0
              `
          }
        `}
      />

      {/* MOON ICON */}
      <Moon
        size={18}
        strokeWidth={2.2}
        className={`
          absolute

          transition-all
          duration-300

          ${
            darkMode
              ? `
                rotate-90
                scale-0
                opacity-0
              `
              : `
                rotate-0
                scale-100
                opacity-100
              `
          }
        `}
      />
    </button>
  );
}

export default ThemeToggle;
