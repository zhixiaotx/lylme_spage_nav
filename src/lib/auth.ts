/**
 * Authentication and Multi-Account Isolation Management
 * 
 * Requirements:
 * - Admin Account: 'admin' (default password: '123456', customizable via VITE_EXPORT_ADMIN_PASS / VITE_SYNC_ADMIN_PASS)
 * - Multi-Account Data Isolation:
 *   Each account only has access to its own bookmarks, groups, and sync configs.
 *   Account A cannot read or write Account B's local or cloud data.
 */

export interface RegisteredAccount {
  username: string;
  role: 'admin' | 'user';
  passwordHash: string;
  createdAt: number;
  lastLoginAt?: number;
}

const ACTIVE_ACCOUNT_KEY = 'lylme_active_account';
const ACCOUNTS_REGISTRY_KEY = 'lylme_accounts_registry_v1';
const SYNC_AUTH_SESSION_KEY_PREFIX = 'lylme_sync_auth_session_';
const EXPORT_AUTH_SESSION_KEY_PREFIX = 'lylme_export_auth_session_';

// Simple reversible obfuscation for local credential registry
function hashPassword(pass: string): string {
  try {
    return btoa(encodeURIComponent(`lylme_salt_${pass.trim()}`));
  } catch {
    return pass.trim();
  }
}

function verifyPasswordHash(plainPass: string, storedHash: string): boolean {
  return hashPassword(plainPass) === storedHash;
}

export function getExpectedAdminUser(): string {
  const envUser =
    (import.meta as any)?.env?.VITE_SYNC_ADMIN_USER ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_USER;
  return typeof envUser === 'string' && envUser.trim() ? envUser.trim() : 'admin';
}

export function getExpectedAdminPass(): string {
  const envPass =
    (import.meta as any)?.env?.VITE_SYNC_ADMIN_PASS ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_PASS;
  return typeof envPass === 'string' && envPass.trim() ? envPass.trim() : '123456';
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
 * Load all registered accounts
 */
export function getRegisteredAccounts(): RegisteredAccount[] {
  const adminUser = getExpectedAdminUser();
  const defaultAdmin: RegisteredAccount = {
    username: adminUser,
    role: 'admin',
    passwordHash: hashPassword(getExpectedAdminPass()),
    createdAt: 0,
  };

  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (!raw) {
      return [defaultAdmin];
    }
    const parsed: RegisteredAccount[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [defaultAdmin];

    const hasAdmin = parsed.some((a) => a.username === adminUser);
    if (!hasAdmin) {
      parsed.unshift(defaultAdmin);
    }
    return parsed;
  } catch {
    return [defaultAdmin];
  }
}

function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
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
 * Supports:
 * 1. Default admin account ('admin' / '123456')
 * 2. Existing registered custom accounts
 * 3. Auto-registration for new custom accounts
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
  const adminPass = getExpectedAdminPass();

  // 1. Check built-in / env admin
  if (username === adminUser) {
    if (password === adminPass) {
      setActiveAccount(adminUser);
      setSyncAuthenticated(adminUser);
      setExportAuthenticated(adminUser);
      return { success: true, account: adminUser };
    }
    return { success: false, message: '管理员密码错误，请重新输入' };
  }

  // 2. Check registered accounts
  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.username === username);

  if (existing) {
    if (verifyPasswordHash(password, existing.passwordHash)) {
      existing.lastLoginAt = Date.now();
      saveRegisteredAccounts(accounts);
      setActiveAccount(username);
      setSyncAuthenticated(username);
      setExportAuthenticated(username);
      return { success: true, account: username };
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
  // If baseKey already ends with the account suffix, return as is
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
