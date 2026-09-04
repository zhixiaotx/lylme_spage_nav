import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, Trash2, RotateCcw, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  iconType?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认继续',
  cancelText = '取消返回',
  danger = true,
  iconType = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative bg-slate-900 border ${
            danger ? 'border-rose-500/40' : 'border-amber-500/40'
          } rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center overflow-hidden`}
        >
          {/* Top subtle glow */}
          <div
            className={`absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full blur-2xl pointer-events-none ${
              danger ? 'bg-rose-500/20' : 'bg-amber-500/20'
            }`}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon Badge */}
          <div
            className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border shadow-lg ${
              danger
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            {iconType === 'danger' ? (
              <ShieldAlert size={26} />
            ) : (
              <AlertTriangle size={26} />
            )}
          </div>

          {/* Modal Content */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg ${
                danger
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
              }`}
            >
              {danger ? <Trash2 size={14} /> : <RotateCcw size={14} />}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
