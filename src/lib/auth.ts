/**
 * Authentication and Multi-Account Isolation Management
 * 
 * Requirements:
 * - Admin Account: 'admin' (default password: '123456', customizable via VITE_EXPORT_ADMIN_PASS / VITE_SYNC_ADMIN_PASS or UI)
 * - Multi-Account Data Isolation:
 *   Each account only has access to its own bookmarks, groups, and sync configs.
 *   Account A cannot read or write Account B's local or cloud data.
 * - Full Admin Management:
 *   Admin can view, create, edit, reset passwords, change roles, inspect stats, delete users,
 *   and perform batch backup/restore across all account sandboxes.
 */

export interface RegisteredAccount {
  username: string;
  role: 'admin' | 'user';
  passwordHash: string;
  createdAt: number;
  lastLoginAt?: number;
  notes?: string;
  avatar?: string;
  status?: 'active' | 'disabled';
}

export interface AccountStats {
  username: string;
  role: 'admin' | 'user';
  bookmarkCount: number;
  groupCount: number;
  dataSizeBytes: number;
  lastModified?: number;
  createdAt: number;
  lastLoginAt?: number;
  notes?: string;
  status: 'active' | 'disabled';
}

export interface SystemAccountsSummary {
  totalAccounts: number;
  adminCount: number;
  userCount: number;
  totalBookmarks: number;
  totalGroups: number;
  totalStorageBytes: number;
  activeAccount: string;
  isAdmin: boolean;
}

const ACTIVE_ACCOUNT_KEY = 'lylme_active_account';
const ACCOUNTS_REGISTRY_KEY = 'lylme_accounts_registry_v1';
const ADMIN_CUSTOM_PASS_HASH_KEY = 'lylme_admin_custom_pass_hash';
const SYNC_AUTH_SESSION_KEY_PREFIX = 'lylme_sync_auth_session_';
const EXPORT_AUTH_SESSION_KEY_PREFIX = 'lylme_export_auth_session_';

// Obfuscation for local credential registry
export function hashPassword(pass: string): string {
  try {
    return btoa(encodeURIComponent(`lylme_salt_${pass.trim()}`));
  } catch {
    return pass.trim();
  }
}

export function verifyPasswordHash(plainPass: string, storedHash: string): boolean {
  return hashPassword(plainPass) === storedHash;
}

export function getExpectedAdminUser(): string {
  const envUser =
    (import.meta as any)?.env?.VITE_SYNC_ADMIN_USER ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_USER;
  return typeof envUser === 'string' && envUser.trim() ? envUser.trim() : 'admin';
}

export function getExpectedAdminPass(): string {
  // 1. Check custom override in localStorage first (if updated via Admin UI)
  try {
    const customHash = localStorage.getItem(ADMIN_CUSTOM_PASS_HASH_KEY);
    if (customHash) {
      // If user saved custom pass hash
      return '__CUSTOM_HASH_STORED__';
    }
  } catch {
    // ignore
  }

  // 2. Check environment variable
  const envPass =
    (import.meta as any)?.env?.VITE_SYNC_ADMIN_PASS ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_PASS;
  return typeof envPass === 'string' && envPass.trim() ? envPass.trim() : '123456';
}

export function getAdminPassHash(): string {
  try {
    const customHash = localStorage.getItem(ADMIN_CUSTOM_PASS_HASH_KEY);
    if (customHash) {
      return customHash;
    }
  } catch {
    // ignore
  }
  const envPass =
    (import.meta as any)?.env?.VITE_SYNC_ADMIN_PASS ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_PASS;
  const rawPass = typeof envPass === 'string' && envPass.trim() ? envPass.trim() : '123456';
  return hashPassword(rawPass);
}

export function setCustomAdminPass(newPass: string): void {
  try {
    localStorage.setItem(ADMIN_CUSTOM_PASS_HASH_KEY, hashPassword(newPass));
  } catch {
    // ignore
  }
}

