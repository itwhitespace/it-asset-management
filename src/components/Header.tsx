"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [theme, setTheme] = useState("dark");
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("app-theme", newTheme);
    setIsThemeMenuOpen(false);
  };

  return (
    <header className="h-16 border-b border-app-border bg-app-bg/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 w-full">
      <div className="flex-1 min-w-0 max-w-xs sm:max-w-xl relative ml-10 lg:ml-0">
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-2 flex-shrink-0">
        {/* Theme Switcher */}
        <button 
          onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-app-muted hover:text-app-text hover:bg-app-surface border border-transparent hover:border-app-border rounded-xl transition-all"
        >
          {theme === "dark" ? (
            <>
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2 sm:gap-3 border-l border-app-border pl-2 sm:pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0">
            IT
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-app-text leading-none">Admin User</p>
            <p className="text-[10px] text-app-muted mt-1 uppercase font-bold tracking-wider">IT Department</p>
          </div>
        </div>
      </div>
    </header>
  );
}
