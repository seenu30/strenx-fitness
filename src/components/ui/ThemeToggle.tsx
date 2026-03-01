"use client";

import { useTheme } from "@/context/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return placeholder to prevent layout shift
    return (
      <button
        className="p-2 rounded-lg bg-secondary/50"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getLabel = () => {
    if (theme === "system") return "System theme";
    if (theme === "dark") return "Dark mode";
    return "Light mode";
  };

  if (compact) {
    return (
      <button
        onClick={cycleTheme}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label={getLabel()}
        aria-pressed={theme === "dark"}
        title={getLabel()}
      >
        <div className="relative w-5 h-5">
          <div
            className={`absolute inset-0 transition-all duration-200 ${
              resolvedTheme === "dark"
                ? "rotate-0 opacity-100"
                : "rotate-180 opacity-0"
            }`}
          >
            <Moon className="w-5 h-5" />
          </div>
          <div
            className={`absolute inset-0 transition-all duration-200 ${
              resolvedTheme === "light"
                ? "rotate-0 opacity-100"
                : "-rotate-180 opacity-0"
            }`}
          >
            <Sun className="w-5 h-5" />
          </div>
          <div
            className={`absolute inset-0 transition-all duration-200 ${
              theme === "system"
                ? "scale-100 opacity-100"
                : "scale-0 opacity-0"
            }`}
          >
            <Monitor className="w-5 h-5" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md transition-all duration-200 ${
          theme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Light mode"
        aria-pressed={theme === "light"}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-md transition-all duration-200 ${
          theme === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Dark mode"
        aria-pressed={theme === "dark"}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-md transition-all duration-200 ${
          theme === "system"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="System theme"
        aria-pressed={theme === "system"}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ThemeToggle;
