import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Bookmark,
  HardDrive,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ArrowRightLeft,
  Download,
  Upload,
  UserX,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  RegisteredAccount,
  AccountStats,
  SystemAccountsSummary,
  getRegisteredAccounts,
  getActiveAccount,
  isCurrentUserAdmin,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
  resetUserPassword,
  changePasswordForUser,
  getAccountStats,
  getAllAccountsSummary,
  switchActiveAccount,
  exportAllAccountsAndDataJson,
  importAllAccountsAndDataJson,
  getExpectedAdminUser,
} from '../lib/auth';
import { ConfirmModal } from './ConfirmModal';
import { SyncAuthModal } from './SyncAuthModal';

interface AccountManagerProps {
  onAccountSwitched?: (newAccount: string) => void;
  onCloseParent?: () => void;
}

export function AccountManager({ onAccountSwitched, onCloseParent }: AccountManagerProps) {
  // State for account list & active account
  const [activeAccount, setActiveAccountState] = useState<string>(() => getActiveAccount());
  const [accounts, setAccounts] = useState<RegisteredAccount[]>(() => getRegisteredAccounts());
  const [summary, setSummary] = useState<SystemAccountsSummary>(() => getAllAccountsSummary());
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RegisteredAccount | null>(null);

  // Safety Confirm Modal for deletion
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<string | null>(null);

  // Notification / Feedback alert
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for Create User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newNotes, setNewNotes] = useState('');
  const [newTemplate, setNewTemplate] = useState<'default' | 'empty'>('default');
  const [showNewPassText, setShowNewPassText] = useState(false);

  // Form states for Edit User
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');

  // Form states for Reset Password
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showResetPassText, setShowResetPassText] = useState(false);

  // Form states for Self Password Change
  const [selfOldPass, setSelfOldPass] = useState('');
  const [selfNewPass, setSelfNewPass] = useState('');
  const [selfConfirmPass, setSelfConfirmPass] = useState('');
  const [showSelfPassText, setShowSelfPassText] = useState(false);

  const isAdmin = isCurrentUserAdmin(activeAccount);
  const superAdminName = getExpectedAdminUser();

  const refreshData = () => {
    setActiveAccountState(getActiveAccount());
    setAccounts(getRegisteredAccounts());
    setSummary(getAllAccountsSummary());
  };

  useEffect(() => {
    const handleRegistryUpdated = () => refreshData();
    const handleAccountChanged = () => refreshData();

    window.addEventListener('lylme_accounts_registry_updated', handleRegistryUpdated);
    window.addEventListener('lylme_account_changed', handleAccountChanged);

    return () => {
      window.removeEventListener('lylme_accounts_registry_updated', handleRegistryUpdated);
      window.removeEventListener('lylme_account_changed', handleAccountChanged);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Filtered accounts list with stats
  const accountStatsList: AccountStats[] = useMemo(() => {
    return accounts
      .filter((acc) => {
        if (roleFilter === 'admin' && acc.role !== 'admin') return false;
        if (roleFilter === 'user' && acc.role !== 'user') return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = acc.username.toLowerCase().includes(q);
          const matchNote = acc.notes?.toLowerCase().includes(q);
          return matchName || matchNote;
        }
        return true;
      })
      .map((acc) => getAccountStats(acc.username));
  }, [accounts, roleFilter, searchQuery]);

  // Handle Switch User Sandbox
  const handleSwitchUser = (targetUsername: string) => {
    const res = switchActiveAccount(targetUsername);
    if (res.success) {
      showToast(`已成功切换至账号 [${targetUsername}] 的专属导航空间！`, 'success');
      refreshData();
      if (onAccountSwitched) {
        onAccountSwitched(targetUsername);
      }
    }
  };

  // Handle Create User Submit
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createUserAccount({
      username: newUsername,
      password: newPassword,
      role: newRole,
      notes: newNotes,
      initialDataTemplate: newTemplate,
    });

    if (res.success) {
      showToast(res.message, 'success');
      setShowCreateModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewNotes('');
      setNewRole('user');
      setNewTemplate('default');
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle Edit User Submit
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const res = updateUserAccount(selectedUser.username, {
      role: editRole,
      notes: editNotes,
      status: editStatus,
    });

    if (res.success) {
      showToast(res.message, 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle Reset Password Submit
  const handleResetPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const res = resetUserPassword(selectedUser.username, resetPasswordVal);
    if (res.success) {
      showToast(`账号 [${selectedUser.username}] 的新密码已设置成功！`, 'success');
      setShowResetPassModal(false);
      setResetPasswordVal('');
      setSelectedUser(null);
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle Self Password Change
  const handleSelfPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selfNewPass !== selfConfirmPass) {
      showToast('两次输入的新密码不一致，请核对', 'error');
      return;
    }

    const res = changePasswordForUser(activeAccount, selfOldPass, selfNewPass);
    if (res.success) {
      showToast('个人密码已成功修改！', 'success');
      setShowChangePassModal(false);
      setSelfOldPass('');
      setSelfNewPass('');
      setSelfConfirmPass('');
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle Delete User Confirmation
  const handleDeleteUserConfirm = () => {
    if (!deleteConfirmUser) return;
    const res = deleteUserAccount(deleteConfirmUser, true);
    if (res.success) {
      showToast(res.message, 'success');
      setDeleteConfirmUser(null);
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Export all accounts JSON
  const handleExportAllAccounts = () => {
    try {
      const jsonStr = exportAllAccountsAndDataJson();
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lylme_spage_all_accounts_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('全站多账户数据备份已成功导出！', 'success');
    } catch (err: any) {
      showToast(`导出失败: ${err.message}`, 'error');
    }
  };

  // Import all accounts JSON
  const handleImportAllAccounts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const res = importAllAccountsAndDataJson(content);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
      } else {
        showToast(res.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp || timestamp === 0) return '系统内置';
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div id="account-manager-root" className="space-y-6 text-slate-100 pb-6">
      {/* Toast Feedback Alert */}
      {feedback && (
        <div
          id="account-manager-feedback"
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-sm font-medium border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Banner / Active User Profile Card */}
      <div
        id="active-user-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-white/15 p-5 shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/20 shrink-0 uppercase">
              {activeAccount.slice(0, 2)}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  isAdmin ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                title={isAdmin ? '超级管理员' : '普通用户'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-wide">{activeAccount}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                  {isAdmin ? '超级管理员' : '普通成员'}
                </span>
                {activeAccount === superAdminName && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    内置主账号
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                当前正处于此账号的独立沙箱环境中。所有的书签、分组与多云同步配置均严格物理隔离。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {!isAdmin ? (
              <button
                type="button"
                id="btn-admin-auth"
                onClick={() => setShowAdminAuthModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Shield size={14} />
                <span>验证管理员身份</span>
              </button>
            ) : null}

            <button
              type="button"
              id="btn-change-my-pass"
              onClick={() => setShowChangePassModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <KeyRound size={14} />
              <span>修改当前密码</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">注册用户总数</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {summary.totalAccounts}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({summary.adminCount} 管理员 / {summary.userCount} 普通)
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Bookmark size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">全站书签总量</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {summary.totalBookmarks} <span className="text-xs text-slate-400 font-normal">项</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 shrink-0">
            <FolderOpen size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">分类分组总量</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {summary.totalGroups} <span className="text-xs text-slate-400 font-normal">组</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 shrink-0">
            <HardDrive size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">沙箱存储占用</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {formatBytes(summary.totalStorageBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Section: User Management */}
      <div className="space-y-4">
        {/* Controls Bar: Search, Filter, Create User & Batch Tools */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索账号名、备注..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex bg-slate-900/80 border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  roleFilter === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  roleFilter === 'admin' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                管理员
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('user')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  roleFilter === 'user' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                普通用户
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isAdmin && (
              <>
                <button
                  type="button"
                  id="btn-create-user"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                >
                  <UserPlus size={14} />
                  <span>添加新用户</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAllAccounts}
                  title="备份所有账户数据"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Download size={14} />
                  <span>全站备份</span>
                </button>

                <label
                  title="导入全站备份数据"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload size={14} />
                  <span>全站恢复</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportAllAccounts}
                    className="hidden"
                  />
                </label>
              </>
            )}

            <button
              type="button"
              onClick={refreshData}
              title="刷新数据"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* User Account Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {accountStatsList.map((acc) => {
            const isSelf = acc.username.toLowerCase() === activeAccount.toLowerCase();
            const isBuiltinAdmin = acc.username.toLowerCase() === superAdminName.toLowerCase();
            const isAccAdmin = acc.role === 'admin';

            return (
              <div
                key={acc.username}
                id={`account-card-${acc.username}`}
                className={`relative rounded-2xl p-4 border transition-all ${
                  isSelf
                    ? 'bg-slate-900/90 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/50 hover:bg-slate-900/80 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/15 flex items-center justify-center font-bold text-white text-base uppercase shrink-0">
                      {acc.username.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{acc.username}</span>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                            当前激活
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isAccAdmin
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-white/10'
                          }`}
                        >
                          {isAccAdmin ? '管理员' : '普通用户'}
                        </span>
                        {acc.status === 'disabled' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {acc.notes || '暂无备注说明'}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Quick Switch Button */}
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => handleSwitchUser(acc.username)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 transition-all shrink-0"
                      title={`切换至 ${acc.username} 的导航空间`}
                    >
                      <ArrowRightLeft size={12} />
                      <span>切入沙箱</span>
                    </button>
                  )}
                </div>

                {/* Account Statistics Grid */}
                <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/40 rounded-lg p-2 border border-white/5">
                    <span className="text-slate-400 block text-[11px]">书签数量</span>
                    <span className="font-semibold text-white mt-0.5 block">{acc.bookmarkCount} 项</span>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg p-2 border border-white/5">
                    <span className="text-slate-400 block text-[11px]">分类分组</span>
                    <span className="font-semibold text-white mt-0.5 block">{acc.groupCount} 组</span>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg p-2 border border-white/5">
                    <span className="text-slate-400 block text-[11px]">沙箱体积</span>
                    <span className="font-semibold text-white mt-0.5 block">{formatBytes(acc.dataSizeBytes)}</span>
                  </div>
                </div>

                {/* Footer details & Action Buttons */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span>注册: {formatDate(acc.createdAt)}</span>

                  {/* Actions allowed if user is Admin or modifying self */}
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(accounts.find((a) => a.username === acc.username) || null);
                            setResetPasswordVal('');
                            setShowResetPassModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                          title="重置密码"
                        >
                          <KeyRound size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const found = accounts.find((a) => a.username === acc.username);
                            if (found) {
                              setSelectedUser(found);
                              setEditRole(found.role);
                              setEditNotes(found.notes || '');
                              setEditStatus(found.status || 'active');
                              setShowEditModal(true);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                          title="编辑角色与备注"
                        >
                          <Edit3 size={13} />
                        </button>

                        {!isBuiltinAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(acc.username)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                            title="删除账号"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {accountStatsList.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-slate-900/30 border border-white/10 text-slate-400 text-xs">
            未搜索到匹配的用户账户
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <UserPlus size={18} />
                </div>
                <h4 className="text-base font-bold text-white">添加新用户</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">账号名称 *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="例如: zhangsan, office, family"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">初始登录密码 *</label>
                <div className="relative">
                  <input
                    type={showNewPassText ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 4 位字符"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassText(!showNewPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">角色权限</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="user">普通用户 (独立书签)</option>
                    <option value="admin">管理员 (可管理全站)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">初始书签库</label>
                  <select
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value as 'default' | 'empty')}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="default">继承默认推荐书签</option>
                    <option value="empty">创建空白纯净空间</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">备注说明 (可选)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="例如: 办公室专用电脑 / 家人账号"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  立即创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Edit3 size={18} />
                </div>
                <h4 className="text-base font-bold text-white">编辑用户: {selectedUser.username}</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">角色权限</label>
                <select
                  value={editRole}
                  disabled={selectedUser.username === superAdminName}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs disabled:opacity-50"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">超级管理员</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">账户状态</label>
                <select
                  value={editStatus}
                  disabled={selectedUser.username === superAdminName}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'disabled')}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs disabled:opacity-50"
                >
                  <option value="active">正常启用</option>
                  <option value="disabled">临时禁用 (禁止登录)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">备注说明</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="修改备注说明"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reset Password Modal (Admin to User) */}
      {showResetPassModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <KeyRound size={18} />
                </div>
                <h4 className="text-base font-bold text-white">重置密码: {selectedUser.username}</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPassModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">输入新密码 *</label>
                <div className="relative">
                  <input
                    type={showResetPassText ? 'text' : 'password'}
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="输入该账号的新密码 (至少4位)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassText(!showResetPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showResetPassText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/30"
                >
                  确认重置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Self Password Change Modal */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Lock size={18} />
                </div>
                <h4 className="text-base font-bold text-white">修改个人密码 ({activeAccount})</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSelfPassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">原密码 *</label>
                <input
                  type="password"
                  required
                  value={selfOldPass}
                  onChange={(e) => setSelfOldPass(e.target.value)}
                  placeholder="请输入当前账号的原密码"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">新密码 *</label>
                <div className="relative">
                  <input
                    type={showSelfPassText ? 'text' : 'password'}
                    required
                    value={selfNewPass}
                    onChange={(e) => setSelfNewPass(e.target.value)}
                    placeholder="请输入新密码 (至少4位)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfPassText(!showSelfPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSelfPassText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">确认新密码 *</label>
                <input
                  type="password"
                  required
                  value={selfConfirmPass}
                  onChange={(e) => setSelfConfirmPass(e.target.value)}
                  placeholder="请再次输入新密码"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  确认修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete User Confirmation Safety Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmUser)}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={handleDeleteUserConfirm}
        title="确认删除该用户账号？"
        message={`您确定要彻底删除账号 [${deleteConfirmUser}] 吗？删除后该用户的本地书签与沙箱配置将被全部清除且无法撤销！`}
        confirmText="确认删除"
        cancelText="取消"
        danger
      />

      {/* 6. Admin Authentication Modal (if user wants to unlock Admin mode) */}
      <SyncAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
        initialUsername={superAdminName}
        onSuccess={(authedUser) => {
          setShowAdminAuthModal(false);
          handleSwitchUser(authedUser);
        }}
      />
    </div>
  );
}
