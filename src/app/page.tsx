"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Monitor, Box, CheckCircle2, Calendar, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";
import { initialSoftware, Software } from "@/data/software";
import { initialComputers, Computer } from "@/data/computers";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";


export default function Dashboard() {
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [computerList, setComputerList] = useState<Computer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      let compBase: Computer[] = [];
      let softBase: Software[] = [];

      try {
        const [compRes, softRes] = await Promise.all([
          supabase.from('computers').select('*'),
          supabase.from('software').select('*')
        ]);

        if (compRes.data && compRes.data.length > 0) {
          compBase = compRes.data.map(item => ({
            id: item.id,
            computerName: item.computer_name || "",
            model: item.model,
            user: item.user_name,
            department: item.department,
            company: item.company,
            status: item.status,
            type: item.type,
            os: item.os,
            osKey: item.os_key,
            serialNo: item.serial_no,
            macAddress: item.mac_address,
            mainBoard: item.main_board,
            cpu: item.cpu,
            ram: item.ram,
            gpu: item.gpu,
            hdd: item.hdd,
            warranty: item.warranty,
            purchaseDate: item.purchase_date,
            price: item.price
          }));
        } else {
          compBase = initialComputers;
        }

        if (softRes.data && softRes.data.length > 0) {
          softBase = softRes.data.map(item => ({
            id: item.id,
            name: item.name,
            detail: item.detail,
            seats: item.seats,
            used: item.used,
            expiry: item.expiry,
            status: item.status,
            pricePerUnit: parseFloat(item.price_per_unit || "0"),
            type: item.type,
            licenseType: item.license_type,
            assignedUsers: item.assigned_users || []
          }));
        } else {
          softBase = initialSoftware;
        }
      } catch {
        compBase = initialComputers;
        softBase = initialSoftware;
      }

      // Apply Local Overlays
      try {
        const savedCompEdits = JSON.parse(localStorage.getItem("local_computer_edits") || "{}");
        const savedCompAdditions = JSON.parse(localStorage.getItem("local_computer_additions") || "[]");
        const savedCompDeletions = JSON.parse(localStorage.getItem("local_computer_deletions") || "[]");

        let mergedComp = compBase.map(item => {
          const edit = (item.id && savedCompEdits[item.id]) || (item.computerName && savedCompEdits[item.computerName]);
          return edit ? { ...item, ...edit } : item;
        });

        mergedComp = mergedComp.filter(item => {
          const isDeleted = (item.id && savedCompDeletions.includes(item.id)) || (item.computerName && savedCompDeletions.includes(item.computerName));
          return !isDeleted;
        });

        for (const add of savedCompAdditions) {
          const editForAdd = (add.id && savedCompEdits[add.id]) || (add.computerName && savedCompEdits[add.computerName]) || add;
          const finalAdd = { ...add, ...editForAdd };

          const isAlreadyInMerged = mergedComp.some(i =>
            (i.id && finalAdd.id && i.id === finalAdd.id) ||
            (i.computerName && finalAdd.computerName && i.computerName === finalAdd.computerName)
          );

          if (!isAlreadyInMerged) {
            mergedComp.unshift(finalAdd);
          }
        }
        setComputerList(mergedComp);
      } catch {
        setComputerList(compBase);
      }

      try {
        const savedSoftEdits = JSON.parse(localStorage.getItem("local_software_edits") || "{}");
        const savedSoftAdditions = JSON.parse(localStorage.getItem("local_software_additions") || "[]");
        const savedSoftDeletions = JSON.parse(localStorage.getItem("local_software_deletions") || "[]");

        let mergedSoft = softBase.map(item => savedSoftEdits[item.id] ? { ...item, ...savedSoftEdits[item.id] } : item);
        mergedSoft = mergedSoft.filter(item => !savedSoftDeletions.includes(item.id));
        for (const add of savedSoftAdditions) {
          const editForAdd = (add.id && savedSoftEdits[add.id]) || add;
          const finalAdd = { ...add, ...editForAdd };
          if (!mergedSoft.some(i => i.id === finalAdd.id)) {
            mergedSoft.unshift(finalAdd);
          }
        }
        setSoftwareList(mergedSoft);
      } catch {
        setSoftwareList(softBase);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Calculate available devices
  const availableDevices = computerList.filter(c => c.status === "Available").length;

  // Calculate remaining days and sort
  const sortedSoftware = [...softwareList].map(s => {
    const expiry = new Date(s.expiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...s, remainingDays: diffDays };
  }).sort((a, b) => a.remainingDays - b.remainingDays);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-app-text">Dashboard Overview</h1>
        <p className="text-app-muted mt-2">Welcome back to Whitespace Asset. Manage your IT inventory efficiently.</p>
      </motion.div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Computers"
          value={computerList.length}
          icon={Monitor}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Software Licenses"
          value={softwareList.length}
          icon={Box}
          color="purple"
          delay={0.2}
        />
        <StatCard
          title="AVAILABLE Devices"
          value={availableDevices}
          icon={CheckCircle2}
          color="emerald"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Software Expiry Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-app-surface border border-app-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-app-text uppercase tracking-tight">Software Expiry Watchlist</h2>
            <Link href="/software" className="text-sm text-blue-500 hover:text-blue-400 font-bold transition-colors">View All</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-app-muted text-[10px] uppercase font-black tracking-widest border-b border-app-border">
                  <th className="pb-4 font-bold">Software Name</th>
                  <th className="pb-4 font-bold">Expiry Date</th>
                  <th className="pb-4 font-bold text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {sortedSoftware.slice(0, 5).map((item, i) => (
                  <tr key={item.id} className="group hover:bg-app-bg/50 transition-colors">
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-app-bg border border-app-border flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-app-text leading-tight">{item.name}</p>
                          <p className="text-[10px] text-app-muted uppercase font-bold mt-0.5">{item.licenseType} LICENSE</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-sm text-app-muted font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-50" />
                        {item.expiry}
                      </div>
                    </td>
                    <td className="py-5 text-right">
                      <div className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border",
                        item.remainingDays <= 15 
                          ? "bg-red-500/10 text-red-500 border-red-500/20" 
                          : item.remainingDays <= 30 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}>
                        <Clock className="w-3.5 h-3.5" />
                        {item.remainingDays} DAYS
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
