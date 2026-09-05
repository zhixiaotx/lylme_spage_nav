/**
 * Export Permission and Security Authentication Module
 * Delegates to centralized auth.ts module
 */

export {
  getExpectedAdminUser,
  getExpectedAdminPass,
  hasCustomEnvCredentials,
  isExportAuthenticated,
  setExportAuthenticated,
  clearExportAuthentication,
  verifyExportCredentials,
  verifyCredentials,
  getActiveAccount,
  setActiveAccount,
  isSyncAuthenticated,
  setSyncAuthenticated,
  clearSyncAuthentication,
  getAccountStorageKey,
  getAccountScopedCloudKey,
  getAccountScopedFilename,
} from './auth';

