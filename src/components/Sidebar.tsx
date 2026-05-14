"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Monitor, Box, Settings, LogOut, Banknote, Package, Menu, X, ShieldCheck, Lock } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PinModal from "@/components/PinModal";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Computers", href: "/computers", icon: Monitor },
  { name: "Software", href: "/software", icon: Box },
  { name: "Expenses", href: "/expenses", icon: Banknote },
  { name: "Rental Equipments", href: "/rental", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, login, logout } = useAuth();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-app-surface border border-app-border rounded-xl text-app-text shadow-xl"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={clsx(
        "w-64 h-screen border-r border-app-border bg-app-bg/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-app-border">
          <div className="flex items-center gap-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            <Box className="w-6 h-6 text-blue-400" />
            <span>Whitespace Asset</span>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors",
            isAdmin 
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
              : "bg-app-surface text-app-muted border-app-border"
          )}>
            {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isAdmin ? "Admin Mode" : "Public View"}
          </div>
        </div>

        <nav className="flex-1 py-2 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="block relative">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={clsx(
                    "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                    isActive
                      ? "text-blue-400"
                      : "text-app-muted hover:text-app-text hover:bg-app-surface/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-app-border space-y-1">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-app-muted hover:text-app-text hover:bg-app-surface/50 rounded-xl cursor-pointer transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          
          {isAdmin ? (
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl cursor-pointer transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsPinModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl cursor-pointer transition-colors"
            >
              <Lock className="w-5 h-5" />
              <span className="font-medium">Admin Login</span>
            </button>
          )}
        </div>
      </aside>

      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={login}
      />
    </>
  );
}