export function hasCustomEnvCredentials(): boolean {
  return Boolean(
    (import.meta as any)?.env?.VITE_SYNC_ADMIN_USER ||
    (import.meta as any)?.env?.VITE_SYNC_ADMIN_PASS ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_USER ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_PASS
  );
}

/**
 * Get the currently active account for data storage & sync scoping
 */
export function getActiveAccount(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // ignore
  }
  return getExpectedAdminUser();
}

/**
 * Set the currently active account
 */
export function setActiveAccount(account: string): void {
  const clean = account.trim() || getExpectedAdminUser();
  try {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, clean);
    window.dispatchEvent(new CustomEvent('lylme_account_changed', { detail: { account: clean } }));
  } catch {
    // ignore
  }
}

/**
 * Check if the active (or specified) user has administrator privileges
 */
export function isCurrentUserAdmin(account?: string): boolean {
  const target = (account || getActiveAccount()).trim();
  const adminUser = getExpectedAdminUser();
  if (target === adminUser) return true;

  const accounts = getRegisteredAccounts();
  const found = accounts.find((a) => a.username.toLowerCase() === target.toLowerCase());
  return found?.role === 'admin';
}

/**
 * Get the role of a specified account
 */
export function getCurrentUserRole(account?: string): 'admin' | 'user' {
  return isCurrentUserAdmin(account) ? 'admin' : 'user';
}

/**
 * Load all registered accounts
 */
export function getRegisteredAccounts(): RegisteredAccount[] {
  const adminUser = getExpectedAdminUser();
  const defaultAdmin: RegisteredAccount = {
    username: adminUser,
    role: 'admin',
    passwordHash: getAdminPassHash(),
    createdAt: 0,
    status: 'active',
    notes: '系统内置超级管理员 (拥有全站管理权限)',
  };

  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (!raw) {
      return [defaultAdmin];
    }
    const parsed: RegisteredAccount[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [defaultAdmin];

    const adminIndex = parsed.findIndex((a) => a.username.toLowerCase() === adminUser.toLowerCase());
    if (adminIndex === -1) {
      parsed.unshift(defaultAdmin);
    } else {
      // Ensure role is admin
      parsed[adminIndex].role = 'admin';
      parsed[adminIndex].passwordHash = getAdminPassHash();
      if (!parsed[adminIndex].status) parsed[adminIndex].status = 'active';
    }
    return parsed;
  } catch {
    return [defaultAdmin];
  }
}

export function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new CustomEvent('lylme_accounts_registry_updated'));
  } catch {
    // ignore
  }
}

/**
 * Check if the active account is authenticated for Cloud Sync
 */
export function isSyncAuthenticated(account?: string): boolean {
  const target = (account || getActiveAccount()).trim();
  try {
    return sessionStorage.getItem(`${SYNC_AUTH_SESSION_KEY_PREFIX}${target}`) === 'authenticated';
  } catch {
    return false;
  }
}

export function setSyncAuthenticated(account?: string): void {
  const target = (account || getActiveAccount()).trim();
  try {
    sessionStorage.setItem(`${SYNC_AUTH_SESSION_KEY_PREFIX}${target}`, 'authenticated');
  } catch {
    // ignore
  }
}

export function clearSyncAuthentication(account?: string): void {
  const target = (account || getActiveAccount()).trim();
  try {
    sessionStorage.removeItem(`${SYNC_AUTH_SESSION_KEY_PREFIX}${target}`);
  } catch {
    // ignore
  }
}

/**
 * Check if the active account is authenticated for Exporting Data
 */
export function isExportAuthenticated(account?: string): boolean {
  const target = (account || getActiveAccount()).trim();
  try {
    return (
      sessionStorage.getItem(`${EXPORT_AUTH_SESSION_KEY_PREFIX}${target}`) === 'authenticated' ||
      isSyncAuthenticated(target)
    );
  } catch {
    return false;
  }
}

