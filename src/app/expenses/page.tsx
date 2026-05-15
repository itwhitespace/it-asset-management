"use client"; // บรรทัดที่ 1 ต้องเป็นอันนี้เท่านั้น!


import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Banknote, TrendingUp, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Software } from "@/data/software";
import { supabase } from "@/lib/supabase";

const getMonthsForRange = (range: string) => {
  if (range === "2025-2026") {
    return [
      "Oct-25", "Nov-25", "Dec-25", "Jan-26", "Feb-26", "Mar-26",
      "Apr-26", "May-26", "Jun-26", "Jul-26", "Aug-26", "Sep-26"
    ];
  } else if (range === "2026-2027") {
    return [
      "Oct-26", "Nov-26", "Dec-26", "Jan-27", "Feb-27", "Mar-27",
      "Apr-27", "May-27", "Jun-27", "Jul-27", "Aug-27", "Sep-27"
    ];
  } else if (range === "2027-2028") {
    return [
      "Oct-27", "Nov-27", "Dec-27", "Jan-28", "Feb-28", "Mar-28",
      "Apr-28", "May-28", "Jun-28", "Jul-28", "Aug-28", "Sep-28"
    ];
  }
  return [];
};

export default function Expenses() {
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yearRange, setYearRange] = useState("2025-2026");

  const months = getMonthsForRange(yearRange);

  useEffect(() => {
    fetchSoftware();
  }, []);

  const fetchSoftware = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('software')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching software for expenses:", error);
    } else if (data) {
      const mapped: Software[] = data.map(item => ({
        id: item.id,
        name: item.name,
        detail: item.detail,
        seats: item.seats,
        used: item.used,
        expiry: item.expiry,
        status: item.status,
        pricePerUnit: parseFloat(item.price_per_unit),
        type: item.type,
        licenseType: item.license_type,
        assignedUsers: item.assigned_users || []
      }));
      setSoftwareList(mapped);
    }
    setIsLoading(false);
  };

  const formatNumber = (val: number | null) => {
    if (val === null || val === 0 || isNaN(val)) return "-";
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const getMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${month}-${year}`;
  };

  const getMonthlyCost = (software: Software, monthLabel: string) => {
    const totalCost = software.pricePerUnit * software.seats;

    if (software.licenseType === "Monthly") {
      return totalCost;
    } else {
      const expiryMonthLabel = getMonthYear(software.expiry);
      return expiryMonthLabel === monthLabel ? totalCost : 0;
    }
  };

  const calculateRowTotal = (software: Software) => {
    return months.reduce((acc, m) => acc + getMonthlyCost(software, m), 0);
  };

  const categories: ("Back office" | "Designer")[] = ["Back office", "Designer"];

  const calculateCategoryMonthTotal = (type: string, month: string) => {
    return softwareList
      .filter(s => s.type === type)
      .reduce((acc, s) => acc + getMonthlyCost(s, month), 0);
  };

  const calculateCategoryTotal = (type: string) => {
    return softwareList
      .filter(s => s.type === type)
      .reduce((acc, s) => acc + calculateRowTotal(s), 0);
  };

  const grandTotal = softwareList.reduce((acc, s) => acc + calculateRowTotal(s), 0);

  return (
    <div className="max-w-[1500px] mx-auto pb-20 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-app-text uppercase tracking-tight">Software Expenses</h1>
          <p className="text-app-muted mt-2">Financial overview and renewal projection for all software assets.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-bold text-app-muted uppercase tracking-widest hidden sm:block">Fiscal Year:</label>
          <select 
            value={yearRange}
            onChange={(e) => setYearRange(e.target.value)}
            className="w-full sm:w-auto bg-app-surface border border-app-border rounded-xl px-4 py-2.5 text-sm font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="2025-2026">OCT 2025 - SEP 2026</option>
            <option value="2026-2027">OCT 2026 - SEP 2027</option>
            <option value="2027-2028">OCT 2027 - SEP 2028</option>
          </select>
        </motion.div>
      </div>

      {/* Stat Cards at the Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Yearly Budget"
          value={`฿${formatNumber(grandTotal)}`}
          icon={Banknote}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Monthly Average"
          value={`฿${formatNumber(grandTotal / 12)}`}
          icon={TrendingUp}
          color="emerald"
          delay={0.2}
        />
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-app-muted text-xs font-bold uppercase tracking-wider">Active Products</p>
            <p className="text-2xl font-bold text-app-text mt-1">{softwareList.length} Licenses</p>
          </div>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-app-bg text-app-muted border-b border-app-border">
                <th className="p-4 text-left font-black tracking-widest border-r border-app-border w-48 sticky left-0 bg-app-bg z-10">SOFTWARE</th>
                <th className="p-4 text-center font-black tracking-widest border-r border-app-border w-16">SEATS</th>
                {months.map(month => (
                  <th key={month} className="p-1 text-center font-black tracking-widest border-r border-app-border w-16 uppercase">{month}</th>
                ))}
                <th className="p-4 text-right font-black tracking-widest w-28 bg-app-bg/50">TOTAL/YEAR</th>
              </tr>
            </thead>

            {categories.map((type) => {
              const categoryItems = softwareList.filter(s => s.type === type);
              return (
                <tbody key={type} className="border-t border-app-border">
                  {/* Category Header Row */}
                  <tr className="bg-app-bg/80 font-black">
                    <td className="p-3 text-app-text sticky left-0 bg-app-bg z-10 border-r border-app-border uppercase tracking-widest text-[11px]">{type}</td>
                    <td className="p-3 border-r border-app-border"></td>
                    {months.map(m => <td key={m} className="p-3 border-r border-app-border"></td>)}
                    <td className="p-3 bg-app-bg/30"></td>
                  </tr>

                  {/* Items */}
                  {categoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-app-bg/40 transition-colors border-b border-app-border/50">
                      <td className="p-3 text-app-text border-r border-app-border sticky left-0 bg-app-surface z-10">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[9px] text-app-muted mt-0.5 truncate max-w-[180px] font-medium uppercase">{item.detail}</p>
                      </td>
                      <td className="p-3 text-center text-app-muted font-bold border-r border-app-border">{item.seats}</td>
                      {months.map(month => (
                        <td key={month} className="p-1 text-center text-app-text border-r border-app-border font-medium">
                          {formatNumber(getMonthlyCost(item, month))}
                        </td>
                      ))}
                      <td className="p-3 text-right font-black text-app-text bg-app-bg/20">
                        {formatNumber(calculateRowTotal(item))}
                      </td>
                    </tr>
                  ))}

                  {/* Category Total */}
                  <tr className="bg-purple-500/20 text-purple-300 font-black border-t-2 border-purple-500/30">
                    <td className="p-4 sticky left-0 bg-app-surface z-10 border-r border-purple-500/30 uppercase tracking-widest text-purple-400">TOTAL {type}</td>
                    <td className="p-4 border-r border-purple-500/30"></td>
                    {months.map(month => (
                      <td key={month} className="p-1 text-center border-r border-purple-500/30 text-purple-400">
                        {formatNumber(calculateCategoryMonthTotal(type, month))}
                      </td>
                    ))}
                    <td className="p-4 text-right bg-purple-500/30 text-purple-300">
                      {formatNumber(calculateCategoryTotal(type))}
                    </td>
                  </tr>
                </tbody>
              );
            })}

            {/* Grand Total Footer */}
            <tfoot>
              <tr className="bg-blue-600 text-white font-black text-sm uppercase border-t-4 border-blue-800 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
                <td className="p-5 sticky left-0 bg-blue-700 z-10 border-r border-blue-500 tracking-widest shadow-[4px_0_10px_rgba(0,0,0,0.1)]">GRAND TOTAL</td>
                <td className="p-5 border-r border-blue-500"></td>
                {months.map(month => {
                  const monthTotal = softwareList.reduce((acc, s) => acc + getMonthlyCost(s, month), 0);
                  return (
                    <td key={month} className="p-2 text-center border-r border-blue-500">
                      {formatNumber(monthTotal)}
                    </td>
                  );
                })}
                <td className="p-5 text-right bg-blue-800 text-white text-base">
                  {formatNumber(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
