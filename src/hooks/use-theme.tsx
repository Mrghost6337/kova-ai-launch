import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "kova-theme";

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // localStorage unavailable — fall through to the default.
  }
  return "dark";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    try {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } catch {
      return "dark";
    }
  }
  return theme;
}

type ThemeContextValue = {
  /** The user's preference: light, dark or system. */
  theme: Theme;
  /** The actually applied theme after resolving "system". */
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme()));

  // Keep "system" in sync with OS changes while the app is open.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => {
      const current = getStoredTheme();
      setThemeState(current);
      setResolved(resolveTheme(current));
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting is best-effort; the in-memory theme still applies.
    }
    setThemeState(next);
    setResolved(resolveTheme(next));
  }, []);

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return context;
}