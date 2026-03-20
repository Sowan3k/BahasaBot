"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

/** Consumer hook — use anywhere inside the app to read theme and call toggle. */
export function useTheme() {
  return useContext(ThemeContext);
}

/** Internal hook — used only by ThemeProvider in providers.tsx.
 *  Reads localStorage / system preference on mount, applies the class,
 *  and returns reactive state + toggle for the context value. */
export function useThemeState(): ThemeContextValue {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const system: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initial = saved ?? system;
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return { theme, toggle };
}
