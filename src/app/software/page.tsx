"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Box, X, Users, DollarSign, Trash2, UserPlus, Edit2, AlertTriangle, Download, LayoutGrid, List, Eye } from "lucide-react";
import { initialSoftware, Software as SoftwareType, AssignedUser } from "@/data/software";
import PinModal from "@/components/PinModal";
import { exportToExcel } from "@/utils/excel";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";


export default function Software() {
  const [softwareList, setSoftwareList] = useState<SoftwareType[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<SoftwareType | null>(null);
  const [deletingSoftwareId, setDeletingSoftwareId] = useState<string | null>(null);
  const [viewingSoftwareId, setViewingSoftwareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, login } = useAuth();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // PIN Protection State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'edit' | 'delete' | 'assign' | 'remove', data?: any } | null>(null);

  const handleExport = async () => {
    // Flatten assigned users for better excel view
    const exportData = softwareList.map(sw => ({
      ID: sw.id,
      Name: sw.name,
      Type: sw.type,
      Status: sw.status,
      Seats: sw.seats,
      Used: sw.used,
      Expiry: sw.expiry,
      'Price/Unit': sw.pricePerUnit,
      License: sw.licenseType,
      Detail: sw.detail
    }));
    await exportToExcel(exportData, "IT-Assets-Software");
  };

  const checkPin = (type: 'add' | 'edit' | 'delete' | 'assign' | 'remove', data?: any) => {
    if (isAdmin) {
      if (type === 'add') setIsAddModalOpen(true);
      else if (type === 'edit') setEditingSoftware(data);
      else if (type === 'delete') setDeletingSoftwareId(data);
      else if (type === 'assign') performAssignUser(data);
      else if (type === 'remove') performRemoveUser(data);
    } else {
      setPendingAction({ type, data });
      setIsPinModalOpen(true);
    }
  };

  const onPinSuccess = () => {
    login();
    if (!pendingAction) return;
    
    if (pendingAction.type === 'add') {
      setIsAddModalOpen(true);
    } else if (pendingAction.type === 'edit') {
      setEditingSoftware(pendingAction.data);
    } else if (pendingAction.type === 'delete') {
      setDeletingSoftwareId(pendingAction.data);
    } else if (pendingAction.type === 'assign') {
      performAssignUser(pendingAction.data);
    } else if (pendingAction.type === 'remove') {
      performRemoveUser(pendingAction.data);
    }
    setPendingAction(null);
  };


  // Fetch from Supabase
  useEffect(() => {
    fetchSoftware();
  }, []);

  const fetchSoftware = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('software')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching software:", error);
    } else if (data) {
      const mapped: SoftwareType[] = data.map(item => ({
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

  const mapToDB = (sw: SoftwareType) => ({
    id: sw.id,
    name: sw.name,
    detail: sw.detail,
    seats: sw.seats,
    used: sw.used,
    expiry: sw.expiry,
    status: sw.status,
    price_per_unit: sw.pricePerUnit,
    type: sw.type,
    license_type: sw.licenseType,
    assigned_users: sw.assignedUsers
  });

  // Filtered software list
  const filteredSoftware = softwareList.filter(sw => 
    sw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sw.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sw.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sw.type.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const viewingSoftware = softwareList.find(s => s.id === viewingSoftwareId) || null;
  const deletingSoftware = softwareList.find(s => s.id === deletingSoftwareId) || null;

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSoftware: SoftwareType = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      detail: formData.get("detail") as string,
      seats: parseInt(formData.get("seats") as string),
      used: parseInt(formData.get("used") as string),
      expiry: formData.get("expiry") as string,
      status: formData.get("status") as "Active" | "Warning" | "Expired",
      pricePerUnit: parseFloat(formData.get("pricePerUnit") as string),
      type: formData.get("type") as "Back office" | "Designer",
      licenseType: formData.get("licenseType") as "Monthly" | "Yearly",
      assignedUsers: [],
    };
    
    const { error } = await supabase.from('software').insert([mapToDB(newSoftware)]);
    if (error) {
      alert("Error adding software: " + error.message);
    } else {
      await fetchSoftware();
      setIsAddModalOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSoftware) return;
    const formData = new FormData(e.currentTarget);
    const updatedSoftware: SoftwareType = {
      ...editingSoftware,
      name: formData.get("name") as string,
      detail: formData.get("detail") as string,
      seats: parseInt(formData.get("seats") as string),
      used: parseInt(formData.get("used") as string),
      expiry: formData.get("expiry") as string,
      status: formData.get("status") as "Active" | "Warning" | "Expired",
      pricePerUnit: parseFloat(formData.get("pricePerUnit") as string),
      type: formData.get("type") as "Back office" | "Designer",
      licenseType: formData.get("licenseType") as "Monthly" | "Yearly",
    };

    const { error } = await supabase
      .from('software')
      .update(mapToDB(updatedSoftware))
      .eq('id', updatedSoftware.id);

    if (error) {
      alert("Error updating software: " + error.message);
    } else {
      await fetchSoftware();
      setEditingSoftware(null);
    }
  };

  const confirmDelete = async () => {
    if (deletingSoftwareId) {
      const { error } = await supabase.from('software').delete().eq('id', deletingSoftwareId);
      if (error) {
        alert("Error deleting software: " + error.message);
      } else {
        await fetchSoftware();
        if (viewingSoftwareId === deletingSoftwareId) setViewingSoftwareId(null);
        setDeletingSoftwareId(null);
      }
    }
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUser: AssignedUser = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      department: formData.get("department") as string,
    };
    checkPin('assign', { newUser, form: e.currentTarget });
  };

  const performAssignUser = async ({ newUser, form }: { newUser: AssignedUser, form: HTMLFormElement }) => {
    if (!viewingSoftware) return;
    
    const updatedSoftware = {
      ...viewingSoftware,
      used: viewingSoftware.used + 1,
      assignedUsers: [...viewingSoftware.assignedUsers, newUser]
    };

    const { error } = await supabase
      .from('software')
      .update(mapToDB(updatedSoftware))
      .eq('id', viewingSoftware.id);

    if (error) {
      alert("Error assigning user: " + error.message);
    } else {
      await fetchSoftware();
      form.reset();
    }
  };

  const handleRemoveUser = (emailToRemove: string) => {
    checkPin('remove', emailToRemove);
  };

  const performRemoveUser = async (emailToRemove: string) => {
    if (!viewingSoftware) return;
    const updatedSoftware = {
      ...viewingSoftware,
      used: Math.max(0, viewingSoftware.used - 1),
      assignedUsers: viewingSoftware.assignedUsers.filter(u => u.email !== emailToRemove)
    };

    const { error } = await supabase
      .from('software')
      .update(mapToDB(updatedSoftware))
      .eq('id', viewingSoftware.id);

    if (error) {
      alert("Error removing user: " + error.message);
    } else {
      await fetchSoftware();
    }
  };

  const FormFields = ({ def }: { def?: SoftwareType }) => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Software Name</label>
        <input required defaultValue={def?.name} name="name" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">License ID</label>
        <input required defaultValue={def?.id} readOnly={!!def} name="id" type="text" className={`w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500 ${def ? 'opacity-50 cursor-not-allowed' : ''}`} />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-bold text-app-muted mb-1">Detail / Note</label>
        <input defaultValue={def?.detail} name="detail" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Type (Category)</label>
        <select defaultValue={def?.type} name="type" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500">
          <option value="Back office">Back office</option>
          <option value="Designer">Designer</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">License Type</label>
        <select defaultValue={def?.licenseType} name="licenseType" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500">
          <option value="Monthly">Monthly</option>
          <option value="Yearly">Yearly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Total Seats</label>
        <input required defaultValue={def?.seats} name="seats" type="number" min="1" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Seats Used</label>
        <input required defaultValue={def?.used || 0} name="used" type="number" min="0" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Expiry Date</label>
        <input required defaultValue={def?.expiry} name="expiry" type="date" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-app-muted mb-1">Status</label>
        <select defaultValue={def?.status} name="status" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500">
          <option value="Active">Active</option>
          <option value="Warning">Warning</option>
          <option value="Expired">Expired</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-bold text-app-muted mb-1">Price Per License/Unit (THB)</label>
        <input required defaultValue={def?.pricePerUnit} name="pricePerUnit" type="number" step="0.01" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-purple-500" />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-app-text">Software Licenses</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-app-muted">Manage software subscriptions and seat allocations.</p>
            <div className="h-4 w-[1px] bg-app-border mx-1" />
            <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
              {filteredSoftware.length} Licenses
            </span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >

          <button
            onClick={handleExport}
            className="bg-app-surface border border-app-border hover:bg-app-bg text-app-text px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => checkPin('add')}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add License
          </button>
        </motion.div>
      </div>

      {/* Search & View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder="Search by Name, ID, Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          />
        </div>
        <div className="flex bg-app-surface border border-app-border rounded-xl p-1 w-full sm:w-auto">
          <button 
            onClick={() => setViewMode("card")}
            className={`flex-1 sm:flex-none p-1.5 rounded-lg transition-all flex justify-center ${viewMode === 'card' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-app-muted hover:text-app-text'}`}
            title="Card View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode("table")}
            className={`flex-1 sm:flex-none p-1.5 rounded-lg transition-all flex justify-center ${viewMode === 'table' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-app-muted hover:text-app-text'}`}
            title="Table View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSoftware.map((software, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={software.id}
              className="group relative bg-app-surface border border-app-border rounded-2xl p-5 hover:border-purple-500/50 transition-all cursor-pointer shadow-sm hover:shadow-purple-500/10"
              onClick={() => setViewingSoftwareId(software.id)}
            >
              {/* Top Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-app-bg border border-app-border rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-app-text line-clamp-1">{software.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-black text-app-muted bg-app-bg px-1.5 py-0.5 rounded border border-app-border">{software.type}</span>
                      <span className="text-[10px] uppercase font-black text-purple-400 bg-purple-500/5 px-1.5 py-0.5 rounded border border-purple-500/10">{software.licenseType}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); checkPin('edit', software); }}
                    className="p-2 text-app-muted hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); checkPin('delete', software.id); }}
                    className="p-2 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-app-muted font-bold uppercase tracking-wider text-[10px]">Utilization</span>
                    <span className="font-bold text-app-text">{software.used} / {software.seats}</span>
                  </div>
                  <div className="h-1.5 w-full bg-app-bg rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        (software.used / software.seats) > 0.9 ? 'bg-amber-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${(software.used / software.seats) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-app-border/50">
                  <div className="text-[11px]">
                    <span className="text-app-muted block font-bold uppercase text-[9px]">Next Renewal</span>
                    <span className="text-app-text font-bold">{software.expiry}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    software.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    software.status === "Warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {software.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-app-bg text-app-muted text-[10px] uppercase font-black tracking-widest border-b border-app-border">
                  <th className="p-4 font-bold">Software</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">License</th>
                  <th className="p-4 font-bold">Usage</th>
                  <th className="p-4 font-bold">Expiry</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredSoftware.map((software, i) => (
                  <tr key={software.id} className="group hover:bg-app-bg/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-app-bg border border-app-border rounded-lg text-purple-400">
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-app-text text-sm">{software.name}</p>
                          <p className="text-[10px] text-app-muted uppercase font-bold">{software.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] uppercase font-black text-app-muted bg-app-bg px-2 py-0.5 rounded border border-app-border">{software.type}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] uppercase font-black text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{software.licenseType}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-app-bg rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (software.used / software.seats) > 0.9 ? 'bg-amber-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${(software.used / software.seats) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-app-text">{software.used}/{software.seats}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-app-text">{software.expiry}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        software.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        software.status === "Warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {software.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setViewingSoftwareId(software.id)}
                          className="p-2 text-app-muted hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => checkPin('edit', software)}
                          className="p-2 text-app-muted hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => checkPin('delete', software.id)}
                          className="p-2 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add/Edit License Modal */}
      <AnimatePresence>
        {(isAddModalOpen || editingSoftware) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-app-surface border border-app-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-app-border">
                <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">{editingSoftware ? "Edit License" : "New License"}</h2>
                <button onClick={() => { setIsAddModalOpen(false); setEditingSoftware(null); }} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={editingSoftware ? handleEditSubmit : handleAddSubmit} className="p-6 space-y-6">
                <FormFields def={editingSoftware || undefined} />
                <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
                  <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingSoftware(null); }} className="px-6 py-2.5 text-sm font-bold text-app-muted hover:text-app-text transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                    {editingSoftware ? "Update Changes" : "Create License"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingSoftwareId && (
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
              <h2 className="text-2xl font-black text-app-text mb-2 uppercase">Confirm Deletion</h2>
              <p className="text-app-muted mb-8 font-medium">
                Are you sure you want to delete <span className="text-app-text font-bold">&quot;{deletingSoftware?.name}&quot;</span>?<br/>
                This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingSoftwareId(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-app-muted hover:bg-app-bg transition-colors"
                >
                  Keep it
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Software Details Modal */}
      <AnimatePresence>
        {viewingSoftware && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-app-surface border border-app-border rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-app-border shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">{viewingSoftware.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-app-muted bg-app-bg px-2 py-0.5 rounded border border-app-border uppercase">{viewingSoftware.type}</span>
                      <span className="text-[10px] font-black text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 uppercase">{viewingSoftware.licenseType}</span>
                      <p className="text-[10px] text-app-muted ml-2 uppercase font-bold tracking-widest">{viewingSoftware.id}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewingSoftwareId(null)} className="text-app-muted hover:text-app-text bg-app-bg border border-app-border p-2 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-app-bg border border-app-border p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Users className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] text-app-muted font-black uppercase tracking-widest">Seats Usage</p>
                      <p className="text-xl font-black text-app-text">{viewingSoftware.used} / {viewingSoftware.seats}</p>
                    </div>
                  </div>
                  <div className="bg-app-bg border border-app-border p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] text-app-muted font-black uppercase tracking-widest">Cost per Seat</p>
                      <p className="text-xl font-black text-app-text">฿{new Intl.NumberFormat('en-US').format(viewingSoftware.pricePerUnit)}</p>
                    </div>
                  </div>
                  <div className="bg-app-bg border border-app-border p-5 rounded-2xl flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      viewingSoftware.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                      viewingSoftware.status === 'Warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}><Box className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] text-app-muted font-black uppercase tracking-widest">Status</p>
                      <p className="text-xl font-black text-app-text">{viewingSoftware.status.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="bg-app-bg border border-app-border p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] text-app-muted font-black uppercase tracking-widest">Expiry Date</p>
                      <p className="text-xl font-black text-app-text">{viewingSoftware.expiry}</p>
                    </div>
                  </div>
                </div>

                {viewingSoftware.detail && (
                  <div className="bg-app-bg border border-app-border p-4 rounded-2xl mb-8">
                    <p className="text-[10px] text-app-muted font-black uppercase tracking-widest mb-1">Detail / Note</p>
                    <p className="text-sm font-medium text-app-text">{viewingSoftware.detail}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4 border-b border-app-border pb-3">
                      <h4 className="text-[10px] font-black text-app-text uppercase tracking-widest">Assigned Users ({viewingSoftware.assignedUsers.length})</h4>
                    </div>
                    {viewingSoftware.assignedUsers.length > 0 ? (
                      <div className="bg-app-bg border border-app-border rounded-2xl overflow-hidden shadow-inner">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-app-surface/50 text-app-muted border-b border-app-border">
                            <tr>
                              <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest">User Details</th>
                              <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest">Department</th>
                              <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-app-border/50">
                            {viewingSoftware.assignedUsers.map((u, idx) => (
                              <tr key={idx} className="hover:bg-app-surface/50 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="font-bold text-app-text">{u.name}</div>
                                  <div className="text-[11px] text-app-muted font-medium">{u.email}</div>
                                </td>
                                <td className="px-5 py-4 text-app-muted font-black text-[10px] uppercase tracking-tight">{u.department}</td>
                                <td className="px-5 py-4 text-right">
                                  <button onClick={() => handleRemoveUser(u.email)} className="p-2 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-app-bg border border-app-border rounded-2xl border-dashed">
                        <Users className="w-10 h-10 text-app-muted/30 mx-auto mb-4" />
                        <p className="text-app-muted text-xs font-bold uppercase tracking-wider">No users assigned yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-app-bg border border-app-border rounded-2xl p-6 h-fit shadow-xl">
                    <h4 className="text-[10px] font-black text-app-text flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-app-border pb-3">
                      <UserPlus className="w-4 h-4 text-purple-400" />
                      Assign User
                    </h4>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-app-muted mb-1 uppercase tracking-wider">Full Name</label>
                        <input required name="name" type="text" className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-purple-500" placeholder="e.g. Jane Doe" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-app-muted mb-1 uppercase tracking-wider">Email Address</label>
                        <input required name="email" type="email" className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-purple-500" placeholder="jane@company.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-app-muted mb-1 uppercase tracking-wider">Department</label>
                        <input required name="department" type="text" className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-purple-500" placeholder="e.g. Marketing" />
                      </div>
                      <button type="submit" disabled={viewingSoftware.used >= viewingSoftware.seats} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-2 ${viewingSoftware.used >= viewingSoftware.seats ? 'bg-app-surface text-app-muted cursor-not-allowed border border-app-border' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 active:scale-95'}`}>
                        {viewingSoftware.used >= viewingSoftware.seats ? 'Seats Full' : 'Assign Seat'}
                      </button>
                    </form>
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
