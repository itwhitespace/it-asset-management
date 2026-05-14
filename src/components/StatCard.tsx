"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color: "blue" | "emerald" | "amber" | "purple";
  delay?: number;
}

const colorMaps = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-2xl bg-app-surface border border-app-border hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-sm"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-app-muted mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-app-text">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${colorMaps[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          <span className={trendUp ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
          <span className="text-app-muted text-xs">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
