import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "yegara-theme";
const THEME_CHANGE_EVENT = "yegara-theme-change";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "light" || val === "dark" || val === "system") {
      return val;
    }
  } catch {
    // localStorage might be unavailable or restricted
  }
  return "system";
}

function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document !== "undefined") {
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const syncTheme = () => {
      const stored = getStoredTheme();
      const currentResolved = stored === "system" ? getSystemTheme() : stored;
      setThemeState(stored);
      setResolvedTheme(currentResolved);
      applyThemeClass(currentResolved);
    };

    // Initialize on client mount
    syncTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      if (getStoredTheme() === "system") {
        const nextResolved = getSystemTheme();
        setResolvedTheme(nextResolved);
        applyThemeClass(nextResolved);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        syncTheme();
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    window.addEventListener("storage", handleStorageChange);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
      window.removeEventListener("storage", handleStorageChange);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // ignore storage errors
    }
    const nextResolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
    setResolvedTheme(nextResolved);
    applyThemeClass(nextResolved);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    }
  };

  return { theme, setTheme, resolvedTheme };
}