export function setExportAuthenticated(account?: string): void {
  const target = (account || getActiveAccount()).trim();
  try {
    sessionStorage.setItem(`${EXPORT_AUTH_SESSION_KEY_PREFIX}${target}`, 'authenticated');
  } catch {
    // ignore
  }
}

export function clearExportAuthentication(account?: string): void {
  const target = (account || getActiveAccount()).trim();
  try {
    sessionStorage.removeItem(`${EXPORT_AUTH_SESSION_KEY_PREFIX}${target}`);
  } catch {
    // ignore
  }
}

/**
 * Verify account credentials and optionally activate/register the account.
 */
export function verifyCredentials(
  inputUser: string,
  inputPass: string,
  autoRegisterIfNew: boolean = true
): {
  success: boolean;
  message?: string;
  account?: string;
  isNewAccount?: boolean;
} {
  const username = inputUser.trim();
  const password = inputPass.trim();

  if (!username || !password) {
    return { success: false, message: '请输入账号名称与密码' };
  }

  const adminUser = getExpectedAdminUser();
  const adminPassHash = getAdminPassHash();

  // 1. Check built-in / env admin
  if (username.toLowerCase() === adminUser.toLowerCase()) {
    if (verifyPasswordHash(password, adminPassHash)) {
      setActiveAccount(adminUser);
      setSyncAuthenticated(adminUser);
      setExportAuthenticated(adminUser);
      return { success: true, account: adminUser };
    }
    return { success: false, message: '管理员密码错误，请重新输入' };
  }

  // 2. Check registered accounts
  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());

  if (existing) {
    if (existing.status === 'disabled') {
      return { success: false, message: '该账号已被管理员禁用，请联系管理员恢复' };
    }
    if (verifyPasswordHash(password, existing.passwordHash)) {
      existing.lastLoginAt = Date.now();
      saveRegisteredAccounts(accounts);
      setActiveAccount(existing.username);
      setSyncAuthenticated(existing.username);
      setExportAuthenticated(existing.username);
      return { success: true, account: existing.username };
    }
    return { success: false, message: '账号密码错误，请重新输入' };
  }

  // 3. New account auto-registration
  if (autoRegisterIfNew) {
    const newAccount: RegisteredAccount = {
      username,
      role: 'user',
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      status: 'active',
    };
    accounts.push(newAccount);
    saveRegisteredAccounts(accounts);
    setActiveAccount(username);
    setSyncAuthenticated(username);
    setExportAuthenticated(username);
    return {
      success: true,
      account: username,
      isNewAccount: true,
      message: `已为您创建独立专属账号 [${username}] 并完成认证！`,
    };
  }

  return { success: false, message: '未找到该账号，请核对账号名' };
}

/**
 * Backward compatibility wrapper for exportAuth
 */
export function verifyExportCredentials(inputUser: string, inputPass: string) {
  return verifyCredentials(inputUser, inputPass, false);
}

/**
 * Derive account-isolated storage key for localStorage
 */
export function getAccountStorageKey(account?: string): string {
  const clean = (account || getActiveAccount()).trim();
  return `lylme_spage_config_v2_${clean}`;
}

/**
 * Derive account-isolated cloud key for Cloudflare KV, D1, /api/sync
 */
export function getAccountScopedCloudKey(baseKey: string = 'cf_navs_config', account?: string): string {
  const clean = (account || getActiveAccount()).trim();
  if (baseKey.endsWith(`_${clean}`)) {
    return baseKey;
  }
  return `${baseKey}_${clean}`;
}

/**
 * Derive account-isolated filename for WebDAV, GitHub Gist, GitHub Repo
 */
