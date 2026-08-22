"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * ThemeToggle – a simple light/dark mode switch.
 * The component reads/writes the current theme to localStorage and toggles the
 * `dark` class on the <html> element. It also respects the OS prefers‑color‑scheme
 * media query on first load.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Initialise theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const defaultDark = stored ? stored === "dark" : prefersDark;
    setIsDark(defaultDark);
    document.documentElement.classList.toggle("dark", defaultDark);
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={isDark}
      className="flex items-center justify-center rounded-full p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
}
