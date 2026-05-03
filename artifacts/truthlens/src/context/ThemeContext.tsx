import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  isDark: true,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("tl-theme") as Theme) ?? "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("light");
      html.classList.remove("dark");
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
    }
    try { localStorage.setItem("tl-theme", theme); } catch { /* noop */ }
  }, [theme]);

  const toggle = () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    setTheme(t => t === "dark" ? "light" : "dark");
    setTimeout(() => html.classList.remove("theme-transitioning"), 420);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
