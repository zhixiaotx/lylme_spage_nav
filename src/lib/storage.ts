import { AppConfig, SyncProvider } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import {
  downloadNetscapeBookmarksHtml,
  parseNetscapeBookmarksHtml,
  mergeGroupsIncrementally,
  stripHtmlTags,
} from './bookmarkParser';

/**
 * Sanitize all group names and item names/descriptions to remove any raw HTML tags (e.g. <span>, <input>)
 */
export const sanitizeGroups = (groups: any[]): any[] => {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => {
    const groupName = stripHtmlTags(g.name || g.title || g.category || '未命名分类');
    const itemsList = Array.isArray(g.items) ? g.items : Array.isArray(g.links) ? g.links : [];

    return {
      ...g,
      name: groupName,
      items: itemsList.map((it: any) => {
        const rawName = it.name || it.title || it.label || it.url || '未命名书签';
        const rawUrl = it.url || it.link || it.href || '';
        const rawDesc =
          it.description ??
          it.desc ??
          it.remark ??
          it.subtitle ??
          it.sub_title ??
          it.comment ??
          it.notes;

        return {
          ...it,
          name: stripHtmlTags(rawName),
          url: rawUrl,
          description: rawDesc ? stripHtmlTags(String(rawDesc)) : undefined,
        };
      }),
    };
  });
};

const STORAGE_KEY = 'lylme_spage_config_v2';

export interface SyncResult {
  success: boolean;
  message: string;
  config?: AppConfig;
}

/**
 * Load configuration from LocalStorage
 */
export const loadConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Check legacy key
      const legacy = localStorage.getItem('lylme_spage_config');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return mergeWithDefaults(parsed);
      }
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(stored);
    return mergeWithDefaults(parsed);
  } catch (error) {
    console.error('Failed to load local config, using defaults:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * Save configuration to LocalStorage
 */
export const saveConfig = (config: AppConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save to local storage:', error);
  }
};

/**
 * Merge partial or legacy stored configuration safely with default properties
 */
export const mergeWithDefaults = (stored: Partial<AppConfig>): AppConfig => {
  // Ensure 'LyLme Spage' in stored strings is migrated to 'LyLme Spage Nav'
  let title = stored.title || DEFAULT_CONFIG.title;
  if (title === '六零导航页') {
    title = DEFAULT_CONFIG.title;
  } else if (title.includes('LyLme Spage')) {
    title = title.replace(/LyLme Spage(?! Nav)/g, 'LyLme Spage Nav');
  }

  let subtitle = stored.subtitle || DEFAULT_CONFIG.subtitle;
  if (subtitle && subtitle.includes('LyLme Spage')) {
    subtitle = subtitle.replace(/LyLme Spage(?! Nav)/g, 'LyLme Spage Nav');
  }

  let description = stored.description || DEFAULT_CONFIG.description;
  if (description && description.includes('LyLme Spage')) {
    description = description.replace(/LyLme Spage(?! Nav)/g, 'LyLme Spage Nav');
  }

  // Merge search engines to include new built-in engines while preserving user custom engines
  let mergedEngines = DEFAULT_CONFIG.searchEngines;
  if (stored.searchEngines && stored.searchEngines.length > 0) {
    const existingKeys = new Set<string>();
    stored.searchEngines.forEach((e) => {
      if (e.id) existingKeys.add(e.id);
      if (e.value) existingKeys.add(e.value);
    });
    // Add any newly provided default search engines
    const missingDefaults = DEFAULT_CONFIG.searchEngines.filter(
      (d) => !existingKeys.has(d.id) && (!d.value || !existingKeys.has(d.value))
    );
    mergedEngines = [...stored.searchEngines, ...missingDefaults];
  }

  return {
    ...DEFAULT_CONFIG,
    ...stored,
    title,
    subtitle,
    description,
    version: DEFAULT_CONFIG.version,
    icp: stored.icp !== undefined ? stored.icp : (DEFAULT_CONFIG.icp || ''),
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...(stored.theme || {}),
    },
    sync: {
      ...DEFAULT_CONFIG.sync,
      ...(stored.sync || {}),
      gist: { ...DEFAULT_CONFIG.sync.gist, ...(stored.sync?.gist || {}) },
      githubRepo: { ...DEFAULT_CONFIG.sync.githubRepo, ...(stored.sync?.githubRepo || {}) },
      webdav: { ...DEFAULT_CONFIG.sync.webdav, ...(stored.sync?.webdav || {}) },
      cfKv: { ...DEFAULT_CONFIG.sync.cfKv, ...(stored.sync?.cfKv || {}) },
      cfD1: { ...DEFAULT_CONFIG.sync.cfD1, ...(stored.sync?.cfD1 || {}) },
      customApi: { ...DEFAULT_CONFIG.sync.customApi, ...(stored.sync?.customApi || {}) },
    },
    searchEngines: mergedEngines,
    groups: stored.groups && stored.groups.length > 0 ? sanitizeGroups(stored.groups) : DEFAULT_CONFIG.groups,
  };
};

