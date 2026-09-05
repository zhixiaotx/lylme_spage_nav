import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Cloud,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import {
  verifyCredentials,
  getActiveAccount,
  getExpectedAdminUser,
  getExpectedAdminPass,
  hasCustomEnvCredentials,
  getRegisteredAccounts,
} from '../lib/auth';

interface SyncAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: string) => void;
  actionTitle?: string;
  initialUsername?: string;
}

export const SyncAuthModal: React.FC<SyncAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = '多云同步操作',
  initialUsername,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const adminUser = getExpectedAdminUser();
  const isCustomEnv = hasCustomEnvCredentials();

  useEffect(() => {
    if (isOpen) {
      const active = initialUsername || getActiveAccount() || adminUser;
      setUsername(active);
      setPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialUsername, adminUser]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = verifyCredentials(username, password, true);
    if (res.success && res.account) {
      const accountName = res.account;
      if (res.isNewAccount) {
        setSuccessMsg(`已成功创建专属账号 [${accountName}] 并激活！`);
      } else {
        setSuccessMsg(`账号 [${accountName}] 认证成功！`);
      }
      setTimeout(() => {
        setPassword('');
        onSuccess(accountName);
        onClose();
      }, 400);
    } else {
      setErrorMsg(res.message || '账号或密码错误');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="sync-auth-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        >
          <motion.div
            id="sync-auth-modal"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">多云同步权限校验</h3>
                  <p className="text-xs text-slate-500">账号数据严格隔离，仅能读写自个的数据</p>
                </div>
              </div>
              <button
                type="button"
                id="sync-auth-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="mt-5 space-y-4">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs"
                >
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  同步账号 (仅能读写自个数据)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    id="sync-auth-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入账号名称"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  安全密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    id="sync-auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入该账号的安全密码"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between text-slate-800 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Lock size={12} className="text-blue-600" />
                    账号隔离与防覆盖规则
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                    单账号独立沙盒
                  </span>
                </div>
                <p className="leading-relaxed">
                  请输入正确的账号与安全密码进行身份认证。首次输入未注册账号将自动创建专属独立空间。各账号的本地配置与云端记录严格物理隔离，互不可见且互不干扰。
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="sync-auth-cancel-btn"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                >
                  取消
                </button>
                <button
                  id="sync-auth-submit-btn"
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <UserCheck size={14} />
                  <span>验证并授权</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
