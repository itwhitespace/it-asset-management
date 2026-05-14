"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, UserPlus, Trash2, ShieldCheck, Mail, Lock, Plus, X } from "lucide-react";
import { Admin, getAdmins, addAdmin, deleteAdmin } from "@/utils/admin";
import Header from "@/components/Header";
import PinModal from "@/components/PinModal";

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", pin: "" });
  const [isLoading, setIsLoading] = useState(true);
  
  // Security State
  const { isAdmin, login } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setIsAuthorized(true);
    } else {
      setIsPinModalOpen(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAuthorized) {
      loadAdmins();
    }
  }, [isAuthorized]);

  const onPinSuccess = () => {
    login();
    setIsAuthorized(true);
  };

  const loadAdmins = async () => {
    setIsLoading(true);
    const data = await getAdmins();
    setAdmins(data);
    setIsLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdmin.name && newAdmin.email && newAdmin.pin.length === 6) {
      try {
        await addAdmin(newAdmin);
        await loadAdmins();
        setNewAdmin({ name: "", email: "", pin: "" });
        setIsAdding(false);
      } catch (err) {
        alert("Error adding admin. Check if email already exists.");
      }
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (admins.length <= 1) {
      alert("At least one admin must remain.");
      return;
    }
    if (confirm("Are you sure you want to remove this admin?")) {
      await deleteAdmin(id);
      await loadAdmins();
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text p-4 lg:p-8">
      <Header title="Settings" subtitle="Manage system administrators and security" />

      {isAuthorized ? (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Admin Management Section */}
          <div className="bg-app-surface border border-app-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold">Admin Management</h2>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Admin</span>
              </button>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="py-20 text-center text-app-muted">Loading administrators...</div>
              ) : (
                <div className="grid gap-4">
                  {admins.map((admin) => (
                    <div 
                      key={admin.id}
                      className="flex items-center justify-between p-4 bg-app-bg/50 border border-app-border rounded-2xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold">{admin.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-app-muted">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {admin.email}</span>
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> PIN: ******</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <div className="w-20 h-20 bg-app-surface border border-app-border rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <Lock className="w-10 h-10 text-app-muted" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Settings Locked</h2>
          <p className="text-app-muted mb-8 max-w-sm">Please verify your administrator PIN to access system settings.</p>
          <button 
            onClick={() => setIsPinModalOpen(true)}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25"
          >
            Enter PIN
          </button>
        </div>
      )}

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-app-surface border border-app-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Add New Admin</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-app-muted hover:text-app-text">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-app-muted mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.name}
                    onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="e.g. Somchai Thai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-muted mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="somchai@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-muted mb-1">6-Digit PIN</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    value={newAdmin.pin}
                    onChange={e => setNewAdmin({...newAdmin, pin: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="123456"
                  />
                  <p className="mt-1 text-xs text-app-muted">This PIN will be required for managing assets.</p>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors mt-4"
                >
                  Create Admin
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={() => setIsAuthorized(true)}
      />
    </div>
  );
}