/**
 * Detect if a config's groups are completely unmodified default template groups.
 */
export const isUntouchedDefaultGroups = (groups?: any[]): boolean => {
  if (!groups || groups.length === 0) return true;
  if (groups.length !== DEFAULT_CONFIG.groups.length) return false;
  return groups.every((g, idx) => {
    const def = DEFAULT_CONFIG.groups[idx];
    if (!def || g.id !== def.id || g.items?.length !== def.items.length) return false;
    return g.items.every((it: any, itIdx: number) => it.url === def.items[itIdx]?.url);
  });
};

/**
 * Smart merge local and remote configurations during cloud sync to prevent multi-device data loss.
 * Combines groups/bookmarks incrementally (union without overwriting/deleting unique items from either device).
 */
export const smartMergeConfigs = (local: AppConfig, remote: any): AppConfig => {
  const remoteParsed = mergeWithDefaults(remote);

  // 1. Smart merge bookmark groups and items incrementally
  // If local groups are untouched default and remote has groups, adopt remote directly so a fresh device doesn't resurrect deleted default groups.
  // Otherwise, perform a lossless union merge preserving all unique items from both devices.
  const isFreshLocal = isUntouchedDefaultGroups(local.groups);
  const hasRemoteGroups = Array.isArray(remoteParsed.groups) && remoteParsed.groups.length > 0;

  const mergedGroups = isFreshLocal && hasRemoteGroups
    ? remoteParsed.groups
    : mergeGroupsIncrementally(local.groups, remoteParsed.groups || []).mergedGroups;

  // 2. Merge search engines
  const existingEngineIds = new Set(local.searchEngines.map((e) => e.id || e.value));
  const newEngines = (remoteParsed.searchEngines || []).filter((e: any) => !existingEngineIds.has(e.id || e.value));
  const mergedEngines = [...local.searchEngines, ...newEngines];

  return {
    ...remoteParsed,
    ...local, // Retain local settings/credentials (tokens, API keys, etc.)
    searchEngines: mergedEngines,
    groups: mergedGroups,
    theme: {
      ...remoteParsed.theme,
      ...(local.theme || {}),
    },
    title: remoteParsed.title !== DEFAULT_CONFIG.title ? remoteParsed.title : local.title,
    subtitle: remoteParsed.subtitle || local.subtitle,
    description: remoteParsed.description || local.description,
    icp: remoteParsed.icp || local.icp,
    sync: {
      ...local.sync,
      ...(remoteParsed.sync || {}),
      provider: local.sync.provider,
      gist: local.sync.gist,
      githubRepo: local.sync.githubRepo,
      webdav: local.sync.webdav,
      cfKv: local.sync.cfKv,
      cfD1: local.sync.cfD1,
      customApi: local.sync.customApi,
      lastSyncedAt: Date.now(),
      lastStatus: 'success',
      lastMessage: '云端多端同步智能合并成功（防丢失）',
    },
  };
};

/* =========================================================================
   1. GitHub Gist Synchronization
   ========================================================================= */

