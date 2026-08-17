"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Calendar, Building2, Plus, Trash2, ShieldCheck, Lock, History, Sparkles } from "lucide-react";
import { Computer } from "@/data/computers";
import { supabase } from "@/lib/supabase";

export type OwnershipRecord = {
  id: string;
  computerId: string;
  fullName: string;
  nickname: string;
  department: string;
  assignedDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
};

interface OwnershipHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  computer: Computer | null;
  isAdmin: boolean;
  onRequirePin: () => void;
  onUpdateComputerUser?: (computerId: string, newUser: string, newDept: string) => void;
}

export default function OwnershipHistoryModal({
  isOpen,
  onClose,
  computer,
  isAdmin,
  onRequirePin,
  onUpdateComputerUser,
}: OwnershipHistoryModalProps) {
  const [historyList, setHistoryList] = useState<OwnershipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [department, setDepartment] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isOpen && computer) {
      setFullName(computer.user && computer.user !== "Unassigned" ? computer.user : "");
      setNickname("");
      setDepartment(computer.department || "");
      setAssignedDate(todayStr);
      setNotes("");
      fetchHistory(computer.id, computer.user, computer.department);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, computer]);

  const fetchHistory = async (compId: string, currentCompUser?: string, currentCompDept?: string) => {
    setIsLoading(true);
    try {
      // 1. Try Supabase
      const { data, error } = await supabase
        .from("ownership_history")
        .select("*")
        .eq("computer_id", compId)
        .order("assigned_date", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: OwnershipRecord[] = data.map((item) => ({
          id: item.id || String(Math.random()),
          computerId: item.computer_id || compId,
          fullName: item.full_name || "",
          nickname: item.nickname || "",
          department: item.department || "",
          assignedDate: item.assigned_date || todayStr,
          notes: item.notes || "",
          createdAt: item.created_at,
        }));
        setHistoryList(mapped);
      } else {
        // 2. Fallback to localStorage
        const localKey = `ownership_history_${compId}`;
        const localDataStr = localStorage.getItem(localKey);
        if (localDataStr) {
          try {
            setHistoryList(JSON.parse(localDataStr));
          } catch {
            setHistoryList(getInitialFallbackHistory(compId, currentCompUser, currentCompDept));
          }
        } else {
          const initList = getInitialFallbackHistory(compId, currentCompUser, currentCompDept);
          setHistoryList(initList);
          localStorage.setItem(localKey, JSON.stringify(initList));
        }
      }
    } catch {
      const localKey = `ownership_history_${compId}`;
      const localDataStr = localStorage.getItem(localKey);
      if (localDataStr) {
        try {
          setHistoryList(JSON.parse(localDataStr));
        } catch {
          setHistoryList(getInitialFallbackHistory(compId, currentCompUser, currentCompDept));
        }
      } else {
        const initList = getInitialFallbackHistory(compId, currentCompUser, currentCompDept);
        setHistoryList(initList);
      }
    }
    setIsLoading(false);
  };

  const getInitialFallbackHistory = (compId: string, currentCompUser?: string, currentCompDept?: string): OwnershipRecord[] => {
    if (currentCompUser && currentCompUser !== "Unassigned") {
      return [
        {
          id: "init-1",
          computerId: compId,
          fullName: currentCompUser,
          nickname: "",
          department: currentCompDept || "General",
          assignedDate: todayStr,
          notes: "ผู้ครอบครองปัจจุบัน (Current Assignee)",
        },
      ];
    }
    return [];
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!computer) return;

    if (!isAdmin) {
      onRequirePin();
      return;
    }

    if (!fullName.trim()) {
      alert("กรุณากรอกชื่อ-สกุล");
      return;
    }

    setIsSubmitting(true);
    const newRecord: OwnershipRecord = {
      id: "hist-" + Date.now(),
      computerId: computer.id,
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      department: department.trim() || computer.department,
      assignedDate: assignedDate || todayStr,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    // 1. Save to Supabase if possible
    try {
      await supabase.from("ownership_history").insert([
        {
          id: newRecord.id,
          computer_id: newRecord.computerId,
          full_name: newRecord.fullName,
          nickname: newRecord.nickname,
          department: newRecord.department,
          assigned_date: newRecord.assignedDate,
          notes: newRecord.notes,
        },
      ]);
    } catch {
      // Supabase table might not exist, proceed with local state
    }

    // 2. Update local state & localStorage
    const updatedList = [newRecord, ...historyList];
    setHistoryList(updatedList);
    localStorage.setItem(`ownership_history_${computer.id}`, JSON.stringify(updatedList));

    // 3. Update current computer user if callback provided
    if (onUpdateComputerUser) {
      const displayName = newRecord.nickname ? `${newRecord.fullName} (${newRecord.nickname})` : newRecord.fullName;
      onUpdateComputerUser(computer.id, displayName, newRecord.department);
    }

    // Reset Form
    setFullName("");
    setNickname("");
    setNotes("");
    setIsSubmitting(false);
  };

  const handleDelete = async (recordId: string) => {
    if (!computer) return;
    if (!isAdmin) {
      onRequirePin();
      return;
    }

    if (!confirm("คุณต้องการลบประวัติรายการนี้ใช่หรือไม่?")) return;

    try {
      await supabase.from("ownership_history").delete().eq("id", recordId);
    } catch {
      // Ignore
    }

    const updatedList = historyList.filter((item) => item.id !== recordId);
    setHistoryList(updatedList);
    localStorage.setItem(`ownership_history_${computer.id}`, JSON.stringify(updatedList));
  };

  if (!isOpen || !computer) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-app-surface border border-app-border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-app-border bg-app-bg/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-app-text">ประวัติการครอบครองเครื่อง</h2>
                  <span className="text-xs bg-indigo-500/15 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                    {computer.computerName}
                  </span>
                </div>
                <p className="text-xs text-app-muted mt-0.5">
                  {computer.model} • {computer.company}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Add Ownership Form */}
            <div className="bg-app-bg/60 border border-app-border rounded-2xl p-4 space-y-3 relative">
              <div className="flex items-center justify-between pb-2 border-b border-app-border">
                <div className="flex items-center gap-2 text-xs font-bold text-app-text uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>เพิ่มประวัติผู้ครอบครองใหม่</span>
                </div>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={onRequirePin}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full hover:bg-amber-500/20 transition-all"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Admin PIN Required</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-app-muted mb-1">
                      ชื่อ-นามสกุล <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="เช่น สมชาย ใจดี"
                        className="w-full bg-app-surface border border-app-border rounded-xl py-2 pl-9 pr-3 text-xs text-app-text focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-app-muted mb-1">ชื่อเล่น</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="เช่น ชาย"
                      className="w-full bg-app-surface border border-app-border rounded-xl py-2 px-3 text-xs text-app-text focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-app-muted mb-1">แผนก</label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="เช่น IT, STUDIO-1"
                        className="w-full bg-app-surface border border-app-border rounded-xl py-2 pl-9 pr-3 text-xs text-app-text focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-app-muted mb-1">วันที่เริ่มครอบครอง (Auto)</label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="date"
                        required
                        value={assignedDate}
                        onChange={(e) => setAssignedDate(e.target.value)}
                        className="w-full bg-app-surface border border-app-border rounded-xl py-2 pl-9 pr-3 text-xs text-app-text focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-app-muted mb-1">หมายเหตุเพิ่มเติม (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="รายละเอียด เช่น เบิกเครื่องใหม่, โอนย้ายจากแอดมิน ฯลฯ"
                    className="w-full bg-app-surface border border-app-border rounded-xl py-2 px-3 text-xs text-app-text focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>บันทึกประวัติ</span>
                  </button>
                </div>
              </form>
            </div>

            {/* History List Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-app-text uppercase tracking-wider flex items-center gap-2 border-b border-app-border pb-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>ประวัติผู้ใช้ที่เคยครอบครอง ({historyList.length} รายการ)</span>
              </h3>

              {isLoading ? (
                <div className="py-8 text-center text-app-muted font-medium">กำลังโหลดประวัติ...</div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center bg-app-bg/30 border border-app-border border-dashed rounded-2xl text-app-muted">
                  ยังไม่มีประวัติการครอบครองสำหรับเครื่องนี้
                </div>
              ) : (
                <div className="overflow-x-auto border border-app-border rounded-2xl bg-app-surface shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-app-bg/60 text-app-muted text-[10px] uppercase font-bold tracking-wider border-b border-app-border">
                        <th className="px-3.5 py-2.5 font-bold whitespace-nowrap">สถานะ</th>
                        <th className="px-3.5 py-2.5 font-bold whitespace-nowrap">ชื่อ-นามสกุล</th>
                        <th className="px-3.5 py-2.5 font-bold whitespace-nowrap">ชื่อเล่น</th>
                        <th className="px-3.5 py-2.5 font-bold whitespace-nowrap">แผนก</th>
                        <th className="px-3.5 py-2.5 font-bold whitespace-nowrap">วันที่เริ่มครอบครอง</th>
                        <th className="px-3.5 py-2.5 font-bold whitespace-nowrap">หมายเหตุ</th>
                        {isAdmin && <th className="px-3.5 py-2.5 font-bold text-right whitespace-nowrap">จัดการ</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border">
                      {historyList.map((rec, i) => (
                        <motion.tr
                          key={rec.id || i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-app-bg/40 transition-colors group"
                        >
                          <td className="px-3.5 py-2.5 text-[11px] whitespace-nowrap">
                            {i === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3" />
                                ปัจจุบัน
                              </span>
                            ) : (
                              <span className="text-[10px] text-app-muted font-bold px-2 py-0.5 rounded-full bg-app-bg border border-app-border">
                                อดีต ({i})
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-app-text font-bold whitespace-nowrap">{rec.fullName}</td>
                          <td className="px-3.5 py-2.5 text-xs text-app-muted font-semibold whitespace-nowrap">{rec.nickname || "-"}</td>
                          <td className="px-3.5 py-2.5 text-xs text-app-muted font-medium whitespace-nowrap">{rec.department || "-"}</td>
                          <td className="px-3.5 py-2.5 text-xs text-app-text font-mono font-medium whitespace-nowrap">{rec.assignedDate}</td>
                          <td className="px-3.5 py-2.5 text-xs text-app-muted italic max-w-[220px] truncate">{rec.notes || "-"}</td>
                          {isAdmin && (
                            <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleDelete(rec.id)}
                                className="p-1 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-app-border hover:border-red-500/20"
                                title="ลบรายการนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
