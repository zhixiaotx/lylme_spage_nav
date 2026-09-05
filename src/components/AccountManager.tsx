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
  CheckSquare,
  Square,
  SlidersHorizontal,
  Layers,
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
  exportSelectedAccountsAndDataJson,
  exportSingleAccountAndDataJson,
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

  // Multi-selection for flexible batch backup
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [showSelectBackupModal, setShowSelectBackupModal] = useState(false);
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

  // Export single account JSON
  const handleExportSingleUser = (username: string) => {
    try {
      const jsonStr = exportSingleAccountAndDataJson(username);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lylme_backup_user_${username}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`用户 [${username}] 的数据备份已成功导出！`, 'success');
    } catch (err: any) {
      showToast(`导出失败: ${err.message}`, 'error');
    }
  };

  // Export selected accounts JSON
  const handleExportSelectedUsers = (usersToExport?: string[]) => {
    const targets = usersToExport && usersToExport.length > 0 ? usersToExport : selectedUsernames;
    if (!targets || targets.length === 0) {
      showToast('请先选择至少一个需要备份的用户！', 'error');
      return;
    }
    try {
      const jsonStr = exportSelectedAccountsAndDataJson(targets);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileSuffix = targets.length === 1 ? `user_${targets[0]}` : `selected_${targets.length}_users`;
      link.download = `lylme_backup_${fileSuffix}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`已成功导出 ${targets.length} 个用户的备份数据！`, 'success');
    } catch (err: any) {
      showToast(`导出失败: ${err.message}`, 'error');
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

  // Toggle user selection
  const toggleSelectUser = (username: string) => {
    setSelectedUsernames((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedUsernames.length === accountStatsList.length && accountStatsList.length > 0) {
      setSelectedUsernames([]);
    } else {
      setSelectedUsernames(accountStatsList.map((a) => a.username));
    }
  };

  const handleClearSelection = () => {
    setSelectedUsernames([]);
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
    <div id="account-manager-root" className="space-y-6 text-slate-900 pb-6">
      {/* Toast Feedback Alert */}
      {feedback && (
        <div
          id="account-manager-feedback"
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-sm font-medium border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Banner / Active User Profile Card */}
      <div
        id="active-user-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50/90 via-slate-50 to-sky-50/90 border border-slate-200 p-5 shadow-xs text-slate-900"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-indigo-600 border border-indigo-500 flex items-center justify-center font-bold text-2xl text-white shadow-sm shrink-0 uppercase">
              {activeAccount.slice(0, 2)}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  isAdmin ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                title={isAdmin ? '超级管理员' : '普通用户'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 tracking-wide">{activeAccount}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    isAdmin
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                  {isAdmin ? '超级管理员' : '普通成员'}
                </span>
                {activeAccount === superAdminName && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    内置主账号
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
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
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Shield size={14} />
                <span>验证管理员身份</span>
              </button>
            ) : null}

            <button
              type="button"
              id="btn-change-my-pass"
              onClick={() => setShowChangePassModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <KeyRound size={14} />
              <span>修改当前密码</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">注册用户总数</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {summary.totalAccounts}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({summary.adminCount} 管理员 / {summary.userCount} 普通)
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <Bookmark size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">全站书签总量</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {summary.totalBookmarks} <span className="text-xs text-slate-500 font-normal">项</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <FolderOpen size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">分类分组总量</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {summary.totalGroups} <span className="text-xs text-slate-500 font-normal">组</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
            <HardDrive size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">沙箱存储占用</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
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
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  roleFilter === 'all' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  roleFilter === 'admin' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                管理员
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('user')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  roleFilter === 'user' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                >
                  <UserPlus size={14} />
                  <span>添加新用户</span>
                </button>

                <button
                  type="button"
                  id="btn-open-backup-center"
                  onClick={() => setShowSelectBackupModal(true)}
                  title="多选用户备份或自定义导出"
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <SlidersHorizontal size={14} className="text-indigo-600" />
                  <span>备份中心</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAllAccounts}
                  title="备份所有账户数据"
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Download size={14} />
                  <span>全站备份</span>
                </button>

                <label
                  title="导入全站备份数据"
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
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

            {!isAdmin && (
              <button
                type="button"
                onClick={() => handleExportSingleUser(activeAccount)}
                title="备份当前账号数据"
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Download size={14} />
                <span>备份我的数据</span>
              </button>
            )}

            <button
              type="button"
              onClick={refreshData}
              title="刷新数据"
              className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-all shadow-2xs"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Selected Users Batch Operations Bar */}
        {selectedUsernames.length > 0 && (
          <div
            id="batch-actions-bar"
            className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                {selectedUsernames.length}
              </span>
              <span className="text-xs font-semibold text-indigo-950">
                已选中 {selectedUsernames.length} 个用户 ({selectedUsernames.join(', ')})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleExportSelectedUsers(selectedUsernames)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download size={13} />
                <span>导出所选用户备份 ({selectedUsernames.length})</span>
              </button>

              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-all"
              >
                {selectedUsernames.length === accountStatsList.length ? '取消全选' : '全选全部'}
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-all"
              >
                清空选择
              </button>
            </div>
          </div>
        )}

        {/* User Account Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {accountStatsList.map((acc) => {
            const isSelf = acc.username.toLowerCase() === activeAccount.toLowerCase();
            const isBuiltinAdmin = acc.username.toLowerCase() === superAdminName.toLowerCase();
            const isAccAdmin = acc.role === 'admin';
            const isSelected = selectedUsernames.includes(acc.username);

            return (
              <div
                key={acc.username}
                id={`account-card-${acc.username}`}
                className={`relative rounded-2xl p-4 border transition-all ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-2 ring-indigo-400/50'
                    : isSelf
                    ? 'bg-indigo-50/40 border-indigo-300 shadow-sm ring-1 ring-indigo-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Checkbox for batch backup selection */}
                    <button
                      type="button"
                      onClick={() => toggleSelectUser(acc.username)}
                      title={isSelected ? '取消勾选' : '勾选此用户进行备份'}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-300 hover:border-indigo-400 text-transparent'
                      }`}
                    >
                      <CheckCircle2 size={13} className={isSelected ? 'block' : 'hidden'} />
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-base uppercase shrink-0">
                      {acc.username.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{acc.username}</span>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            当前激活
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isAccAdmin
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isAccAdmin ? '管理员' : '普通用户'}
                        </span>
                        {acc.status === 'disabled' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                        {acc.notes || '暂无备注说明'}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Quick Switch Button */}
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => handleSwitchUser(acc.username)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                      title={`切换至 ${acc.username} 的导航空间`}
                    >
                      <ArrowRightLeft size={12} />
                      <span>切入沙箱</span>
                    </button>
                  )}
                </div>

                {/* Account Statistics Grid */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">书签数量</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{acc.bookmarkCount} 项</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">分类分组</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{acc.groupCount} 组</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">沙箱体积</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{formatBytes(acc.dataSizeBytes)}</span>
                  </div>
                </div>

                {/* Footer details & Action Buttons */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 gap-2 font-medium">
                  <span>注册: {formatDate(acc.createdAt)}</span>

                  {/* Actions allowed if user is Admin or modifying self */}
                  <div className="flex items-center gap-1.5">
                    {/* Individual Single-User Backup Button */}
                    <button
                      type="button"
                      onClick={() => handleExportSingleUser(acc.username)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-200"
                      title={`单独备份 ${acc.username} 的数据`}
                    >
                      <Download size={13} />
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(accounts.find((a) => a.username === acc.username) || null);
                            setResetPasswordVal('');
                            setShowResetPassModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
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
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                          title="编辑角色与备注"
                        >
                          <Edit3 size={13} />
                        </button>

                        {!isBuiltinAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(acc.username)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-all border border-transparent hover:border-rose-200"
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
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs font-medium">
            未搜索到匹配的用户账户
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <UserPlus size={18} />
                </div>
                <h4 className="text-base font-bold text-slate-900">添加新用户</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">账号名称 *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="例如: zhangsan, office, family"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">初始登录密码 *</label>
                <div className="relative">
                  <input
                    type={showNewPassText ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 4 位字符"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassText(!showNewPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">角色权限</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                  >
                    <option value="user">普通用户 (独立书签)</option>
                    <option value="admin">管理员 (可管理全站)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">初始书签库</label>
                  <select
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value as 'default' | 'empty')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                  >
                    <option value="default">继承默认推荐书签</option>
                    <option value="empty">创建空白纯净空间</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">备注说明 (可选)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="例如: 办公室专用电脑 / 家人账号"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Edit3 size={18} />
                </div>
                <h4 className="text-base font-bold text-slate-900">编辑用户: {selectedUser.username}</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">角色权限</label>
                <select
                  value={editRole}
                  disabled={selectedUser.username === superAdminName}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs disabled:opacity-50"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">超级管理员</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">账户状态</label>
                <select
                  value={editStatus}
                  disabled={selectedUser.username === superAdminName}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'disabled')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs disabled:opacity-50"
                >
                  <option value="active">正常启用</option>
                  <option value="disabled">临时禁用 (禁止登录)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">备注说明</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="修改备注说明"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <KeyRound size={18} />
                </div>
                <h4 className="text-base font-bold text-slate-900">重置密码: {selectedUser.username}</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPassModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">输入新密码 *</label>
                <div className="relative">
                  <input
                    type={showResetPassText ? 'text' : 'password'}
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="输入该账号的新密码 (至少4位)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassText(!showResetPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showResetPassText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Lock size={18} />
                </div>
                <h4 className="text-base font-bold text-slate-900">修改个人密码 ({activeAccount})</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSelfPassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">原密码 *</label>
                <input
                  type="password"
                  required
                  value={selfOldPass}
                  onChange={(e) => setSelfOldPass(e.target.value)}
                  placeholder="请输入当前账号的原密码"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">新密码 *</label>
                <div className="relative">
                  <input
                    type={showSelfPassText ? 'text' : 'password'}
                    required
                    value={selfNewPass}
                    onChange={(e) => setSelfNewPass(e.target.value)}
                    placeholder="请输入新密码 (至少4位)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfPassText(!showSelfPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showSelfPassText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">确认新密码 *</label>
                <input
                  type="password"
                  required
                  value={selfConfirmPass}
                  onChange={(e) => setSelfConfirmPass(e.target.value)}
                  placeholder="请再次输入新密码"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
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
        onCancel={() => setDeleteConfirmUser(null)}
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

      {/* 7. Comprehensive User Backup & Selective Export Modal */}
      {showSelectBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">用户数据备份与导出中心</h4>
                  <p className="text-xs text-slate-500">
                    支持按需备份单个用户、部分勾选用户或全站所有用户的独立沙箱数据
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSelectBackupModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Quick Action Pills & Selection Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">快速勾选:</span>
                <button
                  type="button"
                  onClick={() => setSelectedUsernames(accounts.map((a) => a.username))}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 font-medium transition-all"
                >
                  全选所有
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allUsers = accounts.map((a) => a.username);
                    setSelectedUsernames(allUsers.filter((u) => !selectedUsernames.includes(u)));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-all"
                >
                  反选
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUsernames([])}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-all"
                >
                  清空选择
                </button>
              </div>

              <div className="text-xs font-semibold text-indigo-900 bg-indigo-100/70 px-3 py-1 rounded-full border border-indigo-200">
                已选中 {selectedUsernames.length} / {accounts.length} 个用户
              </div>
            </div>

            {/* Scrollable User Account List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {accountStatsList.map((acc) => {
                const isSelected = selectedUsernames.includes(acc.username);
                const isSelf = acc.username.toLowerCase() === activeAccount.toLowerCase();

                return (
                  <div
                    key={acc.username}
                    onClick={() => toggleSelectUser(acc.username)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        <CheckCircle2 size={13} className={isSelected ? 'block' : 'hidden'} />
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase shrink-0">
                        {acc.username.slice(0, 2)}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{acc.username}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              当前
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              acc.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {acc.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {acc.notes || '无备注'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right text-[11px] text-slate-500 hidden sm:block">
                        <div>
                          <span className="font-semibold text-slate-800">{acc.bookmarkCount}</span> 书签 ·{' '}
                          <span className="font-semibold text-slate-800">{acc.groupCount}</span> 分组
                        </div>
                        <div className="text-[10px] text-slate-400">{formatBytes(acc.dataSizeBytes)}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExportSingleUser(acc.username)}
                        title="立即单独备份此用户"
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 transition-all shadow-2xs"
                      >
                        <Download size={12} />
                        <span className="hidden sm:inline">单户导出</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleExportAllAccounts}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Layers size={14} />
                <span>一键全站备份 (全部用户)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowSelectBackupModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  关闭
                </button>

                <button
                  type="button"
                  disabled={selectedUsernames.length === 0}
                  onClick={() => {
                    handleExportSelectedUsers(selectedUsernames);
                  }}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedUsernames.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Download size={14} />
                  <span>导出所选用户 ({selectedUsernames.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
