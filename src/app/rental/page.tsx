"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, X, Eye, Edit, MapPin, User, Calendar, CreditCard, Download, Trash2, History, LogOut, LogIn } from "lucide-react";
import PinModal from "@/components/PinModal";
import { exportToExcel } from "@/utils/excel";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type RentalEquipment = {
  assetId: string;
  model: string;
  serialNo: string;
  warranty: string;
  purchaseDate: string;
  cost: string;
  location: string;
  status: "Available" | "Busy";
  holder: string;
  remark: string;
};

type RentalHistory = {
  id?: string;
  asset_id: string;
  model: string;
  action: "Rental" | "Return";
  holder: string;
  date: string;
};


export default function RentalEquipments() {
  const [equipments, setEquipments] = useState<RentalEquipment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingEquip, setViewingEquip] = useState<RentalEquipment | null>(null);
  const [editingEquip, setEditingEquip] = useState<RentalEquipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, login } = useAuth();

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [rentalHistory, setRentalHistory] = useState<RentalHistory[]>([]);
  const [rentingEquip, setRentingEquip] = useState<RentalEquipment | null>(null);
  const [returningEquip, setReturningEquip] = useState<RentalEquipment | null>(null);

  // PIN Protection State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'edit' | 'delete', data?: any } | null>(null);

  useEffect(() => {
    fetchEquipments();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('rental_history')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setRentalHistory(data);
    }
  };

  const fetchEquipments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rental_equipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching rental equipments:", error);
    } else if (data) {
      setEquipments(data.map(item => ({
        assetId: item.asset_id,
        model: item.model,
        serialNo: item.serial_no,
        warranty: item.warranty,
        purchaseDate: item.purchase_date,
        cost: item.cost,
        location: item.location,
        status: item.status as "Available" | "Busy",
        holder: item.holder,
        remark: item.remark
      })));
    }
    setIsLoading(false);
  };

  const getNextAssetId = () => {
    if (equipments.length === 0) return "EQ-101";
    
    const eqNumbers = equipments
      .map(eq => {
        const match = eq.assetId.match(/EQ-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
      
    if (eqNumbers.length === 0) return "EQ-101";
    
    const maxNum = Math.max(...eqNumbers);
    return `EQ-${maxNum + 1}`;
  };

  const sortedEquipments = [...equipments].sort((a, b) => {
    const numA = parseInt(a.assetId.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.assetId.replace(/\D/g, '')) || 0;
    
    if (numA !== numB) return numA - numB;
    return a.assetId.localeCompare(b.assetId);
  });

  const mapToDB = (equip: RentalEquipment) => ({
    asset_id: equip.assetId,
    model: equip.model,
    serial_no: equip.serialNo,
    warranty: equip.warranty,
    purchase_date: equip.purchaseDate,
    cost: equip.cost,
    location: equip.location,
    status: equip.status,
    holder: equip.holder,
    remark: equip.remark
  });

  const handleExport = async () => {
    await exportToExcel(equipments, "IT-Assets-Rental-Equipments");
  };

  const checkPin = (type: 'add' | 'edit' | 'delete', data?: any) => {
    if (isAdmin) {
      if (type === 'add') setIsAddModalOpen(true);
      else if (type === 'edit') setEditingEquip(data);
      else if (type === 'delete') handleDelete(data.assetId);
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
      setEditingEquip(pendingAction.data);
    } else if (pendingAction.type === 'delete') {
      handleDelete(pendingAction.data.assetId);
    }
    setPendingAction(null);
  };

  const handleDelete = async (assetId: string) => {
    if (window.confirm("Are you sure you want to delete this equipment?")) {
      const { error } = await supabase
        .from('rental_equipments')
        .delete()
        .eq('asset_id', assetId);

      if (error) {
        alert("Error deleting equipment: " + error.message);
      } else {
        await fetchEquipments();
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEquip: RentalEquipment = {
      assetId: formData.get("assetId") as string,
      model: formData.get("model") as string,
      serialNo: formData.get("serialNo") as string,
      warranty: formData.get("warranty") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      cost: formData.get("cost") as string,
      location: formData.get("location") as string,
      status: formData.get("status") as "Available" | "Busy",
      holder: "-",
      remark: formData.get("remark") as string,
    };
    
    const { error } = await supabase.from('rental_equipments').insert([mapToDB(newEquip)]);
    if (error) {
      alert("Error adding equipment: " + error.message);
    } else {
      await fetchEquipments();
      setIsAddModalOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEquip) return;
    const formData = new FormData(e.currentTarget);
    const updatedEquip: RentalEquipment = {
      ...editingEquip,
      model: formData.get("model") as string,
      serialNo: formData.get("serialNo") as string,
      warranty: formData.get("warranty") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      cost: formData.get("cost") as string,
      location: formData.get("location") as string,
      status: formData.get("status") as "Available" | "Busy",
      holder: formData.get("holder") as string || "-",
      remark: formData.get("remark") as string,
    };

    const { error } = await supabase
      .from('rental_equipments')
      .update(mapToDB(updatedEquip))
      .eq('asset_id', updatedEquip.assetId);

    if (error) {
      alert("Error updating equipment: " + error.message);
    } else {
      await fetchEquipments();
      setEditingEquip(null);
    }
  };

  const handleRentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rentingEquip) return;
    const formData = new FormData(e.currentTarget);
    const holder = formData.get("holder") as string;
    const date = new Date().toISOString().split('T')[0];

    const { error: equipError } = await supabase
      .from('rental_equipments')
      .update({ status: 'Busy', holder: holder })
      .eq('asset_id', rentingEquip.assetId);

    if (equipError) {
      alert("Error updating equipment: " + equipError.message);
      return;
    }

    await supabase.from('rental_history').insert([{
      asset_id: rentingEquip.assetId,
      model: rentingEquip.model,
      action: 'Rental',
      holder: holder,
      date: date
    }]);

    await fetchEquipments();
    await fetchHistory();
    setRentingEquip(null);
  };

  const handleReturnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!returningEquip) return;
    const date = new Date().toISOString().split('T')[0];

    const { error: equipError } = await supabase
      .from('rental_equipments')
      .update({ status: 'Available', holder: '-' })
      .eq('asset_id', returningEquip.assetId);

    if (equipError) {
      alert("Error returning equipment: " + equipError.message);
      return;
    }

    await supabase.from('rental_history').insert([{
      asset_id: returningEquip.assetId,
      model: returningEquip.model,
      action: 'Return',
      holder: returningEquip.holder,
      date: date
    }]);

    await fetchEquipments();
    await fetchHistory();
    setReturningEquip(null);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-app-text">Rental Equipments</h1>
          <p className="text-app-muted mt-2">Manage and track non-computer IT assets and accessories.</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap items-center gap-3 w-full sm:w-auto"
        >
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex-1 sm:flex-none bg-app-surface border border-app-border hover:bg-app-bg text-app-text px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <History className="w-5 h-5 text-purple-400" />
            <span>Rental History</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none bg-app-surface border border-app-border hover:bg-app-bg text-app-text px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          )}
          <button
            onClick={() => checkPin('add')}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 justify-center active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Equipment
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm"
      >


        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-bg/50 text-app-muted text-[10px] uppercase font-black tracking-widest border-b border-app-border">
                <th className="p-4 font-bold">Asset ID</th>
                <th className="p-4 font-bold">Item / Model</th>
                <th className="p-4 font-bold">Storage</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Holder</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {sortedEquipments.map((item, i) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  key={item.assetId}
                  className="hover:bg-app-bg/50 transition-colors group"
                >
                  <td className="px-4 py-2 text-sm font-bold font-mono text-blue-500">{item.assetId}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-app-bg border border-app-border rounded-xl text-app-muted group-hover:text-emerald-400 group-hover:scale-110 transition-all">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-app-text">{item.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold uppercase">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {item.location}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      item.status === "Available" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-app-text font-bold">
                      <User className="w-3.5 h-3.5 text-app-muted" />
                      {item.holder}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === 'Available' ? (
                        <button 
                          onClick={() => setRentingEquip(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-white hover:bg-blue-500 rounded-xl transition-all font-bold border border-blue-500/20 hover:border-transparent shadow-sm"
                        >
                          <LogOut className="w-4 h-4" />
                          Rental
                        </button>
                      ) : (
                        <button 
                          onClick={() => setReturningEquip(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 hover:text-white hover:bg-emerald-500 rounded-xl transition-all font-bold border border-emerald-500/20 hover:border-transparent shadow-sm"
                        >
                          <LogIn className="w-4 h-4" />
                          Return
                        </button>
                      )}

                      {!isAdmin && (
                        <button 
                          onClick={() => setViewingEquip(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-app-text hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all font-bold border border-app-border hover:border-blue-500/20 shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      )}

                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => checkPin('edit', item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-app-text hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all font-bold border border-app-border hover:border-blue-500/20"
                          >
                            <Edit className="w-4 h-4" />
                            Update
                          </button>
                          <button 
                            onClick={() => checkPin('delete', item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-app-text hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold border border-app-border hover:border-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || editingEquip) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-app-border shrink-0">
                <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">{editingEquip ? "Update Equipment" : "Add New Equipment"}</h2>
                <button onClick={() => { setIsAddModalOpen(false); setEditingEquip(null); }} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <form id="equip-form" onSubmit={editingEquip ? handleEditSubmit : handleAddSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!editingEquip && (
                      <div>
                        <label className="block text-sm font-bold text-app-muted mb-1">Asset ID (Auto-generated)</label>
                        <input required name="assetId" type="text" defaultValue={getNextAssetId()} readOnly className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500 opacity-70 cursor-not-allowed font-mono font-bold text-blue-400" />
                      </div>
                    )}
                    <div className={editingEquip ? "sm:col-span-2" : ""}>
                      <label className="block text-sm font-bold text-app-muted mb-1">Item / Model</label>
                      <input required defaultValue={editingEquip?.model} name="model" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. Logitech MX Master" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-app-muted mb-1">Serial No.</label>
                      <input required defaultValue={editingEquip?.serialNo} name="serialNo" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-app-muted mb-1">Location Storage</label>
                      <input required defaultValue={editingEquip?.location} name="location" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-app-muted mb-1">Status</label>
                      <select defaultValue={editingEquip?.status || "Available"} name="status" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500">
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                      </select>
                    </div>
                    {editingEquip && (
                      <div>
                        <label className="block text-sm font-bold text-app-muted mb-1">Holder</label>
                        <input defaultValue={editingEquip?.holder} name="holder" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="User Name (Optional)" />
                      </div>
                    )}
                    
                    <div className="sm:col-span-2 border-t border-app-border pt-4 mt-2">
                      <h3 className="text-sm font-bold text-app-text mb-4 flex items-center gap-2 uppercase tracking-widest"><CreditCard className="w-4 h-4 text-blue-400" /> Financial & Warranty</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-app-muted mb-1">Cost (THB)</label>
                          <input required defaultValue={editingEquip?.cost} name="cost" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-app-muted mb-1">Purchase Date</label>
                          <input required defaultValue={editingEquip?.purchaseDate} name="purchaseDate" type="date" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-app-muted mb-1">Warranty</label>
                          <input required defaultValue={editingEquip?.warranty} name="warranty" type="date" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-app-muted mb-1">Remark</label>
                      <textarea defaultValue={editingEquip?.remark} name="remark" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500 h-24" placeholder="Any additional notes..." />
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="flex justify-end gap-3 p-4 border-t border-app-border shrink-0 bg-app-surface/50">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingEquip(null); }} className="px-6 py-2.5 text-sm font-bold text-app-muted hover:text-app-text transition-colors">Cancel</button>
                <button form="equip-form" type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">{editingEquip ? "Update Equipment" : "Add Equipment"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rent Modal */}
      <AnimatePresence>
        {rentingEquip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-app-text mb-4 uppercase flex items-center gap-2"><LogOut className="w-5 h-5 text-blue-500" /> Rent Equipment</h2>
              <form onSubmit={handleRentSubmit} className="space-y-4">
                <div className="bg-app-bg p-3 rounded-xl border border-app-border">
                  <p className="text-xs text-app-muted font-bold uppercase mb-1">Item / Model</p>
                  <p className="text-sm text-app-text font-bold">{rentingEquip.model} <span className="text-blue-400">({rentingEquip.assetId})</span></p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-app-muted mb-1 uppercase">Date</label>
                  <input type="text" readOnly value={new Date().toLocaleDateString()} className="w-full bg-app-bg/50 border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none opacity-70" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-app-muted mb-1 uppercase">Holder Name</label>
                  <input required name="holder" type="text" autoFocus className="w-full bg-app-bg border border-blue-500/30 rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. John Doe" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setRentingEquip(null)} className="flex-1 py-2.5 px-4 rounded-xl font-bold text-app-muted hover:bg-app-bg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Confirm Rent</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Modal */}
      <AnimatePresence>
        {returningEquip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-app-text mb-4 uppercase flex items-center gap-2"><LogIn className="w-5 h-5 text-emerald-500" /> Return Equipment</h2>
              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div className="bg-app-bg p-3 rounded-xl border border-app-border">
                  <p className="text-xs text-app-muted font-bold uppercase mb-1">Item / Model</p>
                  <p className="text-sm text-app-text font-bold">{returningEquip.model} <span className="text-emerald-400">({returningEquip.assetId})</span></p>
                </div>
                <div className="bg-app-bg p-3 rounded-xl border border-app-border">
                  <p className="text-xs text-app-muted font-bold uppercase mb-1">Returning By (Holder)</p>
                  <p className="text-sm text-app-text font-bold">{returningEquip.holder}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-app-muted mb-1 uppercase">Date</label>
                  <input type="text" readOnly value={new Date().toLocaleDateString()} className="w-full bg-app-bg/50 border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none opacity-70" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setReturningEquip(null)} className="flex-1 py-2.5 px-4 rounded-xl font-bold text-app-muted hover:bg-app-bg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">Confirm Return</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-app-surface border border-app-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-app-border shrink-0">
                <h2 className="text-xl font-bold text-app-text uppercase tracking-tight flex items-center gap-2"><History className="w-5 h-5 text-purple-400" /> Rental History</h2>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-0 overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-app-surface z-10">
                    <tr className="bg-app-bg/80 backdrop-blur-md text-app-muted text-[10px] uppercase font-black tracking-widest border-b border-app-border">
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Action</th>
                      <th className="p-4 font-bold">Asset ID</th>
                      <th className="p-4 font-bold">Model</th>
                      <th className="p-4 font-bold">Holder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {rentalHistory.length > 0 ? rentalHistory.map((hist, i) => (
                      <tr key={hist.id || i} className="hover:bg-app-bg/50 transition-colors">
                        <td className="p-4 text-xs font-bold text-app-muted">{hist.date}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            hist.action === 'Rental' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {hist.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono font-bold text-app-text">{hist.asset_id}</td>
                        <td className="p-4 text-xs font-bold text-app-text">{hist.model}</td>
                        <td className="p-4 text-xs font-bold text-app-text">{hist.holder}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-app-muted text-sm font-bold">No rental history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Equipment Details Modal */}
      <AnimatePresence>
        {viewingEquip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-app-surface border border-app-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-app-border">
                <div>
                  <h2 className="text-xl font-bold text-app-text uppercase tracking-tight">{viewingEquip.model}</h2>
                  <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{viewingEquip.assetId}</p>
                </div>
                <button onClick={() => setViewingEquip(null)} className="p-2 text-app-muted hover:text-app-text bg-app-bg border border-app-border rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">Equipment Info</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-app-muted">Asset ID:</span><span className="text-app-text font-mono font-bold">{viewingEquip.assetId}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Model:</span><span className="text-app-text font-bold">{viewingEquip.model}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Serial No.:</span><span className="text-app-text font-mono font-bold">{viewingEquip.serialNo}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Location Storage:</span><span className="text-app-text font-bold">{viewingEquip.location}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Status:</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            viewingEquip.status === "Available" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>{viewingEquip.status.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between"><span className="text-app-muted">Holder:</span><span className="text-app-text font-bold">{viewingEquip.holder}</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">Purchase & Warranty</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-app-muted">Purchase Date:</span><span className="text-app-text font-bold">{viewingEquip.purchaseDate}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Warranty Ends:</span><span className="text-emerald-500 font-bold">{viewingEquip.warranty}</span></div>
                        <div className="flex justify-between"><span className="text-app-muted">Cost:</span><span className="text-app-text font-bold">฿{viewingEquip.cost}</span></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 border-b border-app-border pb-2">Remark</h4>
                      <p className="text-sm text-app-text bg-app-bg p-3 rounded-xl border border-app-border min-h-[60px]">
                        {viewingEquip.remark || "-"}
                      </p>
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
