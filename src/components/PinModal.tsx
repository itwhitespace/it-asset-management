"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, AlertCircle } from "lucide-react";
import { validatePin } from "@/utils/admin";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export default function PinModal({ isOpen, onClose, onSuccess, title = "Admin Verification" }: PinModalProps) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(["", "", "", "", "", ""]);
      setError(false);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pinString = pin.join("");
    if (pinString.length === 6) {
      const isValid = await validatePin(pinString);
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        setError(true);
        setPin(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }
    }
  };

  useEffect(() => {
    if (pin.every(digit => digit !== "")) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-app-surface border border-app-border rounded-3xl p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-app-muted hover:text-app-text rounded-full hover:bg-app-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-app-text mb-2">{title}</h3>
              <p className="text-app-muted mb-8 text-center">Please enter your 6-digit PIN to continue</p>

              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex justify-between gap-2 mb-8">
                  {pin.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={`w-12 h-14 bg-app-bg border ${error ? 'border-red-500/50' : 'border-app-border'} rounded-xl text-center text-2xl font-bold text-app-text focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/50' : 'focus:ring-blue-500/50'} transition-all`}
                    />
                  ))}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-red-400 mb-6"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Invalid PIN. Please try again.</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={pin.some(digit => digit === "")}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  Verify PIN
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
