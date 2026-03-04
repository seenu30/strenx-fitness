"use client";

import { useTheme } from "@/context/ThemeProvider";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  if (!mounted) {
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

  const getLabel = () => {
    if (theme === "system") return "System theme";
    if (theme === "dark") return "Dark mode";
    return "Light mode";
  };

  const handleSelectTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    setMenuOpen(false);
  };

  const showDark = resolvedTheme === "dark";

  if (compact) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label={getLabel()}
          title={getLabel()}
        >
          <div className="w-5 h-5">
            {showDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 py-1 bg-card border border-border rounded-lg shadow-lg z-50">
            <button
              onClick={() => handleSelectTheme("light")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Sun className="w-4 h-4" />
              <span className="flex-1 text-left">Light</span>
              {theme === "light" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button
              onClick={() => handleSelectTheme("dark")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Moon className="w-4 h-4" />
              <span className="flex-1 text-left">Dark</span>
              {theme === "dark" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button
              onClick={() => handleSelectTheme("system")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Monitor className="w-4 h-4" />
              <span className="flex-1 text-left">System</span>
              {theme === "system" && <Check className="w-4 h-4 text-primary" />}
            </button>
          </div>
        )}
      </div>
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
