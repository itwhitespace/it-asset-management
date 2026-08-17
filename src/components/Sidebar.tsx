"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Monitor, Box, Settings, LogOut, Banknote, Package, Menu, X, ShieldCheck, Lock, Building2, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PinModal from "@/components/PinModal";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Computers",
    href: "/computers?company=Whitespace+Partners",
    icon: Monitor,
    subItems: [
      { name: "Whitespace Partners", company: "Whitespace Partners", href: "/computers?company=Whitespace+Partners" },
      { name: "Whitespace Connect", company: "Whitespace Connect", href: "/computers?company=Whitespace+Connect" },
    ]
  },
  { name: "Software", href: "/software", icon: Box },
  { name: "Expenses", href: "/expenses", icon: Banknote },
  { name: "Rental Equipments", href: "/rental", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCompany = searchParams?.get("company");
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, login, logout } = useAuth();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

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

        <nav className="flex-1 py-2 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isMainActive = pathname === item.href && !currentCompany;
            const isParentActive = pathname.startsWith(item.href) && item.href !== "/";

            return (
              <div key={item.name} className="space-y-1">
                <Link href={item.href} className="block relative">
                  {isMainActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div
                    className={clsx(
                      "relative flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors duration-200 text-sm",
                      isParentActive
                        ? "text-blue-400 font-semibold"
                        : "text-app-muted hover:text-app-text hover:bg-app-surface/50 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.subItems && (
                      <ChevronDown className={clsx("w-3 h-3 transition-transform duration-200", isParentActive ? "rotate-180 text-blue-400" : "text-app-muted")} />
                    )}
                  </div>
                </Link>

                {item.subItems && isParentActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="pl-7 pr-1 space-y-1 overflow-hidden"
                  >
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === "/computers" && currentCompany === sub.company;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                            isSubActive
                              ? sub.company === "Whitespace Partners"
                                ? "bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold shadow-sm"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold shadow-sm"
                              : "text-app-muted hover:text-app-text hover:bg-app-surface/50 border-transparent"
                          )}
                        >
                          <Building2 className={clsx(
                            "w-3.5 h-3.5 shrink-0",
                            sub.company === "Whitespace Partners" ? "text-purple-400" : "text-amber-400"
                          )} />
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-app-border space-y-1">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-app-muted hover:text-app-text hover:bg-app-surface/50 rounded-xl cursor-pointer transition-colors">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </Link>
          
          {isAdmin ? (
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsPinModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl cursor-pointer transition-colors"
            >
              <Lock className="w-4 h-4" />
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