export function getAccountScopedFilename(baseFilename: string = 'lylme_spage.json', account?: string): string {
  const clean = (account || getActiveAccount()).trim();
  const ext = baseFilename.includes('.') ? baseFilename.slice(baseFilename.lastIndexOf('.')) : '.json';
  const nameWithoutExt = baseFilename.includes('.')
    ? baseFilename.slice(0, baseFilename.lastIndexOf('.'))
    : baseFilename;

  if (nameWithoutExt.endsWith(`_${clean}`)) {
    return `${nameWithoutExt}${ext}`;
  }
  return `${nameWithoutExt}_${clean}${ext}`;
}

/**
 * Create a new user account (Admin Operation)
 */
export function createUserAccount(params: {
  username: string;
  password: string;
  role?: 'admin' | 'user';
  notes?: string;
  initialDataTemplate?: 'default' | 'empty';
}): { success: boolean; message: string; account?: RegisteredAccount } {
  const username = params.username.trim();
  const password = params.password.trim();
  const role = params.role || 'user';
  const notes = params.notes?.trim() || '';

  if (!username) {
    return { success: false, message: '账号名称不能为空' };
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5-]{2,24}$/.test(username)) {
    return { success: false, message: '账号名称需为 2~24 位字符（支持中英文、数字、下划线及连字符）' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: '密码长度至少需要 4 位字符' };
  }

  const accounts = getRegisteredAccounts();
  if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: `账号 [${username}] 已经存在，请使用其他账号名称` };
  }

  const newAccount: RegisteredAccount = {
    username,
    role,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
    status: 'active',
    notes,
  };

  accounts.push(newAccount);
  saveRegisteredAccounts(accounts);

  // Initialize data if empty is requested
  if (params.initialDataTemplate === 'empty') {
    const emptyConfig = {
      title: `六零导航页 · ${username}`,
      subtitle: `用户 ${username} 的私有导航空间`,
      groups: [],
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(getAccountStorageKey(username), JSON.stringify(emptyConfig));
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    message: `成功创建账号 [${username}] (${role === 'admin' ? '管理员' : '普通用户'})！`,
    account: newAccount,
  };
}

/**
 * Update an existing user account
 */
export function updateUserAccount(
  username: string,
  updates: {
    newPassword?: string;
    role?: 'admin' | 'user';
    notes?: string;
    status?: 'active' | 'disabled';
  }
): { success: boolean; message: string } {
  const cleanUser = username.trim();
  const adminUser = getExpectedAdminUser();

  // If modifying super admin
  if (cleanUser.toLowerCase() === adminUser.toLowerCase()) {
    if (updates.newPassword && updates.newPassword.trim()) {
      setCustomAdminPass(updates.newPassword.trim());
    }
    const accounts = getRegisteredAccounts();
    const adminIdx = accounts.findIndex((a) => a.username.toLowerCase() === adminUser.toLowerCase());
    if (adminIdx !== -1) {
      if (updates.notes !== undefined) accounts[adminIdx].notes = updates.notes;
      saveRegisteredAccounts(accounts);
    }
    return { success: true, message: `超级管理员 [${adminUser}] 配置更新成功！` };
  }

  const accounts = getRegisteredAccounts();
  const found = accounts.find((a) => a.username.toLowerCase() === cleanUser.toLowerCase());
  if (!found) {
    return { success: false, message: `未找到账号 [${cleanUser}]` };
  }

  if (updates.newPassword && updates.newPassword.trim()) {
    if (updates.newPassword.trim().length < 4) {
      return { success: false, message: '新密码长度至少需要 4 位字符' };
    }
    found.passwordHash = hashPassword(updates.newPassword.trim());
  }

  if (updates.role) {
    found.role = updates.role;
  }

  if (updates.notes !== undefined) {
    found.notes = updates.notes;
  }

  if (updates.status) {
    found.status = updates.status;
  }

  saveRegisteredAccounts(accounts);
  return { success: true, message: `账号 [${cleanUser}] 更新成功！` };
}

/**
 * Delete a user account and optionally clear their isolated data
 */
