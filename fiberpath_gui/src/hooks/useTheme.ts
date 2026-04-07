import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";
export type ThemePreference = ThemeMode | null;

const STORAGE_KEY = "fiberpath-theme";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
};

const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  return null;
};

export interface UseThemeResult {
  theme: ThemeMode;
  setTheme: (nextTheme: ThemePreference) => void;
  isSystemTheme: boolean;
}

export function useTheme(): UseThemeResult {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  );
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(() => getSystemTheme());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    const handleThemeChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    if (themePreference !== null) {
      return;
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleThemeChange);
      return () => {
        mediaQuery.removeEventListener("change", handleThemeChange);
      };
    }

    mediaQuery.addListener(handleThemeChange);
    return () => {
      mediaQuery.removeListener(handleThemeChange);
    };
  }, [themePreference]);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    setThemePreference(nextTheme);

    if (typeof window === "undefined") {
      return;
    }

    if (nextTheme === null) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    if (themePreference === null) {
      root.removeAttribute("data-theme");
      return;
    }

    root.setAttribute("data-theme", themePreference);
  }, [themePreference]);

  return {
    theme: themePreference ?? systemTheme,
    setTheme,
    isSystemTheme: themePreference === null,
  };
}
