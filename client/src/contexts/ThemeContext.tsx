import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme =
  | "light"
  | "dark"
  | "forest"
  | "purple"
  | "sunset"
  | "ocean"
  | "monochrome"
  | "onedark"
  | "dracula"
  | "palenight"
  | "nord"
  | "synthwave";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  setTheme?: (theme: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Always try to get stored theme first, then fallback to default
    const stored = localStorage.getItem("theme");
    return (stored as Theme) || defaultTheme;
  });

  const setTheme = switchable
    ? (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
      }
    : undefined;

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove(
      "dark",
      "forest",
      "purple",
      "sunset",
      "ocean",
      "monochrome",
      "onedark",
      "dracula",
      "palenight",
      "nord",
      "synthwave"
    );

    // Add the current theme class if not light
    if (theme !== "light") {
      root.classList.add(theme);
    }

    // Save to localStorage if switchable
    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  // Apply theme on initial mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      "dark",
      "forest",
      "purple",
      "sunset",
      "ocean",
      "monochrome",
      "onedark",
      "dracula",
      "palenight",
      "nord",
      "synthwave"
    );
    if (theme !== "light") {
      root.classList.add(theme);
    }
  }, []);

  const toggleTheme = switchable
    ? () => {
        const themes: Theme[] = [
          "light",
          "dark",
          "forest",
          "purple",
          "sunset",
          "ocean",
          "monochrome",
          "onedark",
          "dracula",
          "palenight",
          "nord",
          "synthwave",
        ];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setThemeState(themes[nextIndex]);
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