export function deleteUserAccount(
  username: string,
  purgeUserData: boolean = true
): { success: boolean; message: string } {
  const cleanUser = username.trim();
  const adminUser = getExpectedAdminUser();

  if (cleanUser.toLowerCase() === adminUser.toLowerCase()) {
    return { success: false, message: '不能删除系统内置超级管理员账号！' };
  }

  const accounts = getRegisteredAccounts();
  const filtered = accounts.filter((a) => a.username.toLowerCase() !== cleanUser.toLowerCase());

  if (filtered.length === accounts.length) {
    return { success: false, message: `未找到账号 [${cleanUser}]` };
  }

  saveRegisteredAccounts(filtered);

  if (purgeUserData) {
    try {
      localStorage.removeItem(getAccountStorageKey(cleanUser));
      sessionStorage.removeItem(`${SYNC_AUTH_SESSION_KEY_PREFIX}${cleanUser}`);
      sessionStorage.removeItem(`${EXPORT_AUTH_SESSION_KEY_PREFIX}${cleanUser}`);
    } catch {
      // ignore
    }
  }

  // If deleted the active account, switch back to admin
  if (getActiveAccount().toLowerCase() === cleanUser.toLowerCase()) {
    setActiveAccount(adminUser);
  }

  return { success: true, message: `账号 [${cleanUser}] 已成功删除！` };
}

/**
 * Reset password for a user account
 */
export function resetUserPassword(username: string, newPass: string): { success: boolean; message: string } {
  return updateUserAccount(username, { newPassword: newPass });
}

/**
 * Change password for active user
 */
export function changePasswordForUser(
  username: string,
  oldPass: string,
  newPass: string
): { success: boolean; message: string } {
  const check = verifyCredentials(username, oldPass, false);
  if (!check.success) {
    return { success: false, message: '原密码验证失败，请确认后重试' };
  }
  if (!newPass || newPass.trim().length < 4) {
    return { success: false, message: '新密码长度至少需要 4 位字符' };
  }
  return updateUserAccount(username, { newPassword: newPass.trim() });
}

/**
 * Calculate statistical footprint for a specific user
 */
