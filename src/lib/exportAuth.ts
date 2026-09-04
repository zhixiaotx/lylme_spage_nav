/**
 * Export Permission and Security Authentication Module
 * 
 * Supports credentials via environment variables:
 * - VITE_EXPORT_ADMIN_USER (default: 'admin')
 * - VITE_EXPORT_ADMIN_PASS (default: '123456')
 * 
 * Never displays passwords in plain text on the frontend UI.
 */

const STORAGE_KEY = 'lylme_export_auth_token';

export function getExpectedAdminUser(): string {
  const envUser = (import.meta as any)?.env?.VITE_EXPORT_ADMIN_USER;
  return typeof envUser === 'string' && envUser.trim() ? envUser.trim() : 'admin';
}

export function getExpectedAdminPass(): string {
  const envPass = (import.meta as any)?.env?.VITE_EXPORT_ADMIN_PASS;
  return typeof envPass === 'string' && envPass.trim() ? envPass.trim() : '123456';
}

export function hasCustomEnvCredentials(): boolean {
  return Boolean(
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_USER ||
    (import.meta as any)?.env?.VITE_EXPORT_ADMIN_PASS
  );
}

export function isExportAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'authenticated';
  } catch {
    return false;
  }
}

export function setExportAuthenticated(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, 'authenticated');
  } catch {
    // ignore
  }
}

export function clearExportAuthentication(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function verifyExportCredentials(inputUser: string, inputPass: string): {
  success: boolean;
  message?: string;
} {
  const expectedUser = getExpectedAdminUser();
  const expectedPass = getExpectedAdminPass();

  if (!inputUser.trim() || !inputPass.trim()) {
    return { success: false, message: '请输入管理员账号与密码' };
  }

  if (inputUser.trim() === expectedUser && inputPass === expectedPass) {
    setExportAuthenticated();
    return { success: true };
  }

  return { success: false, message: '账号或安全密码错误，请重新输入' };
}
