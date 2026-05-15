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
        <div className="relative">
          <button 
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 text-app-muted hover:text-app-text hover:bg-app-surface rounded-xl transition-all"
            title="Switch Theme"
          >
            {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {isThemeMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsThemeMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-40 bg-app-surface border border-app-border rounded-2xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => toggleTheme("light")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${theme === 'light' ? 'bg-blue-500 text-white' : 'text-app-muted hover:bg-app-bg'}`}
                    >
                      <Sun className="w-4 h-4" />
                      Light Mode
                    </button>
                    <button 
                      onClick={() => toggleTheme("dark")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-blue-500 text-white' : 'text-app-muted hover:bg-app-bg'}`}
                    >
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

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