export function getAccountStats(username: string): AccountStats {
  const clean = username.trim();
  const accounts = getRegisteredAccounts();
  const accountInfo = accounts.find((a) => a.username.toLowerCase() === clean.toLowerCase());

  const role = accountInfo?.role || (clean.toLowerCase() === getExpectedAdminUser().toLowerCase() ? 'admin' : 'user');
  const createdAt = accountInfo?.createdAt || 0;
  const lastLoginAt = accountInfo?.lastLoginAt;
  const notes = accountInfo?.notes;
  const status = accountInfo?.status || 'active';

  const storageKey = getAccountStorageKey(clean);
  let bookmarkCount = 0;
  let groupCount = 0;
  let dataSizeBytes = 0;
  let lastModified: number | undefined;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      dataSizeBytes = new Blob([raw]).size;
      const parsed = JSON.parse(raw);
      lastModified = parsed?.updatedAt;
      if (parsed && Array.isArray(parsed.groups)) {
        groupCount = parsed.groups.length;
        for (const group of parsed.groups) {
          if (Array.isArray(group.items)) {
            bookmarkCount += group.items.length;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    username: clean,
    role,
    bookmarkCount,
    groupCount,
    dataSizeBytes,
    lastModified,
    createdAt,
    lastLoginAt,
    notes,
    status,
  };
}

/**
 * Summarize all accounts across the whole system
 */
export function getAllAccountsSummary(): SystemAccountsSummary {
  const accounts = getRegisteredAccounts();
  let totalBookmarks = 0;
  let totalGroups = 0;
  let totalStorageBytes = 0;
  let adminCount = 0;
  let userCount = 0;

  for (const acc of accounts) {
    if (acc.role === 'admin') adminCount++;
    else userCount++;

    const stats = getAccountStats(acc.username);
    totalBookmarks += stats.bookmarkCount;
    totalGroups += stats.groupCount;
    totalStorageBytes += stats.dataSizeBytes;
  }

  const active = getActiveAccount();

  return {
    totalAccounts: accounts.length,
    adminCount,
    userCount,
    totalBookmarks,
    totalGroups,
    totalStorageBytes,
    activeAccount: active,
    isAdmin: isCurrentUserAdmin(active),
  };
}

/**
 * Switch active account to a target user sandbox
 */
export function switchActiveAccount(targetAccount: string): { success: boolean; account: string } {
  const clean = targetAccount.trim();
  setActiveAccount(clean);
  // Auto authenticate session for smoother UX
  setSyncAuthenticated(clean);
  setExportAuthenticated(clean);
  return { success: true, account: clean };
}

/**
 * Export selected registered accounts and their sandboxed configuration data into a JSON backup
 */
export function exportSelectedAccountsAndDataJson(usernames?: string[]): string {
  const allAccounts = getRegisteredAccounts();
  const targetAccounts = usernames && usernames.length > 0
    ? allAccounts.filter((a) => usernames.some((u) => u.toLowerCase() === a.username.toLowerCase()))
    : allAccounts;

  const exportPayload: {
    meta: {
      version: string;
      exportTime: number;
      accountCount: number;
      exportedUsers: string[];
    };
    accounts: RegisteredAccount[];
    sandboxes: Record<string, any>;
  } = {
    meta: {
      version: '2.0.0',
      exportTime: Date.now(),
      accountCount: targetAccounts.length,
      exportedUsers: targetAccounts.map((a) => a.username),
    },
    accounts: targetAccounts,
    sandboxes: {},
  };

  for (const acc of targetAccounts) {
    const key = getAccountStorageKey(acc.username);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        exportPayload.sandboxes[acc.username] = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Export a single account and its sandboxed configuration data into a JSON backup
 */
export function exportSingleAccountAndDataJson(username: string): string {
  return exportSelectedAccountsAndDataJson([username]);
}

/**
 * Export all registered accounts and their sandboxed configuration data into a single JSON backup
 */
export function exportAllAccountsAndDataJson(): string {
  return exportSelectedAccountsAndDataJson();
}

/**
 * Import multi-account backup JSON into local storage
 */
export function importAllAccountsAndDataJson(jsonString: string): {
  success: boolean;
  importedAccounts: number;
  message: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.accounts)) {
      return { success: false, importedAccounts: 0, message: '无效的多账户备份文件格式' };
    }

    const currentAccounts = getRegisteredAccounts();
    const accountMap = new Map<string, RegisteredAccount>();
    for (const a of currentAccounts) {
      accountMap.set(a.username.toLowerCase(), a);
    }

    let importedCount = 0;

    for (const item of parsed.accounts) {
      if (!item.username) continue;
      accountMap.set(item.username.toLowerCase(), {
        username: item.username,
        role: item.role === 'admin' ? 'admin' : 'user',
        passwordHash: item.passwordHash || hashPassword('123456'),
        createdAt: item.createdAt || Date.now(),
        lastLoginAt: item.lastLoginAt,
        notes: item.notes,
        status: item.status || 'active',
      });
      importedCount++;
    }

    saveRegisteredAccounts(Array.from(accountMap.values()));

    // Restore sandbox data if present
    if (parsed.sandboxes && typeof parsed.sandboxes === 'object') {
      for (const [user, data] of Object.entries(parsed.sandboxes)) {
        try {
          localStorage.setItem(getAccountStorageKey(user), JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    }

    return {
      success: true,
      importedAccounts: importedCount,
      message: `成功导入 ${importedCount} 个用户账户及对应书签数据！`,
    };
  } catch (err: any) {
    return { success: false, importedAccounts: 0, message: `解析备份文件失败: ${err.message}` };
  }
}

