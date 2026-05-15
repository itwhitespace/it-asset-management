"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Monitor, Laptop, X, Eye, Edit, Building2, Trash2, AlertTriangle, Download } from "lucide-react";
import { initialComputers, Computer } from "@/data/computers";
import PinModal from "@/components/PinModal";
import { exportToExcel } from "@/utils/excel";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";


export default function Computers() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingDevice, setViewingDevice] = useState<Computer | null>(null);
  const [editingDevice, setEditingDevice] = useState<Computer | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Computer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, login } = useAuth();

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

  // Memoized filtered and sorted computers
  const filteredComputers = useMemo(() => {
    return computers
      .filter(comp => {
        if (selectedCompany !== "All" && comp.company !== selectedCompany) {
          return false;
        }

        if (!searchQuery) return true;
        
        const searchLower = searchQuery.toLowerCase();
        
        if (filterCategory === "All") {
          return (
            comp.id.toLowerCase().includes(searchLower) ||
            comp.model.toLowerCase().includes(searchLower) ||
            comp.user.toLowerCase().includes(searchLower) ||
            comp.serialNo.toLowerCase().includes(searchLower) ||
            comp.department.toLowerCase().includes(searchLower)
          );
        }
        
        const value = String(comp[filterCategory] || "").toLowerCase();
        return value.includes(searchLower);
      })
      .sort((a, b) => a.user.localeCompare(b.user));
  }, [computers, searchQuery, filterCategory, selectedCompany]);

  // Fetch from Supabase on mount
  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('computers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching computers:", error);
    } else if (data) {
      // Map snake_case from DB to camelCase for UI
      const mapped: Computer[] = data.map(item => ({
        id: item.id,
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
      setComputers(mapped);
    }
    setIsLoading(false);
  };

  const mapToDB = (comp: Computer) => ({
    id: comp.id,
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

    const { error } = await supabase
      .from('computers')
      .insert([mapToDB(newComputer)]);

    if (error) {
      alert("Error saving to database: " + error.message);
    } else {
      await fetchComputers();
      setIsAddModalOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDevice) return;
    const formData = new FormData(e.currentTarget);
    const updatedComputer: Computer = {
      ...editingDevice,
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

    const { error } = await supabase
      .from('computers')
      .update(mapToDB(updatedComputer))
      .eq('id', updatedComputer.id);

    if (error) {
      alert("Error updating database: " + error.message);
    } else {
      await fetchComputers();
      setEditingDevice(null);
    }
  };

  const confirmDelete = async () => {
    if (deletingDevice) {
      const { error } = await supabase
        .from('computers')
        .delete()
        .eq('id', deletingDevice.id);

      if (error) {
        alert("Error deleting from database: " + error.message);
      } else {
        await fetchComputers();
        setDeletingDevice(null);
      }
    }
  };

  const FormFields = ({ def }: { def?: Computer }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {!def && (
        <div>
          <label className="block text-sm font-bold text-app-muted mb-1">Device ID</label>
          <input required name="id" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. MAC-005" />
        </div>
      )}
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Model Name</label>
        <input required defaultValue={def?.model} name="model" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. MacBook Pro 14" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Assigned To</label>
        <input defaultValue={def?.user} name="user" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="User Name (Optional)" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Company</label>
        <select defaultValue={def?.company} name="company" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500">
          <option value="Whitespace Partners">Whitespace Partners</option>
          <option value="Whitespace Connect">Whitespace Connect</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Department</label>
        <input required defaultValue={def?.department} name="department" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. Engineering" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Type</label>
        <select defaultValue={def?.type} name="type" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500">
          <option value="Laptop">Laptop</option>
          <option value="Desktop">Desktop</option>
          <option value="MacOS">MacOS</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Status</label>
        <select defaultValue={def?.status} name="status" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500">
          <option value="Available">Available</option>
          <option value="Active">Active</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">OS</label>
        <input required defaultValue={def?.os} name="os" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. macOS 14" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">OS Key</label>
        <input defaultValue={def?.osKey} name="osKey" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="Product Key" />
      </div>
      
      <div className="sm:col-span-2 mt-4"><h3 className="text-sm font-semibold text-app-text border-b border-app-border pb-2 uppercase tracking-wider">Hardware Specifications</h3></div>
      
      <div><label className="block text-sm font-medium text-app-muted mb-1">Serial No.</label><input required defaultValue={def?.serialNo} name="serialNo" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-sm font-medium text-app-muted mb-1">MAC Address</label><input required defaultValue={def?.macAddress} name="macAddress" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-sm font-medium text-app-muted mb-1">MainBoard</label><input required defaultValue={def?.mainBoard} name="mainBoard" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-sm font-medium text-app-muted mb-1">CPU</label><input required defaultValue={def?.cpu} name="cpu" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-sm font-medium text-app-muted mb-1">RAM</label><input required defaultValue={def?.ram} name="ram" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div><label className="block text-sm font-medium text-app-muted mb-1">Graphic Card</label><input required defaultValue={def?.gpu} name="gpu" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" /></div>
      <div className="sm:col-span-2"><label className="block text-sm font-medium text-app-muted mb-1">Hardisk (Storage)</label><input required defaultValue={def?.hdd} name="hdd" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" /></div>
      
      <div className="sm:col-span-2 mt-2"><h3 className="text-sm font-semibold text-app-text border-b border-app-border pb-2 uppercase tracking-wider">Purchase & Warranty</h3></div>
      
      <div>
        <label className="block text-sm font-medium text-app-muted mb-1">Purchase Date</label>
        <input required defaultValue={def?.purchaseDate} name="purchaseDate" type="date" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-app-muted mb-1">Warranty Expiry</label>
        <input required defaultValue={def?.warranty} name="warranty" type="date" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-app-muted mb-1">Price (THB)</label>
        <input required defaultValue={def?.price} name="price" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. 120,000" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-app-text">Computers</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-app-muted">Manage all hardware devices and their assignments.</p>
            <div className="h-4 w-[1px] bg-app-border mx-1" />
            <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
              {filteredComputers.length} Records
            </span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 w-full sm:w-auto"
        >
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none bg-app-surface border border-app-border hover:bg-app-bg text-app-text px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => checkPin('add')}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 justify-center active:scale-95"
          >
            <Plus className="w-5 h-5" />
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
        <div className="p-4 border-b border-app-border flex flex-col gap-4 bg-app-surface/50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCompany('All')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                selectedCompany === 'All'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500'
                  : 'bg-app-bg text-app-muted border border-app-border hover:text-app-text hover:border-blue-500/30'
              }`}
            >
              <Building2 className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setSelectedCompany('Whitespace Partners')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                selectedCompany === 'Whitespace Partners'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                  : 'bg-app-bg text-app-muted border border-app-border hover:text-purple-400 hover:border-purple-500/30'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Whitespace Partners
            </button>
            <button
              onClick={() => setSelectedCompany('Whitespace Connect')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                selectedCompany === 'Whitespace Connect'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'bg-app-bg text-app-muted border border-app-border hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Whitespace Connect
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative max-w-md w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                type="text"
                placeholder={filterCategory === "All" ? "Search all fields..." : `Search in ${filterCategory}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl py-2 pl-10 pr-4 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-app-muted absolute ml-3 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-app-bg border border-app-border rounded-xl py-2 pl-9 pr-4 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer w-full md:w-48 font-bold"
              >
                <option value="All">Search All Fields</option>
                <option value="user">Search by User</option>
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
                <th className="p-4 font-bold whitespace-nowrap">Assigned To</th>
                <th className="p-4 font-bold whitespace-nowrap">Device Info</th>
                <th className="p-4 font-bold whitespace-nowrap">Company</th>
                <th className="p-4 font-bold whitespace-nowrap">Department</th>
                <th className="p-4 font-bold whitespace-nowrap">OS</th>
                <th className="p-4 font-bold whitespace-nowrap">Status</th>
                <th className="p-4 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {filteredComputers.map((comp, i) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  key={comp.id}
                  className="hover:bg-app-bg/50 transition-colors group"
                >
                  <td className="p-4 text-sm text-app-text font-bold">{comp.user}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-app-bg border border-app-border rounded-xl text-app-muted group-hover:text-blue-400 group-hover:scale-110 transition-all">
                        {comp.type === "Desktop" ? <Monitor className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-app-text">{comp.model}</p>
                        <p className="text-[10px] text-app-muted font-bold uppercase mt-0.5">{comp.id} • {comp.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-2 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      comp.company === 'Whitespace Partners' 
                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                        : comp.company === 'Whitespace Connect'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-app-bg text-app-text border-app-border'
                    }`}>
                      <Building2 className="w-3.5 h-3.5" />
                      {comp.company}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-app-muted font-bold uppercase">{comp.department}</td>
                  <td className="p-4 text-xs text-app-muted font-bold">{comp.os}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      comp.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setViewingDevice(comp)}
                        className="p-2 text-app-muted hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all font-bold border border-app-border hover:border-blue-500/20"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => checkPin('edit', comp)}
                        className="p-2 text-app-muted hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all font-bold border border-app-border hover:border-amber-500/20"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => checkPin('delete', comp)}
                        className="p-2 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold border border-app-border hover:border-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
              <div className="flex justify-end gap-3 p-4 border-t border-app-border shrink-0">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-app-muted hover:text-app-text transition-colors">Cancel</button>
                <button form="add-form" type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">Save Device</button>
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
                <div>
                  <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">Edit Device</h2>
                  <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{editingDevice.id}</p>
                </div>
                <button onClick={() => setEditingDevice(null)} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="edit-form" onSubmit={handleEditSubmit} className="space-y-4">
                  <FormFields def={editingDevice} />
                </form>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-app-border shrink-0">
                <button type="button" onClick={() => setEditingDevice(null)} className="px-6 py-2.5 text-sm font-bold text-app-muted hover:text-app-text transition-colors">Cancel</button>
                <button form="edit-form" type="submit" className="px-6 py-2.5 text-sm font-bold text-app-bg bg-amber-400 rounded-xl hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 active:scale-95">Update Device</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingDevice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-surface border border-red-500/20 rounded-3xl w-full max-w-md p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-app-text mb-2 uppercase">Delete Device?</h2>
              <p className="text-app-muted mb-8 font-medium">
                Are you sure you want to remove <span className="text-app-text font-bold">&quot;{deletingDevice.model}&quot;</span> ({deletingDevice.id})?<br/>
                This action is permanent.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingDevice(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-app-muted hover:bg-app-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Device Details Modal */}
      <AnimatePresence>
        {viewingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-app-surface border border-app-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-app-border">
                <div>
                  <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">{viewingDevice.model}</h2>
                  <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{viewingDevice.id}</p>
                </div>
                <button onClick={() => setViewingDevice(null)} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">Assignment Info</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-app-muted">User:</span><span className="text-app-text font-bold">{viewingDevice.user}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Company:</span><span className="text-app-text font-bold">{viewingDevice.company}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Department:</span><span className="text-app-text font-bold">{viewingDevice.department}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Status:</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            viewingDevice.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>{viewingDevice.status.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">Purchase & Warranty</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-app-muted">Purchase Date:</span><span className="text-app-text font-bold">{viewingDevice.purchaseDate}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Warranty Ends:</span><span className="text-emerald-500 font-bold">{viewingDevice.warranty}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Price:</span><span className="text-app-text font-bold">฿{viewingDevice.price}</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">Hardware Specs</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-app-muted">Type:</span><span className="text-app-text font-bold">{viewingDevice.type}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Serial No.:</span><span className="text-app-text font-mono font-bold">{viewingDevice.serialNo}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">MAC Address:</span><span className="text-app-text font-mono font-bold">{viewingDevice.macAddress}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">MainBoard:</span><span className="text-app-text font-bold">{viewingDevice.mainBoard}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">CPU:</span><span className="text-app-text font-bold">{viewingDevice.cpu}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">RAM:</span><span className="text-app-text font-bold">{viewingDevice.ram}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Graphic:</span><span className="text-app-text font-bold">{viewingDevice.gpu}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">Hardisk:</span><span className="text-app-text font-bold">{viewingDevice.hdd}</span></div>
                      <div className="flex justify-between"><span className="text-app-muted">OS:</span><span className="text-app-text font-bold">{viewingDevice.os}</span></div>
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[10px] text-app-muted font-bold uppercase">OS Key:</span>
                        <code className="text-xs bg-app-bg p-3 rounded-xl border border-app-border text-purple-500 font-mono break-all font-bold tracking-tight">
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

      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={onPinSuccess}
      />
    </div>
  );
}
