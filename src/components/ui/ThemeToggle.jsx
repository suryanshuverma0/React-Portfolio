import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // INITIALIZE THEME
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      const isDark = savedTheme === "dark";

      setDarkMode(isDark);

      document.documentElement.classList.toggle("dark", isDark);

      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    setDarkMode(prefersDark);

    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  // TOGGLE THEME
  const toggleTheme = () => {
    const newTheme = !darkMode;

    setDarkMode(newTheme);

    document.documentElement.classList.toggle("dark", newTheme);

    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="
        glass

        relative

        h-control
        w-11

        flex
        items-center
        justify-center

        rounded-control

        text-secondary
        hover:text-primary

        hover:bg-black/5
        dark:hover:bg-white/5

        transition-all
        duration-300

        active:scale-95
      "
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
