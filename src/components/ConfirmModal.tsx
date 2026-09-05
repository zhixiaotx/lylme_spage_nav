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
  onCancel?: () => void;
  onClose?: () => void;
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
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative bg-white border ${
            danger ? 'border-rose-200' : 'border-amber-200'
          } rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-center overflow-hidden text-slate-900`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon Badge */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
              danger
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            {iconType === 'danger' ? (
              <ShieldAlert size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>

          {/* Modal Content */}
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed px-1">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md ${
                danger
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
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