export const pullFromGist = async (config: AppConfig): Promise<SyncResult> => {
  const { token, gistId, filename = 'lylme_spage.json' } = config.sync.gist;
  if (!token || !gistId) {
    return { success: false, message: '请配置 GitHub Token 与 Gist ID' };
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return { success: false, message: `拉取 Gist 失败: HTTP ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    const file = data.files[filename] || data.files[Object.keys(data.files)[0]];

    if (!file || !file.content) {
      return { success: false, message: `Gist 中未找到配置文件 (${filename})` };
    }

    const remoteConfig = JSON.parse(file.content);
    const merged = smartMergeConfigs(config, remoteConfig);

    saveConfig(merged);
    return { success: true, message: '从 GitHub Gist 智能合并同步成功', config: merged };
  } catch (error: any) {
    return { success: false, message: `Gist 拉取异常: ${error.message || error}` };
  }
};

export const pushToGist = async (config: AppConfig): Promise<SyncResult> => {
  const { token, gistId, filename = 'lylme_spage.json' } = config.sync.gist;
  if (!token || !gistId) {
    return { success: false, message: '请配置 GitHub Token 与 Gist ID' };
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `LyLme Spage Nav Config Backup (Updated: ${new Date().toLocaleString()})`,
        files: {
          [filename]: {
            content: JSON.stringify(config, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      return { success: false, message: `推送到 Gist 失败: HTTP ${response.status} ${response.statusText}` };
    }

    return { success: true, message: '成功推送至 GitHub Gist' };
  } catch (error: any) {
    return { success: false, message: `Gist 推送异常: ${error.message || error}` };
  }
};

export const createNewGist = async (token: string, initialConfig: AppConfig): Promise<{ success: boolean; gistId?: string; message: string }> => {
  if (!token) return { success: false, message: '请输入 GitHub Personal Access Token' };

  try {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: '六零导航页 LyLme Spage Nav 云端同步配置',
        public: false,
        files: {
          'lylme_spage.json': {
            content: JSON.stringify(initialConfig, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      return { success: false, message: `创建 Gist 失败: HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, gistId: data.id, message: 'Gist 创建成功并已绑定！' };
  } catch (err: any) {
    return { success: false, message: `创建 Gist 失败: ${err.message || err}` };
  }
};

/* =========================================================================
   1.5 GitHub Independent Repository File Synchronization
   ========================================================================= */

const utf8ToBase64 = (str: string): string => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const base64ToUtf8 = (str: string): string => {
  return decodeURIComponent(escape(window.atob(str.replace(/\s/g, ''))));
};

export const pullFromGithubRepo = async (config: AppConfig): Promise<SyncResult> => {
  const { token, owner, repo, branch = 'main', path = 'data/lylme_spage.json' } = config.sync.githubRepo;
  if (!token || !owner || !repo) {
    return { success: false, message: '请配置 GitHub Token、仓库所有者与仓库名称' };
  }

  const cleanPath = path.replace(/^\/+/, '');
  const cleanBranch = branch.trim() || 'main';

  try {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(cleanBranch)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 404) {
      return {
        success: false,
        message: `仓库 ${owner}/${repo} 的分支 [${cleanBranch}] 中未找到文件 (${cleanPath})。请先点击【保存并推送到云端】初始化此文件。`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `拉取 GitHub 仓库失败: HTTP ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (!data.content) {
      return { success: false, message: `GitHub 仓库文件内容为空 (${cleanPath})` };
    }

    const decodedContent = base64ToUtf8(data.content);
    const remoteConfig = JSON.parse(decodedContent);
    const merged = smartMergeConfigs(config, remoteConfig);
    
    // Update local state with latest sha
    merged.sync = {
      ...merged.sync,
      githubRepo: {
        ...config.sync.githubRepo,
        sha: data.sha,
      },
      lastSyncedAt: Date.now(),
      lastStatus: 'success',
      lastMessage: `从 GitHub 仓库 ${owner}/${repo} 智能同步成功`,
    };

    saveConfig(merged);
    return {
      success: true,
      message: `从 GitHub 独立仓库 (${owner}/${repo}/${cleanPath}) 智能合并同步成功`,
      config: merged,
    };
  } catch (error: any) {
    return { success: false, message: `GitHub 仓库拉取异常: ${error.message || error}` };
  }
};

export const pushToGithubRepo = async (config: AppConfig): Promise<SyncResult> => {
  const { token, owner, repo, branch = 'main', path = 'data/lylme_spage.json', sha } = config.sync.githubRepo;
  if (!token || !owner || !repo) {
    return { success: false, message: '请配置 GitHub Token、仓库所有者与仓库名称' };
  }

  const cleanPath = path.replace(/^\/+/, '');
  const cleanBranch = branch.trim() || 'main';

  try {
    // 1. Fetch latest SHA to prevent conflict
    let currentSha = sha;
    try {
      const getUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(cleanBranch)}`;
      const getRes = await fetch(getUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        if (getData.sha) {
          currentSha = getData.sha;
        }
      }
    } catch {
      // Ignored: file may not exist yet
    }

    // 2. Put file to repo
    const jsonString = JSON.stringify(config, null, 2);
    const base64Content = utf8ToBase64(jsonString);
    const putUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}`;

    const bodyPayload: Record<string, any> = {
      message: `Update LyLme Spage Nav navigation config [sync at ${new Date().toLocaleString()}]`,
      content: base64Content,
      branch: cleanBranch,
    };
    if (currentSha) {
      bodyPayload.sha = currentSha;
    }

    const response = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `推送到 GitHub 仓库失败 (HTTP ${response.status}): ${errData.message || response.statusText}`,
      };
    }

    const resData = await response.json();
    const newSha = resData.content?.sha;

    return {
      success: true,
      message: `已成功保存并推送到 GitHub 独立仓库 (${owner}/${repo}/${cleanPath})！`,
    };
  } catch (error: any) {
    return { success: false, message: `GitHub 仓库推送异常: ${error.message || error}` };
  }
};

/* =========================================================================
   1.6 坚果云 / 自建 WebDAV 协议同步 (WebDAV Sync)
   ========================================================================= */

export const pullFromWebdav = async (config: AppConfig): Promise<SyncResult> => {
  const { url, username, password, filename = 'lylme_spage.json' } = config.sync.webdav;
  if (!url || !username || !password) {
    return { success: false, message: '请配置 WebDAV 服务器地址、用户名与应用密码' };
  }

  const cleanBaseUrl = url.replace(/\/+$/, '');
  const cleanFilename = (filename || 'lylme_spage.json').replace(/^\/+/, '');
  const targetUrl = `${cleanBaseUrl}/${cleanFilename}`;

  try {
    const authHeader = `Basic ${window.btoa(`${username}:${password}`)}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (response.status === 404) {
      return {
        success: false,
        message: `WebDAV 目录中未找到配置文件 (${cleanFilename})。请先点击【保存并推送到云端】初始化。`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `WebDAV 拉取失败: HTTP ${response.status} ${response.statusText}`,
      };
    }

    const content = await response.text();
    if (!content || !content.trim()) {
      return { success: false, message: `WebDAV 文件为空 (${cleanFilename})` };
    }

    const remoteConfig = JSON.parse(content);
    const merged = smartMergeConfigs(config, remoteConfig);

    saveConfig(merged);
    return {
      success: true,
      message: `从 WebDAV 服务器 (${cleanFilename}) 智能合并同步成功`,
      config: merged,
    };
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'WebDAV 请求被浏览器 CORS 策略拦截。若使用自建 WebDAV (如 Nginx/Apache/Alist)，请在服务端配置 Access-Control-Allow-Origin: *；若使用坚果云等第三方，建议使用 GitHub 仓库/Gist 或 Cloudflare 边缘端。',
      };
    }
    return { success: false, message: `WebDAV 同步异常: ${error.message || error}` };
  }
};

