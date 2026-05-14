"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Package, X, Eye, Edit, MapPin, User, Calendar, CreditCard, Download } from "lucide-react";
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


export default function RentalEquipments() {
  const [equipments, setEquipments] = useState<RentalEquipment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<RentalEquipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, login } = useAuth();

  // PIN Protection State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'edit', data?: any } | null>(null);

  useEffect(() => {
    fetchEquipments();
  }, []);

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

  const checkPin = (type: 'add' | 'edit', data?: any) => {
    if (isAdmin) {
      if (type === 'add') setIsAddModalOpen(true);
      else if (type === 'edit') setEditingEquip(data);
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
    }
    setPendingAction(null);
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
      holder: formData.get("holder") as string || "-",
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
        <div className="p-4 border-b border-app-border flex flex-col md:flex-row gap-4 justify-between bg-app-surface/50">
          <div className="relative max-w-md w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search by ID, Model, Holder..."
              className="w-full bg-app-bg border border-app-border rounded-xl py-2 pl-10 pr-4 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-app-border rounded-xl text-app-text hover:bg-app-bg transition-colors w-full md:w-auto justify-center font-bold text-sm">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-bg/50 text-app-muted text-[10px] uppercase font-black tracking-widest border-b border-app-border">
                <th className="p-4 font-bold">Asset ID</th>
                <th className="p-4 font-bold">Item / Model</th>
                <th className="p-4 font-bold">Storage</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Holder</th>
                <th className="p-4 font-bold">Warranty</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {equipments.map((item, i) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  key={item.assetId}
                  className="hover:bg-app-bg/50 transition-colors group"
                >
                  <td className="p-4 text-sm font-bold font-mono text-blue-500">{item.assetId}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-app-bg border border-app-border rounded-xl text-app-muted group-hover:text-emerald-400 group-hover:scale-110 transition-all">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-app-text">{item.model}</p>
                        <p className="text-[10px] text-app-muted font-bold uppercase mt-0.5">SN: {item.serialNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold uppercase">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {item.location}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      item.status === "Available" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-app-text font-bold">
                      <User className="w-3.5 h-3.5 text-app-muted" />
                      {item.holder}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-app-muted font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 opacity-50" />
                      {item.warranty}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => checkPin('edit', item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-app-text hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all font-bold border border-app-border hover:border-blue-500/20"
                    >
                      <Edit className="w-4 h-4" />
                      Update
                    </button>
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
                        <label className="block text-sm font-bold text-app-muted mb-1">Asset ID</label>
                        <input required name="assetId" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="e.g. EQ-101" />
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
                      <select defaultValue={editingEquip?.status} name="status" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500">
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-app-muted mb-1">Holder</label>
                      <input defaultValue={editingEquip?.holder} name="holder" type="text" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-app-text focus:outline-none focus:border-blue-500" placeholder="User Name (Optional)" />
                    </div>
                    
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

      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={onPinSuccess}
      />
    </div>
  );
}
