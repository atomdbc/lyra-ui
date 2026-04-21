"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  resolveThemeMode,
  THEME_STORAGE_KEY,
  ThemeMode,
  ThemePreference,
} from "@/core/theme/theme";
import { themeCssVariables } from "@/core/theme/theme-palette";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ThemeMode;
  setPreference: (next: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  resolvedTheme: "light",
  setPreference: () => undefined,
  toggleTheme: () => undefined,
});

const THEME_PREFERENCE_EVENT = "lyra-theme-preference-change";

function getServerPreference(): ThemePreference {
  return "dark";
}

function getClientPreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

function subscribePreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === THEME_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustomEvent = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_PREFERENCE_EVENT, handleCustomEvent);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_PREFERENCE_EVENT, handleCustomEvent);
  };
}

function getServerSystemTheme(): ThemeMode {
  return "light";
}

function getClientSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeSystemTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => onStoreChange();
  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  Object.entries(themeCssVariables[theme]).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const preference = useSyncExternalStore(
    subscribePreference,
    getClientPreference,
    getServerPreference
  );
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getClientSystemTheme,
    getServerSystemTheme
  );

  const resolvedTheme = useMemo(
    () => resolveThemeMode(preference, systemTheme === "dark"),
    [preference, systemTheme]
  );

  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    if (typeof window === "undefined") {
      return;
    }
    if (next === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    window.dispatchEvent(new Event(THEME_PREFERENCE_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setPreference]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
      toggleTheme,
    }),
    [preference, resolvedTheme, setPreference, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
