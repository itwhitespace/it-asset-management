"use client"; // บรรทัดที่ 1 ต้องเป็นอันนี้เท่านั้น!


import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Banknote, TrendingUp, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Software } from "@/data/software";
import { supabase } from "@/lib/supabase";

const months = [
  "Oct-25", "Nov-25", "Dec-25", "Jan-26", "Feb-26", "Mar-26",
  "Apr-26", "May-26", "Jun-26", "Jul-26", "Aug-26", "Sep-26"
];

export default function Expenses() {
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-app-text uppercase tracking-tight">Software Expenses</h1>
        <p className="text-app-muted mt-2">Financial overview and renewal projection for all software assets.</p>
      </motion.div>

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
                  <tr className="bg-purple-500/5 text-purple-400 font-black border-t border-app-border">
                    <td className="p-4 sticky left-0 bg-app-bg z-10 border-r border-app-border uppercase tracking-widest">TOTAL {type}</td>
                    <td className="p-4 border-r border-app-border"></td>
                    {months.map(month => (
                      <td key={month} className="p-1 text-center border-r border-app-border">
                        {formatNumber(calculateCategoryMonthTotal(type, month))}
                      </td>
                    ))}
                    <td className="p-4 text-right bg-purple-500/10">
                      {formatNumber(calculateCategoryTotal(type))}
                    </td>
                  </tr>
                </tbody>
              );
            })}

            {/* Grand Total Footer */}
            <tfoot>
              <tr className="bg-blue-600/10 text-blue-500 font-black text-xs uppercase border-t-2 border-app-border">
                <td className="p-5 sticky left-0 bg-app-bg z-10 border-r border-app-border tracking-widest">GRAND TOTAL</td>
                <td className="p-5 border-r border-app-border"></td>
                {months.map(month => {
                  const monthTotal = softwareList.reduce((acc, s) => acc + getMonthlyCost(s, month), 0);
                  return (
                    <td key={month} className="p-2 text-center border-r border-app-border">
                      {formatNumber(monthTotal)}
                    </td>
                  );
                })}
                <td className="p-5 text-right bg-blue-600/20 text-blue-600">
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
