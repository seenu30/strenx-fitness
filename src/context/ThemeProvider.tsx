"use client";

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * Strenx Theme Provider
 *
 * A custom wrapper around next-themes that:
 * - Uses `.theme-dark` / `.theme-light` CSS classes
 * - Detects system preference via prefers-color-scheme
 * - Persists preference in localStorage with key "strenx-theme"
 * - Prevents flash of incorrect theme (FOUC)
 * - Provides hydration-safe SSR support
 */

interface ThemeContextValue {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
  themes: string[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      storageKey="strenx-theme"
      themes={["light", "dark", "system"]}
      disableTransitionOnChange={false}
    >
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </NextThemesProvider>
  );
}

function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme, themes } = useNextTheme();

  const value: ThemeContextValue = {
    theme,
    setTheme,
    resolvedTheme,
    themes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme state and controls
 *
 * @returns {ThemeContextValue} Theme state and setTheme function
 *
 * @example
 * const { theme, setTheme, resolvedTheme } = useTheme();
 *
 * // Get current theme preference (might be "system")
 * console.log(theme);
 *
 * // Get actual resolved theme ("light" or "dark")
 * console.log(resolvedTheme);
 *
 * // Set theme
 * setTheme("dark");
 * setTheme("light");
 * setTheme("system");
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  // Fall back to next-themes hook if context not available
  // This allows using useTheme even outside our custom provider
  const nextTheme = useNextTheme();

  if (context) {
    return context;
  }

  return nextTheme;
}

/**
 * Hook to check if component has mounted (for hydration safety)
 *
 * @returns {boolean} Whether the component has mounted
 *
 * @example
 * const mounted = useMounted();
 * if (!mounted) return <Placeholder />;
 * return <ActualComponent />;
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted;
}

export { ThemeContext };
