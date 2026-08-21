"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Monitor, Laptop, X, Eye, Edit, Building2, Trash2, AlertTriangle, Download, UserCheck } from "lucide-react";
import { initialComputers, Computer } from "@/data/computers";
import PinModal from "@/components/PinModal";
import OwnershipHistoryModal from "@/components/OwnershipHistoryModal";
import { exportToExcel } from "@/utils/excel";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";


export default function Computers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyParam = searchParams.get('company');

  const [computers, setComputers] = useState<Computer[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingDevice, setViewingDevice] = useState<Computer | null>(null);
  const [editingDevice, setEditingDevice] = useState<Computer | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Computer | null>(null);
  const [historyDevice, setHistoryDevice] = useState<Computer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, login } = useAuth();

  const handleUpdateComputerUser = async (compId: string, newUser: string, newDept: string) => {
    setComputers((prev) =>
      prev.map((c) => {
        if (c.id === compId || c.computerName === compId) {
          const updated = { ...c, user: newUser, department: newDept };
          try {
            const savedEdits = JSON.parse(localStorage.getItem("local_computer_edits") || "{}");
            savedEdits[compId] = { ...(savedEdits[compId] || c), user: newUser, department: newDept };
            if (c.id) savedEdits[c.id] = { ...(savedEdits[c.id] || c), user: newUser, department: newDept };
            if (c.computerName) savedEdits[c.computerName] = { ...(savedEdits[c.computerName] || c), user: newUser, department: newDept };
            localStorage.setItem("local_computer_edits", JSON.stringify(savedEdits));

            const savedAdditions = JSON.parse(localStorage.getItem("local_computer_additions") || "[]");
            const updatedAdditions = savedAdditions.map((add: Computer) =>
              (add.id === compId || add.computerName === compId || add.id === c.id || add.computerName === c.computerName)
                ? { ...add, user: newUser, department: newDept }
                : add
            );
            localStorage.setItem("local_computer_additions", JSON.stringify(updatedAdditions));
          } catch {
            // Ignore localStorage error
          }
          return updated;
        }
        return c;
      })
    );

    try {
      await supabase
        .from("computers")
        .update({ user_name: newUser, department: newDept })
        .eq("id", compId);
    } catch {
      // Ignore
    }
  };

  // PIN Protection State (Local modal for auto-unlocking)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'edit' | 'delete', data?: any } | null>(null);

  const handleExport = () => {
    exportToExcel(filteredComputers, "IT-Assets-Computers");
  };

  const checkPin = (type: 'add' | 'edit' | 'delete', data?: any) => {
    if (isAdmin) {
      // If already logged in, proceed directly
      if (type === 'add') setIsAddModalOpen(true);
      else if (type === 'edit') setEditingDevice(data);
      else if (type === 'delete') setDeletingDevice(data);
    } else {
      // If not logged in, show PIN modal
      setPendingAction({ type, data });
      setIsPinModalOpen(true);
    }
  };

  const onPinSuccess = () => {
    // 1. Log in globally
    login();
    
    // 2. Perform the pending action
    if (!pendingAction) return;
    if (pendingAction.type === 'add') {
      setIsAddModalOpen(true);
    } else if (pendingAction.type === 'edit') {
      setEditingDevice(pendingAction.data);
    } else if (pendingAction.type === 'delete') {
      setDeletingDevice(pendingAction.data);
    }
    setPendingAction(null);
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<keyof Computer | "All">("All");
  const [selectedCompany, setSelectedCompany] = useState<"All" | "Whitespace Partners" | "Whitespace Connect">("All");
  const [selectedDepartmentGroup, setSelectedDepartmentGroup] = useState<"ALL" | "STUDIO 1" | "STUDIO 2" | "STUDIO 3" | "STUDIO 4" | "3D" | "Other">("ALL");

  // Helper to normalize and match Department into STUDIO 1, STUDIO 2, STUDIO 3, STUDIO 4, 3D, or Other
  const getDepartmentGroup = (dept: string): "STUDIO 1" | "STUDIO 2" | "STUDIO 3" | "STUDIO 4" | "3D" | "Other" => {
    if (!dept) return "Other";
    const cleaned = dept.toUpperCase().replace(/[\s\-_]/g, "");
    if (cleaned === "STUDIO1") return "STUDIO 1";
    if (cleaned === "STUDIO2") return "STUDIO 2";
    if (cleaned === "STUDIO3") return "STUDIO 3";
    if (cleaned === "STUDIO4") return "STUDIO 4";
    if (cleaned === "3D" || cleaned.startsWith("3D")) return "3D";
    return "Other";
  };

  // Compute counts for each department group dynamically
  const departmentGroupCounts = useMemo(() => {
    const counts = {
      ALL: 0,
      "STUDIO 1": 0,
      "STUDIO 2": 0,
      "STUDIO 3": 0,
      "STUDIO 4": 0,
      "3D": 0,
      Other: 0,
    };

    computers.forEach((comp) => {
      if (selectedCompany !== "All" && comp.company !== selectedCompany) {
        return;
      }
      counts.ALL++;
      const group = getDepartmentGroup(comp.department);
      counts[group]++;
    });

    return counts;
  }, [computers, selectedCompany]);

  // Sync selectedCompany state with searchParam from Sidebar or URL
  useEffect(() => {
    if (companyParam === "Whitespace Partners" || companyParam === "Whitespace Connect") {
      setSelectedCompany(companyParam);
    } else {
      setSelectedCompany("All");
    }
  }, [companyParam]);

  const handleSelectCompany = (company: "All" | "Whitespace Partners" | "Whitespace Connect") => {
    setSelectedCompany(company);
    if (company === "All") {
      router.push("/computers");
    } else {
      router.push(`/computers?company=${encodeURIComponent(company)}`);
    }
  };

  // Memoized filtered and sorted computers (Sorted strictly by Device ID)
  const filteredComputers = useMemo(() => {
    return computers
      .filter((comp) => {
        if (selectedCompany !== "All" && comp.company !== selectedCompany) {
          return false;
        }

        if (selectedDepartmentGroup !== "ALL") {
          const compGroup = getDepartmentGroup(comp.department);
          if (compGroup !== selectedDepartmentGroup) return false;
        }

        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();

        if (filterCategory === "All") {
          return (
            (comp.id || "").toLowerCase().includes(searchLower) ||
            (comp.model || "").toLowerCase().includes(searchLower) ||
            (comp.computerName || "").toLowerCase().includes(searchLower) ||
            (comp.user || "").toLowerCase().includes(searchLower) ||
            (comp.serialNo || "").toLowerCase().includes(searchLower) ||
            (comp.department || "").toLowerCase().includes(searchLower)
          );
        }

        const value = String(comp[filterCategory] || "").toLowerCase();
        return value.includes(searchLower);
      })
      .sort((a, b) => (a.id || "").localeCompare(b.id || "", undefined, { numeric: true, sensitivity: "base" }));
  }, [computers, searchQuery, filterCategory, selectedCompany, selectedDepartmentGroup]);

  // Fetch from Supabase on mount
  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    setIsLoading(true);
    let baseList: Computer[] = [];
    try {
      const { data, error } = await supabase
        .from('computers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn("Using initialComputers fallback data:", error?.message);
        baseList = initialComputers;
      } else {
        // Map snake_case from DB to camelCase for UI
        baseList = data.map(item => ({
          id: item.id || "",
          computerName: item.computer_name || "",
          model: item.model || "",
          user: item.user_name || "Unassigned",
          department: item.department || "",
          company: item.company || "Whitespace Partners",
          status: item.status || "Available",
          type: item.type || "Laptop",
          os: item.os || "",
          osKey: item.os_key || "",
          serialNo: item.serial_no || "",
          macAddress: item.mac_address || "",
          mainBoard: item.main_board || "",
          cpu: item.cpu || "",
          ram: item.ram || "",
          gpu: item.gpu || "",
          hdd: item.hdd || "",
          warranty: item.warranty || "",
          purchaseDate: item.purchase_date || "",
          price: item.price || ""
        }));
      }
    } catch (e) {
      console.warn("Supabase fetch exception, using fallback data:", e);
      baseList = initialComputers;
    }

    // Apply local overlay (edits, additions, deletions)
    try {
      const savedEdits = JSON.parse(localStorage.getItem("local_computer_edits") || "{}");
      const savedAdditions = JSON.parse(localStorage.getItem("local_computer_additions") || "[]");
      const savedDeletions = JSON.parse(localStorage.getItem("local_computer_deletions") || "[]");

      let merged = baseList.map(item => {
        const edit = savedEdits[item.id];
        return edit ? { ...item, ...edit } : item;
      });

      merged = merged.filter(item => !savedDeletions.includes(item.id));

      for (const add of savedAdditions) {
        const editForAdd = savedEdits[add.id] || add;
        const finalAdd = { ...add, ...editForAdd };

        if (!merged.some(i => i.id === finalAdd.id)) {
          merged.unshift(finalAdd);
        }
      }

      // Deduplicate strictly by item.id to ensure no duplicates ever occur
      const uniqueMap = new Map<string, Computer>();
      for (const item of merged) {
        if (item.id && !uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      }

      setComputers(Array.from(uniqueMap.values()));
    } catch {
      setComputers(baseList);
    }

    setIsLoading(false);
  };

  const mapToDB = (comp: Computer) => ({
    id: comp.id,
    computer_name: comp.computerName,
    model: comp.model,
    user_name: comp.user,
    department: comp.department,
    company: comp.company,
    status: comp.status,
    type: comp.type,
    os: comp.os,
    os_key: comp.osKey,
    serial_no: comp.serialNo,
    mac_address: comp.macAddress,
    main_board: comp.mainBoard,
    cpu: comp.cpu,
    ram: comp.ram,
    gpu: comp.gpu,
    hdd: comp.hdd,
    warranty: comp.warranty,
    purchase_date: comp.purchaseDate,
    price: comp.price
  });

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newComputer: Computer = {
      id: formData.get("id") as string,
      computerName: formData.get("computerName") as string,
      model: formData.get("model") as string,
      user: formData.get("user") as string || "Unassigned",
      department: formData.get("department") as string,
      company: formData.get("company") as any,
      status: formData.get("status") as "Active" | "Available",
      type: formData.get("type") as "Laptop" | "Desktop" | "MacOS",
      os: formData.get("os") as string,
      osKey: formData.get("osKey") as string,
      serialNo: formData.get("serialNo") as string,
      macAddress: formData.get("macAddress") as string,
      mainBoard: formData.get("mainBoard") as string,
      cpu: formData.get("cpu") as string,
      ram: formData.get("ram") as string,
      gpu: formData.get("gpu") as string,
      hdd: formData.get("hdd") as string,
      warranty: formData.get("warranty") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      price: formData.get("price") as string,
    };

    // 1. Optimistic update
    setComputers((prev) => {
      const filtered = prev.filter(item => item.id !== newComputer.id);
      return [newComputer, ...filtered];
    });

    // 2. Local persistence
    try {
      const savedAdditions = JSON.parse(localStorage.getItem("local_computer_additions") || "[]");
      const filteredAdditions = savedAdditions.filter((item: Computer) => item.id !== newComputer.id);
      filteredAdditions.unshift(newComputer);
      localStorage.setItem("local_computer_additions", JSON.stringify(filteredAdditions));
    } catch {
      // Ignore
    }

    setIsAddModalOpen(false);

    // 3. Supabase sync
    const { error } = await supabase
      .from('computers')
      .insert([mapToDB(newComputer)]);

    if (error) {
      console.warn("Supabase insert info:", error.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDevice) return;
    const formData = new FormData(e.currentTarget);
    const updatedCompany = ((formData.get("company") as string) || "Whitespace Partners").trim() as any;
    const originalId = editingDevice.id;
    const newId = ((formData.get("id") as string) || originalId).trim();

    const updatedComputer: Computer = {
      ...editingDevice,
      id: newId,
      computerName: formData.get("computerName") as string,
      model: formData.get("model") as string,
      user: formData.get("user") as string || "Unassigned",
      department: formData.get("department") as string,
      company: updatedCompany,
      status: formData.get("status") as "Active" | "Available",
      type: formData.get("type") as "Laptop" | "Desktop" | "MacOS",
      os: formData.get("os") as string,
      osKey: formData.get("osKey") as string,
      serialNo: formData.get("serialNo") as string,
      macAddress: formData.get("macAddress") as string,
      mainBoard: formData.get("mainBoard") as string,
      cpu: formData.get("cpu") as string,
      ram: formData.get("ram") as string,
      gpu: formData.get("gpu") as string,
      hdd: formData.get("hdd") as string,
      warranty: formData.get("warranty") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      price: formData.get("price") as string,
    };

    // 1. Optimistic update
    setComputers((prev) =>
      prev.map((item) => (item.id === originalId || item.id === newId ? updatedComputer : item))
    );

    // 2. Local persistence (savedEdits + savedAdditions sync strictly by id)
    try {
      const savedEdits = JSON.parse(localStorage.getItem("local_computer_edits") || "{}");
      if (originalId !== newId) {
        delete savedEdits[originalId];
      }
      savedEdits[newId] = updatedComputer;
      localStorage.setItem("local_computer_edits", JSON.stringify(savedEdits));

      const savedAdditions = JSON.parse(localStorage.getItem("local_computer_additions") || "[]");
      const updatedAdditions = savedAdditions.map((add: Computer) =>
        (add.id === originalId || add.id === newId)
          ? updatedComputer
          : add
      );
      localStorage.setItem("local_computer_additions", JSON.stringify(updatedAdditions));
    } catch {
      // Ignore
    }

    setEditingDevice(null);

    // 3. Auto-switch company filter if company changed and filter is active
    if (selectedCompany !== "All" && updatedCompany !== selectedCompany) {
      handleSelectCompany(updatedCompany);
    }

    // 4. Supabase sync
    const { error } = await supabase
      .from('computers')
      .update(mapToDB(updatedComputer))
      .eq('id', originalId);

    if (error) {
      console.warn("Supabase update info:", error.message);
    }
  };

  const confirmDelete = async () => {
    if (deletingDevice) {
      const targetId = deletingDevice.id;

      // 1. Optimistic update
      setComputers((prev) => prev.filter((item) => item.id !== targetId));

      // 2. Local persistence
      try {
        const savedDeletions = JSON.parse(localStorage.getItem("local_computer_deletions") || "[]");
        savedDeletions.push(targetId);
        localStorage.setItem("local_computer_deletions", JSON.stringify(savedDeletions));
      } catch {
        // Ignore
      }

      setDeletingDevice(null);

      // 3. Supabase sync
      const { error } = await supabase
        .from('computers')
        .delete()
        .eq('id', targetId);

      if (error) {
        console.warn("Supabase delete info:", error.message);
      }
    }
  };

  const FormFields = ({ def }: { def?: Computer }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Device ID</label>
        <input required defaultValue={def?.id} name="id" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500 font-mono font-bold" placeholder="e.g. WS-2503BE2D" />
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Computer Name</label>
        <input required defaultValue={def?.computerName} name="computerName" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. IT-NB-01" />
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Model Name</label>
        <input required defaultValue={def?.model} name="model" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. MacBook Pro 14" />
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Assigned To</label>
        <input defaultValue={def?.user} name="user" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" placeholder="User Name (Optional)" />
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Company</label>
        <select defaultValue={def?.company ? def.company.trim() : "Whitespace Partners"} name="company" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500">
          <option value="Whitespace Partners">Whitespace Partners</option>
          <option value="Whitespace Connect">Whitespace Connect</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Department</label>
        <input required defaultValue={def?.department} name="department" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. Engineering" />
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Type</label>
        <select defaultValue={def?.type} name="type" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500">
          <option value="Laptop">Laptop</option>
          <option value="Desktop">Desktop</option>
          <option value="MacOS">MacOS</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">Status</label>
        <select defaultValue={def?.status} name="status" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500">
          <option value="Available">Available</option>
          <option value="Active">Active</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">OS</label>
        <input required defaultValue={def?.os} name="os" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. macOS 14" />
      </div>
      <div>
        <label className="block text-xs font-bold text-app-muted mb-1">OS Key</label>
        <input defaultValue={def?.osKey} name="osKey" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" placeholder="Product Key" />
      </div>
      
      <div className="sm:col-span-2 mt-3"><h3 className="text-xs font-semibold text-app-text border-b border-app-border pb-1.5 uppercase tracking-wider">Hardware Specifications</h3></div>
      
      <div><label className="block text-xs font-medium text-app-muted mb-1">Serial No.</label><input required defaultValue={def?.serialNo} name="serialNo" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-xs font-medium text-app-muted mb-1">MAC Address</label><input required defaultValue={def?.macAddress} name="macAddress" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-xs font-medium text-app-muted mb-1">MainBoard</label><input required defaultValue={def?.mainBoard} name="mainBoard" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-xs font-medium text-app-muted mb-1">CPU</label><input required defaultValue={def?.cpu} name="cpu" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-xs font-medium text-app-muted mb-1">RAM</label><input required defaultValue={def?.ram} name="ram" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-xs font-medium text-app-muted mb-1">Graphic Card</label><input required defaultValue={def?.gpu} name="gpu" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div className="sm:col-span-2"><label className="block text-xs font-medium text-app-muted mb-1">Hardisk (Storage)</label><input required defaultValue={def?.hdd} name="hdd" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" /></div>
      
      <div className="sm:col-span-2 mt-2"><h3 className="text-xs font-semibold text-app-text border-b border-app-border pb-1.5 uppercase tracking-wider">Purchase & Warranty</h3></div>
      
      <div>
        <label className="block text-xs font-medium text-app-muted mb-1">Purchase Date</label>
        <input required defaultValue={def?.purchaseDate} name="purchaseDate" type="date" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-app-muted mb-1">Warranty Expiry</label>
        <input required defaultValue={def?.warranty} name="warranty" type="date" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-app-muted mb-1">Price (THB)</label>
        <input required defaultValue={def?.price} name="price" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2 text-xs text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. 120,000" />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] px-4 xl:px-8 mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-app-text">
              {selectedCompany === "All" ? "Computers" : `Computers (${selectedCompany})`}
            </h1>
            {selectedCompany !== "All" && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                selectedCompany === "Whitespace Partners"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                <Building2 className="w-3.5 h-3.5" />
                {selectedCompany}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-xs text-app-muted">
              {selectedCompany === "All"
                ? "Manage all hardware devices and their assignments."
                : `Hardware devices registered under ${selectedCompany}.`}
            </p>
            <div className="h-3.5 w-[1px] bg-app-border mx-0.5" />
            <span className="bg-blue-500/10 text-blue-400 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
              {filteredComputers.length} Records
            </span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 w-full sm:w-auto"
        >
          {isAdmin && (
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none bg-app-surface border border-app-border hover:bg-app-bg text-app-text px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
          <button
            onClick={() => checkPin('add')}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 justify-center active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="p-3.5 border-b border-app-border flex flex-col gap-3.5 bg-app-surface/50">
          {/* Department Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-app-muted flex items-center gap-1.5 mr-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Department:
            </span>
            {[
              { id: "ALL", label: "ALL" },
              { id: "STUDIO 1", label: "STUDIO 1" },
              { id: "STUDIO 2", label: "STUDIO 2" },
              { id: "STUDIO 3", label: "STUDIO 3" },
              { id: "STUDIO 4", label: "STUDIO 4" },
              { id: "3D", label: "3D" },
              { id: "Other", label: "Other" },
            ].map((tab) => {
              const isActive = selectedDepartmentGroup === tab.id;
              const count = departmentGroupCounts[tab.id as keyof typeof departmentGroupCounts] || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedDepartmentGroup(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20 scale-[1.02]"
                      : "bg-app-bg text-app-muted hover:text-app-text border-app-border hover:border-app-muted/30"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-app-surface text-app-muted border border-app-border"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                type="text"
                placeholder={filterCategory === "All" ? "Search all fields..." : `Search in ${filterCategory}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl py-1.5 pl-9 pr-3 text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto relative">
              <Filter className="w-3.5 h-3.5 text-app-muted absolute ml-3 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-app-bg border border-app-border rounded-xl py-1.5 pl-8 pr-4 text-xs text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer w-full md:w-44 font-semibold"
              >
                <option value="All">Search All Fields</option>
                <option value="user">Search by User</option>
                <option value="computerName">Search by Computer Name</option>
                <option value="model">Search by Model</option>
                <option value="id">Search by Device ID</option>
                <option value="company">Search by Company</option>
                <option value="department">Search by Department</option>
                <option value="serialNo">Search by Serial No.</option>
                <option value="os">Search by OS</option>
                <option value="status">Search by Status</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-bg/50 text-app-muted text-[10px] uppercase font-black tracking-widest border-b border-app-border">
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">Device ID</th>
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">Device Info</th>
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">Assigned To</th>
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">Company</th>
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">Department</th>
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">Computer Name</th>
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">OS</th>
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">Status</th>
                <th className="px-3.5 py-3 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {filteredComputers.map((comp, i) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                  key={comp.id}
                  className="hover:bg-app-bg/50 transition-colors group"
                >
                  <td className="px-3.5 py-2.5 text-xs text-app-text font-bold font-mono whitespace-nowrap">{comp.id}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-app-bg border border-app-border rounded-lg text-app-muted group-hover:text-blue-400 group-hover:scale-105 transition-all shrink-0">
                        {comp.type === "Desktop" ? <Monitor className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-app-text truncate">{comp.model}</p>
                        <p className="text-[9px] text-app-muted font-semibold uppercase mt-0.5">{comp.type} • {comp.cpu}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-xs text-app-text font-semibold whitespace-nowrap">{comp.user}</td>
                  <td className="px-3.5 py-2.5">
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      comp.company === 'Whitespace Partners' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                        : comp.company === 'Whitespace Connect'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-app-bg text-app-text border-app-border'
                    }`}>
                      <Building2 className="w-3 h-3" />
                      {comp.company}
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-[11px] text-app-muted font-bold uppercase whitespace-nowrap">{comp.department}</td>
                  <td className="px-3.5 py-2.5 text-xs text-app-text font-bold whitespace-nowrap">{comp.computerName || "-"}</td>
                  <td className="px-3.5 py-2.5 text-[11px] text-app-muted font-medium whitespace-nowrap">{comp.os}</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      comp.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setViewingDevice(comp)}
                        className="p-1.5 text-app-muted hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all font-bold border border-app-border hover:border-blue-500/20"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setHistoryDevice(comp)}
                        className="p-1.5 text-app-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all font-bold border border-app-border hover:border-indigo-500/20"
                        title="ประวัติการครอบครองเครื่อง (Ownership History)"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => checkPin('edit', comp)}
                        className="p-1.5 text-app-muted hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all font-bold border border-app-border hover:border-amber-500/20"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => checkPin('delete', comp)}
                        className="p-1.5 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all font-bold border border-app-border hover:border-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Device Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-app-border shrink-0">
                <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">Add New Device</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="add-form" onSubmit={handleAddSubmit} className="space-y-4">
                  <FormFields />
                </form>
              </div>
              <div className="p-4 border-t border-app-border flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-app-muted font-bold hover:text-app-text">Cancel</button>
                <button type="submit" form="add-form" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">Save Device</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Device Modal */}
      <AnimatePresence>
        {editingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-app-border shrink-0">
                <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">Edit Device ({editingDevice.id})</h2>
                <button onClick={() => setEditingDevice(null)} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="edit-form" key={editingDevice.id} onSubmit={handleEditSubmit} className="space-y-4">
                  <FormFields def={editingDevice} />
                </form>
              </div>
              <div className="p-4 border-t border-app-border flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setEditingDevice(null)} className="px-4 py-2 text-app-muted font-bold hover:text-app-text">Cancel</button>
                <button type="submit" form="edit-form" className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20">Update Device</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20"><AlertTriangle className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold text-app-text uppercase tracking-tight mb-2">Confirm Delete</h3>
              <p className="text-sm text-app-muted mb-6">Are you sure you want to delete <span className="text-app-text font-bold">{deletingDevice.computerName}</span> ({deletingDevice.model})? This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeletingDevice(null)} className="px-5 py-2.5 bg-app-bg border border-app-border hover:bg-app-surface rounded-xl font-bold text-app-text transition-all">Cancel</button>
                <button onClick={confirmDelete} className="px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20">Delete Device</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Device Modal */}
      <AnimatePresence>
        {viewingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-app-border shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">{viewingDevice.computerName}</h2>
                  <p className="text-xs text-app-muted mt-1">{viewingDevice.model} • {viewingDevice.company}</p>
                </div>
                <button onClick={() => setViewingDevice(null)} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">General Info</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-app-muted">Device ID:</span><span className="text-app-text font-bold">{viewingDevice.id}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Assigned To:</span><span className="text-app-text font-bold">{viewingDevice.user}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Company:</span><span className="text-app-text font-bold">{viewingDevice.company}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Department:</span><span className="text-app-text font-bold">{viewingDevice.department}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Status:</span><span className={`font-bold ${viewingDevice.status === "Active" ? "text-emerald-400" : "text-amber-400"}`}>{viewingDevice.status}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Purchase Date:</span><span className="text-app-text font-bold">{viewingDevice.purchaseDate}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Warranty Expiry:</span><span className="text-app-text font-bold">{viewingDevice.warranty}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Price:</span><span className="text-app-text font-bold">฿{viewingDevice.price}</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">Hardware Specs</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-app-muted">Type:</span><span className="text-app-text font-bold">{viewingDevice.type || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Serial No.:</span><span className="text-app-text font-mono font-bold">{viewingDevice.serialNo || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">MAC Address:</span><span className="text-app-text font-mono font-bold">{viewingDevice.macAddress || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">MainBoard:</span><span className="text-app-text font-bold">{viewingDevice.mainBoard || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">CPU:</span><span className="text-app-text font-bold">{viewingDevice.cpu || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">RAM:</span><span className="text-app-text font-bold">{viewingDevice.ram || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Graphic Card:</span><span className="text-app-text font-bold">{viewingDevice.gpu || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Hardisk:</span><span className="text-app-text font-bold">{viewingDevice.hdd || "-"}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">OS:</span><span className="text-app-text font-bold">{viewingDevice.os || "-"}</span></div>
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[10px] text-app-muted font-bold uppercase">OS Key:</span>
                        <code className="text-xs bg-app-bg p-2.5 rounded-xl border border-app-border text-purple-400 font-mono break-all font-bold tracking-tight">
                          {viewingDevice.osKey ? (isAdmin ? viewingDevice.osKey : viewingDevice.osKey.length > 4 ? viewingDevice.osKey.slice(0, -4) + "****" : "****") : "-"}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OwnershipHistoryModal
        isOpen={!!historyDevice}
        onClose={() => setHistoryDevice(null)}
        computer={historyDevice}
        isAdmin={isAdmin}
        onRequirePin={() => checkPin('edit', historyDevice)}
        onUpdateComputerUser={handleUpdateComputerUser}
      />

      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={onPinSuccess}
      />
    </div>
  );
}
