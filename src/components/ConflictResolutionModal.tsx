import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, GitMerge, UploadCloud, X, Check, Clock, Layers, Bookmark } from 'lucide-react';
import { AppConfig } from '../types';

export interface ConflictInfo {
  localConfig: AppConfig;
  remoteConfig: AppConfig;
  localUpdatedAt?: number;
  remoteUpdatedAt?: number;
  localGroupCount: number;
  remoteGroupCount: number;
  localBookmarkCount: number;
  remoteBookmarkCount: number;
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictInfo: ConflictInfo | null;
  onResolve: (action: 'merge' | 'overwrite') => Promise<void> | void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflictInfo,
  onResolve,
}) => {
  const [resolvingAction, setResolvingAction] = useState<'merge' | 'overwrite' | null>(null);

  if (!isOpen || !conflictInfo) return null;

  const handleAction = async (action: 'merge' | 'overwrite') => {
    setResolvingAction(action);
    try {
      await onResolve(action);
    } finally {
      setResolvingAction(null);
    }
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '未知时间';
    try {
      const d = new Date(ts);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    } catch {
      return '未知时间';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 text-slate-900 overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5 mb-5">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                检测到云端配置版本冲突
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  多端同步保护
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                云端配置已在其他设备上被更新，当前设备本地也有尚未同步的修改。为保障数据完整无损，请选择处理方式：
              </p>
            </div>
          </div>

          {/* Side-by-side Version Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {/* Local Device Version */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  当前设备（本地）
                </span>
                <span className="text-[11px] text-slate-500">待推送</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Clock size={12} className="text-sky-600 shrink-0" />
                  <span>修改时间: {formatTime(conflictInfo.localUpdatedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-sky-100">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Layers size={11} /> 分类分组:
                  </span>
                  <span className="font-semibold text-slate-900">{conflictInfo.localGroupCount} 个</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Bookmark size={11} /> 书签总数:
                  </span>
                  <span className="font-semibold text-slate-900">{conflictInfo.localBookmarkCount} 个</span>
                </div>
              </div>
            </div>

            {/* Remote Cloud Version */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  云端最新（其他设备）
                </span>
                <span className="text-[11px] text-amber-700 font-medium">已在云端</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Clock size={12} className="text-amber-600 shrink-0" />
                  <span>更新时间: {formatTime(conflictInfo.remoteUpdatedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/60">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Layers size={11} /> 分类分组:
                  </span>
                  <span className="font-semibold text-slate-900">{conflictInfo.remoteGroupCount} 个</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Bookmark size={11} /> 书签总数:
                  </span>
                  <span className="font-semibold text-slate-900">{conflictInfo.remoteBookmarkCount} 个</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3">
            {/* 1. Merge Button (Recommended) */}
            <button
              id="conflict-resolve-merge-btn"
              type="button"
              disabled={resolvingAction !== null}
              onClick={() => handleAction('merge')}
              className="w-full text-left p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 transition-all duration-200 group active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                    <GitMerge size={16} />
                  </div>
                  <span className="font-bold text-sm text-emerald-900">
                    两端增量合并（推荐）
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-300">
                  安全无损·防覆盖
                </span>
              </div>
              <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                优先保留最新时间戳的条目，将两端新增的书签和分类智能合并（自动 URL 排重），合并后立即推送到云端并更新界面，保证任何设备添加的数据都不丢失。
              </p>
            </button>

            {/* 2. Overwrite Button */}
            <button
              id="conflict-resolve-overwrite-btn"
              type="button"
              disabled={resolvingAction !== null}
              onClick={() => handleAction('overwrite')}
              className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all duration-200 group active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                    <UploadCloud size={16} />
                  </div>
                  <span className="font-bold text-sm text-slate-800 group-hover:text-amber-900">
                    以本地配置覆盖云端
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 text-[10px]">
                  全量覆盖
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pl-8 leading-relaxed">
                强制使用当前本地设备的数据完全覆盖云端，云端特有或由其他设备新增的内容将被放弃。
              </p>
            </button>
          </div>

          {/* Footer cancel / postpone button */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {resolvingAction === 'merge' && '正在执行两端合并并同步...'}
              {resolvingAction === 'overwrite' && '正在覆盖云端...'}
              {!resolvingAction && '您也可以稍后在设置面板中手动同步'}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={resolvingAction !== null}
              className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors font-medium"
            >
              暂不同步
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
