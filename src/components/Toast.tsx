import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
      <div className={`p-3 rounded-2xl shadow-xl border flex items-center justify-between space-x-2 text-xs font-bold ${
        toast.type === 'success'
          ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700/60 shadow-emerald-950/20'
          : toast.type === 'error'
          ? 'bg-rose-900/95 text-rose-100 border-rose-700/60 shadow-rose-950/20'
          : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20'
      }`}>
        <div className="flex items-center space-x-2 truncate">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
          <span className="truncate">{toast.message}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-300 hover:text-white transition shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