export const pushToWebdav = async (config: AppConfig): Promise<SyncResult> => {
  const { url, username, password, filename = 'lylme_spage.json' } = config.sync.webdav;
  if (!url || !username || !password) {
    return { success: false, message: '请配置 WebDAV 服务器地址、用户名与应用密码' };
  }

  const cleanBaseUrl = url.replace(/\/+$/, '');
  const cleanFilename = (filename || 'lylme_spage.json').replace(/^\/+/, '');
  const targetUrl = `${cleanBaseUrl}/${cleanFilename}`;

  try {
    const authHeader = `Basic ${window.btoa(`${username}:${password}`)}`;
    const jsonString = JSON.stringify(config, null, 2);

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: jsonString,
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      return {
        success: true,
        message: `已成功保存并同步至 WebDAV 服务器 (${cleanFilename})！`,
      };
    }

    return {
      success: false,
      message: `WebDAV 写入失败: HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'WebDAV 保存被浏览器跨域(CORS)策略拦截。请检查服务端 WebDAV CORS 头配置，或使用 GitHub 仓库/Gist/Cloudflare 边缘同步。',
      };
    }
    return { success: false, message: `WebDAV 推送异常: ${error.message || error}` };
  }
};

/* =========================================================================
   2. Cloudflare KV Synchronization
   ========================================================================= */

export const pullFromCfKv = async (config: AppConfig): Promise<SyncResult> => {
  const { accountId, namespaceId, apiToken, keyName = 'cf_navs_config', workerProxyUrl } = config.sync.cfKv;

  // 1. 优先尝试 Cloudflare Pages 内置边缘接口 (/api/sync) - 100% 绕过 CORS，免凭证绑定 (参考 CF-Navs)
  try {
    const edgeUrl = `/api/sync?key=${encodeURIComponent(keyName)}`;
    const edgeRes = await fetch(edgeUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (edgeRes.ok) {
      const content = await edgeRes.text();
      if (content && content.trim()) {
        const remoteConfig = JSON.parse(content);
        const merged = smartMergeConfigs(config, remoteConfig);
        saveConfig(merged);
        return { success: true, message: '通过 Cloudflare 边缘接口 (/api/sync) 智能合并同步成功 (免 CORS)', config: merged };
      }
    }
  } catch {
    // Edge API unavailable or not running on Cloudflare Pages, fallback to direct/worker
  }

  // 2. 备用方式：Worker 反向代理或直接调用 API
  try {
    let response: Response;

    if (workerProxyUrl) {
      const url = new URL(workerProxyUrl, window.location.href);
      url.searchParams.set('key', keyName);
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } else {
      if (!accountId || !namespaceId || !apiToken) {
        return {
          success: false,
          message: '未能在边缘端检测到 ONENAV_KV 绑定。若部署在 Cloudflare Pages，请在 Settings -> Functions 中绑定 KV (变量名设为 ONENAV_KV)；或在下方填写完整 Account ID 和 Token。',
        };
      }
      const directUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(keyName)}`;
      response = await fetch(directUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
    }

    if (response.status === 404) {
      return { success: false, message: 'Cloudflare KV 中尚未存储此配置，请先点击“推送到云端”' };
    }

    if (!response.ok) {
      return { success: false, message: `Cloudflare KV 获取失败: HTTP ${response.status} ${response.statusText}` };
    }

    const content = await response.text();
    if (!content) return { success: false, message: 'Cloudflare KV 键值为空' };

    const remoteConfig = JSON.parse(content);
    const merged = smartMergeConfigs(config, remoteConfig);

    saveConfig(merged);
    return { success: true, message: '从 Cloudflare KV 智能合并同步成功', config: merged };
  } catch (error: any) {
    return { success: false, message: `Cloudflare KV 拉取错误: ${error.message || error}` };
  }
};

