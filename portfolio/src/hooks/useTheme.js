import { useLayoutEffect, useState } from "react";

export const useTheme = () => {
  const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme", mode);
  }, [mode]);

  const toggleTheme = () => setMode(prev => (prev === "dark" ? "light" : "dark"));

  return [mode, toggleTheme];
};