export const pushToCfKv = async (config: AppConfig): Promise<SyncResult> => {
  const { accountId, namespaceId, apiToken, keyName = 'cf_navs_config', workerProxyUrl } = config.sync.cfKv;
  const jsonString = JSON.stringify(config, null, 2);

  // 1. 优先尝试 Cloudflare Pages 内置边缘接口 (/api/sync) - 100% 绕过 CORS，免凭证绑定 (参考 CF-Navs)
  try {
    const edgeUrl = `/api/sync?key=${encodeURIComponent(keyName)}`;
    const edgeRes = await fetch(edgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: jsonString,
    });

    if (edgeRes.ok) {
      const resJson = await edgeRes.json().catch(() => ({}));
      return {
        success: true,
        message: resJson.message || '已成功通过 Cloudflare Pages 边缘后端 (/api/sync) 保存',
      };
    }
  } catch {
    // Edge API unavailable, fallback
  }

  // 2. 备用方式：Worker 反代或直接 API
  try {
    let response: Response;

    if (workerProxyUrl) {
      const url = new URL(workerProxyUrl, window.location.href);
      url.searchParams.set('key', keyName);
      response = await fetch(url.toString(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString,
      });
    } else {
      if (!accountId || !namespaceId || !apiToken) {
        return {
          success: false,
          message: '未能在边缘端检测到 ONENAV_KV 绑定。若部署在 Cloudflare Pages，请在 Settings -> Functions 中绑定 KV (变量名设为 ONENAV_KV)；或在下方填写凭证。',
        };
      }
      const directUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(keyName)}`;
      response = await fetch(directUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: jsonString,
      });
    }

    if (!response.ok) {
      return { success: false, message: `保存到 Cloudflare KV 失败: HTTP ${response.status}` };
    }

    return { success: true, message: '配置已成功保存至 Cloudflare KV' };
  } catch (error: any) {
    return { success: false, message: `保存到 Cloudflare KV 失败: ${error.message || error}` };
  }
};

/* =========================================================================
   3. Cloudflare D1 Synchronization
   ========================================================================= */

export const initCfD1Table = async (config: AppConfig): Promise<SyncResult> => {
  const { accountId, databaseId, apiToken, tableName = 'cf_navs_config', workerProxyUrl } = config.sync.cfD1;
  const initSql = `CREATE TABLE IF NOT EXISTS ${tableName} (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER);`;

  // 1. 优先尝试边缘端 /api/sync
  try {
    const edgeRes = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init', sql: initSql }),
    });
    if (edgeRes.ok) {
      return { success: true, message: '已通过 Cloudflare Pages 边缘后端成功初始化 D1 数据表！' };
    }
  } catch {
    // fallback
  }

  // 2. 备用方式
  try {
    if (workerProxyUrl) {
      const res = await fetch(workerProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', sql: initSql }),
      });
      return { success: res.ok, message: res.ok ? 'D1 数据表初始化成功' : 'D1 数据表初始化失败' };
    }

    if (!accountId || !databaseId || !apiToken) {
      return {
        success: false,
        message: '未检测到 ONENAV_D1 绑定。若部署在 Cloudflare Pages，请在 Settings -> Functions 中绑定 D1 数据库 (变量名设为 ONENAV_D1)。',
      };
    }

    const directUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const response = await fetch(directUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: initSql }),
    });

    const result = await response.json();
    if (!result.success) {
      return { success: false, message: `D1 初始化表失败: ${result.errors?.[0]?.message || '未知错误'}` };
    }

    return { success: true, message: `D1 表 [${tableName}] 检查与初始化成功！` };
  } catch (err: any) {
    return { success: false, message: `D1 初始化异常: ${err.message || err}` };
  }
};

export const pullFromCfD1 = async (config: AppConfig): Promise<SyncResult> => {
  const { accountId, databaseId, apiToken, tableName = 'cf_navs_config', workerProxyUrl } = config.sync.cfD1;

  // 1. 优先尝试边缘端 /api/sync
  try {
    const edgeRes = await fetch('/api/sync?key=cf_navs_config');
    if (edgeRes.ok) {
      const content = await edgeRes.text();
      if (content && content.trim()) {
        const remoteConfig = JSON.parse(content);
        const merged = smartMergeConfigs(config, remoteConfig);
        saveConfig(merged);
        return { success: true, message: '成功从 Cloudflare D1 边缘接口智能合并同步最新配置', config: merged };
      }
    }
  } catch {
    // fallback
  }

  // 2. 备用方式
  try {
    const querySql = `SELECT value, updated_at FROM ${tableName} WHERE key = 'cf_navs_config' OR key = 'spage_master_config' LIMIT 1;`;
    let data: any;

    if (workerProxyUrl) {
      const response = await fetch(workerProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', sql: querySql }),
      });
      if (!response.ok) return { success: false, message: `D1 查询失败: HTTP ${response.status}` };
      data = await response.json();
    } else {
      if (!accountId || !databaseId || !apiToken) {
        return {
          success: false,
          message: '未检测到 ONENAV_D1 绑定。若部署在 Cloudflare Pages，请在 Settings -> Functions 中绑定 D1 (变量名设为 ONENAV_D1)；或在下方填写凭证。',
        };
      }
      const directUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
      const response = await fetch(directUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: querySql }),
      });

      const resJson = await response.json();
      if (!resJson.success) {
        return { success: false, message: `Cloudflare D1 查询错误: ${resJson.errors?.[0]?.message || '查询失败'}` };
      }
      data = resJson.result?.[0]?.results;
    }

    const row = Array.isArray(data) ? data[0] : (data?.results?.[0] || data?.results);
    if (!row || !row.value) {
      return { success: false, message: 'Cloudflare D1 中尚未发现配置记录，请先推送到 D1' };
    }

    const remoteConfig = JSON.parse(row.value);
    const merged = smartMergeConfigs(config, remoteConfig);

    saveConfig(merged);
    return { success: true, message: '成功从 Cloudflare D1 智能合并拉取最新配置', config: merged };
  } catch (error: any) {
    return { success: false, message: `D1 拉取异常: ${error.message || error}` };
  }
};

export const pushToCfD1 = async (config: AppConfig): Promise<SyncResult> => {
  const { accountId, databaseId, apiToken, tableName = 'cf_navs_config', workerProxyUrl } = config.sync.cfD1;
  const jsonString = JSON.stringify(config, null, 2);
  const now = Date.now();

  // 1. 优先尝试边缘端 /api/sync
  try {
    const edgeRes = await fetch('/api/sync?key=cf_navs_config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonString,
    });
    if (edgeRes.ok) {
      const resJson = await edgeRes.json().catch(() => ({}));
      return {
        success: true,
        message: resJson.message || '已成功通过 Cloudflare Pages D1 边缘后端 (/api/sync) 保存',
      };
    }
  } catch {
    // fallback
  }

  // 2. 备用方式
  try {
    const upsertSql = `INSERT INTO ${tableName} (key, value, updated_at) VALUES ('cf_navs_config', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`;

    if (workerProxyUrl) {
      const response = await fetch(workerProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', sql: upsertSql, params: [jsonString, now] }),
      });
      if (!response.ok) return { success: false, message: `D1 保存失败: HTTP ${response.status}` };
      return { success: true, message: '配置已成功同步到 Cloudflare D1' };
    }

    if (!accountId || !databaseId || !apiToken) {
      return {
        success: false,
        message: '未检测到 ONENAV_D1 绑定。若部署在 Cloudflare Pages，请在 Settings -> Functions 中绑定 D1 (变量名设为 ONENAV_D1)；或在下方填写凭证。',
      };
    }

    const directUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const response = await fetch(directUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: upsertSql,
        params: [jsonString, now],
      }),
    });

    const resJson = await response.json();
    if (!resJson.success) {
      return { success: false, message: `D1 写入错误: ${resJson.errors?.[0]?.message || '写入失败'}` };
    }

    return { success: true, message: '配置已成功同步到 Cloudflare D1' };
  } catch (error: any) {
    return { success: false, message: `D1 写入异常: ${error.message || error}` };
  }
};

/* =========================================================================
   4. Custom Cloud API / Database Synchronization
   ========================================================================= */

export const pullFromCustomApi = async (config: AppConfig): Promise<SyncResult> => {
  const { url, headerKey, headerValue } = config.sync.customApi;
  if (!url) return { success: false, message: '请输入自定义云端 API 接口地址' };

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (headerKey && headerValue) {
      headers[headerKey] = headerValue;
    }

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return { success: false, message: `云端接口响应异常: HTTP ${res.status}` };

    const data = await res.json();
    const merged = smartMergeConfigs(config, data);
    saveConfig(merged);

    return { success: true, message: '从云端数据库智能合并同步成功', config: merged };
  } catch (err: any) {
    return { success: false, message: `自定义 API 请求失败: ${err.message || err}` };
  }
};

export const pushToCustomApi = async (config: AppConfig): Promise<SyncResult> => {
  const { url, method = 'PUT', headerKey, headerValue } = config.sync.customApi;
  if (!url) return { success: false, message: '请输入自定义云端 API 接口地址' };

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (headerKey && headerValue) {
      headers[headerKey] = headerValue;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(config, null, 2),
    });

    if (!res.ok) return { success: false, message: `推送失败: HTTP ${res.status}` };
    return { success: true, message: '已成功保存至云端接口' };
  } catch (err: any) {
    return { success: false, message: `推送至自定义 API 异常: ${err.message || err}` };
  }
};

/* =========================================================================
   Universal Dispatcher: Pull, Push, and Test
   ========================================================================= */

export const syncPull = async (config: AppConfig): Promise<SyncResult> => {
  switch (config.sync.provider) {
    case 'gist':
      return pullFromGist(config);
    case 'github_repo':
      return pullFromGithubRepo(config);
    case 'webdav':
      return pullFromWebdav(config);
    case 'cf_kv':
      return pullFromCfKv(config);
    case 'cf_d1':
      return pullFromCfD1(config);
    case 'custom_api':
      return pullFromCustomApi(config);
    case 'none':
    default:
      return { success: true, message: '当前处于纯本地存储模式', config };
  }
};

export const syncPush = async (config: AppConfig): Promise<SyncResult> => {
  switch (config.sync.provider) {
    case 'gist':
      return pushToGist(config);
    case 'github_repo':
      return pushToGithubRepo(config);
    case 'webdav':
      return pushToWebdav(config);
    case 'cf_kv':
      return pushToCfKv(config);
    case 'cf_d1':
      return pushToCfD1(config);
    case 'custom_api':
      return pushToCustomApi(config);
    case 'none':
    default:
      return { success: true, message: '本地已自动保存' };
  }
};

/**
 * Test credentials for any provider
 */
export const testSyncConnection = async (config: AppConfig, provider: SyncProvider): Promise<SyncResult> => {
  const testConf = { ...config, sync: { ...config.sync, provider } };
  return syncPush(testConf);
};

/* =========================================================================
   JSON & HTML Bookmark Export, Import, Clear & Restore
   ========================================================================= */

/**
 * Export full AppConfig as formatted JSON
 */
export const exportConfigJson = (config: AppConfig) => {
  const dataStr =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `lylme_spage_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Export bookmarks as Netscape Bookmark HTML file (Chrome / Edge / Firefox compatible)
 */
export const exportBookmarksHtml = (config: AppConfig) => {
  downloadNetscapeBookmarksHtml(config.groups);
};

/**
 * Import JSON backup file with mode: 'merge' (incremental) or 'overwrite' (full)
 */
export const importConfigJsonWithOptions = (
  file: File,
  currentConfig: AppConfig,
  mode: 'merge' | 'overwrite' = 'merge'
): Promise<{ config: AppConfig; addedCount: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (mode === 'overwrite') {
          const merged = mergeWithDefaults(parsed);
          saveConfig(merged);
          resolve({ config: merged, addedCount: merged.groups.reduce((a, b) => a + b.items.length, 0) });
        } else {
          // Incremental Merge:
          const parsedGroups = Array.isArray(parsed.groups) ? sanitizeGroups(parsed.groups) : [];
          const { mergedGroups, addedBookmarksCount } = mergeGroupsIncrementally(
            currentConfig.groups,
            parsedGroups
          );

          // Also merge search engines if new ones present
          let mergedEngines = currentConfig.searchEngines;
          if (Array.isArray(parsed.searchEngines)) {
            const existingEngineIds = new Set(currentConfig.searchEngines.map((e) => e.id || e.value));
            const newEngines = parsed.searchEngines.filter(
              (e: any) => !existingEngineIds.has(e.id || e.value)
            );
            mergedEngines = [...currentConfig.searchEngines, ...newEngines];
          }

          const finalConfig: AppConfig = {
            ...currentConfig,
            searchEngines: mergedEngines,
            groups: mergedGroups,
          };

          saveConfig(finalConfig);
          resolve({ config: finalConfig, addedCount: addedBookmarksCount });
        }
      } catch (err: any) {
        reject(new Error(err?.message || 'JSON 格式无效或解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
};

/**
 * Legacy import for backward compatibility
 */
export const importConfigJson = (file: File): Promise<AppConfig> => {
  return importConfigJsonWithOptions(file, DEFAULT_CONFIG, 'overwrite').then((res) => res.config);
};

/**
 * Import Netscape HTML bookmarks (from Chrome/Edge/Safari/Firefox) with mode: 'merge' or 'overwrite'
 */
export const importBookmarksHtmlWithOptions = (
  file: File,
  currentConfig: AppConfig,
  mode: 'merge' | 'overwrite' = 'merge'
): Promise<{ config: AppConfig; count: number; groupCount: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const htmlText = e.target?.result as string;
        const { groups: parsedGroups, totalBookmarks } = parseNetscapeBookmarksHtml(htmlText);

        if (parsedGroups.length === 0 || totalBookmarks === 0) {
          reject(new Error('未在 HTML 文件中解析到有效的书签链接'));
          return;
        }

        if (mode === 'overwrite') {
          const newConfig: AppConfig = {
            ...currentConfig,
            groups: parsedGroups,
          };
          saveConfig(newConfig);
          resolve({ config: newConfig, count: totalBookmarks, groupCount: parsedGroups.length });
        } else {
          // Incremental merge
          const { mergedGroups, addedBookmarksCount, addedGroupsCount } = mergeGroupsIncrementally(
            currentConfig.groups,
            parsedGroups
          );

          const newConfig: AppConfig = {
            ...currentConfig,
            groups: mergedGroups,
          };
          saveConfig(newConfig);
          resolve({
            config: newConfig,
            count: addedBookmarksCount,
            groupCount: addedGroupsCount,
          });
        }
      } catch (err: any) {
        reject(new Error(err?.message || '解析浏览器书签 HTML 失败'));
      }
    };
    reader.onerror = () => reject(new Error('读取 HTML 文件失败'));
    reader.readAsText(file);
  });
};

/**
 * Clear all bookmarks and categories (keep theme and site settings)
 */
export const clearAllBookmarks = (currentConfig: AppConfig): AppConfig => {
  const emptyConfig: AppConfig = {
    ...currentConfig,
    groups: [
      {
        id: 'default',
        name: '常用推荐',
        items: [],
      },
    ],
  };
  saveConfig(emptyConfig);
  return emptyConfig;
};

/**
 * Reset all configurations and bookmarks to initial factory defaults
 */
export const restoreFactoryDefaults = (): AppConfig => {
  saveConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
};

