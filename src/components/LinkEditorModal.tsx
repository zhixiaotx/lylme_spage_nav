import React, { useState, useEffect } from 'react';
import { NavGroup, NavItem, IconSource } from '../types';
import { X, Globe, Star, Sparkles, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Favicon } from './Favicon';
import {
  iconSources,
  getAutoFavicon,
  suggestSiteName,
  getHostname,
} from '../lib/favicon';

interface LinkEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLink: (item: NavItem, groupId: string) => void;
  onSaveGroup: (group: NavGroup) => void;
  groups: NavGroup[];
  editingItem: { item?: NavItem; groupId?: string } | null;
  editingGroup: NavGroup | null;
  mode: 'link' | 'group';
}

export function LinkEditorModal({
  isOpen,
  onClose,
  onSaveLink,
  onSaveGroup,
  groups,
  editingItem,
  editingGroup,
  mode,
}: LinkEditorModalProps) {
  // Link state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [selectedSource, setSelectedSource] = useState<IconSource>('favicon_im');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [isPinned, setIsPinned] = useState(false);

  // Group state
  const [groupName, setGroupName] = useState('');
  const [parentGroupId, setParentGroupId] = useState<string>('');

  useEffect(() => {
    if (mode === 'link') {
      if (editingItem?.item) {
        setName(editingItem.item.name || '');
        setUrl(editingItem.item.url || '');
        setIcon(editingItem.item.icon || '');
        setDescription(editingItem.item.description || '');
        setSelectedGroupId(editingItem.groupId || groups[0]?.id || '');
        setIsPinned(Boolean(editingItem.item.isPinned));
      } else {
        setName('');
        setUrl('');
        setIcon('');
        setDescription('');
        setSelectedGroupId(editingItem?.groupId || groups[0]?.id || '');
        setIsPinned(false);
      }
    } else {
      if (editingGroup) {
        setGroupName(editingGroup.name || '');
        setParentGroupId(editingGroup.parentId || '');
      } else {
        setGroupName('');
        setParentGroupId(editingItem?.groupId || '');
      }
    }
  }, [editingItem, editingGroup, mode, isOpen, groups]);

  // Auto detect favicon and site name from URL
  const autoDetectFavicon = () => {
    if (!url.trim()) return;
    const formattedUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`;
    const domain = getHostname(formattedUrl);
    if (!domain) return;

    // 1. Suggest site title if empty or default
    const suggested = suggestSiteName(formattedUrl);
    if (suggested && (!name || name.trim() === '')) {
      setName(suggested);
    }

    // 2. Fetch favicon URL using selected provider
    const autoIcon = getAutoFavicon(formattedUrl, selectedSource);
    setIcon(autoIcon);
  };

  const handleSourceChange = (newSource: IconSource) => {
    setSelectedSource(newSource);
    if (url.trim()) {
      const formattedUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`;
      setIcon(getAutoFavicon(formattedUrl, newSource));
    }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const formattedUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`;
    const autoIcon = icon.trim() || getAutoFavicon(formattedUrl, selectedSource);

    const linkData: NavItem = {
      id: editingItem?.item?.id || `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      url: formattedUrl,
      icon: autoIcon,
      description: description.trim(),
      isPinned,
    };

    onSaveLink(linkData, selectedGroupId);
    onClose();
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const groupData: NavGroup = {
      id: editingGroup?.id || `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: groupName.trim(),
      items: editingGroup?.items || [],
      parentId: parentGroupId.trim() ? parentGroupId.trim() : undefined,
    };

    onSaveGroup(groupData);
    onClose();
  };

  if (!isOpen) return null;

  // Filter top-level groups for hierarchical select
  const topGroups = groups.filter(
    (g) => !g.parentId || !groups.some((p) => p.id === g.parentId)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl z-10 text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              {mode === 'link'
                ? editingItem?.item ? '编辑书签导航' : '添加新书签'
                : editingGroup ? '编辑分类分组' : '新建导航分组'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode: Link Form */}
          {mode === 'link' ? (
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              {/* Group Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">所属分组 (支持多级分类)</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                  required
                >
                  {topGroups.map((tg) => {
                    const subGs = groups.filter((g) => g.parentId === tg.id);
                    return (
                      <React.Fragment key={tg.id}>
                        <option value={tg.id} className="bg-white text-slate-900 font-semibold">
                          📁 {tg.name} (一级分类)
                        </option>
                        {subGs.map((sg) => (
                          <option key={sg.id} value={sg.id} className="bg-white text-slate-700">
                            &nbsp;&nbsp;&nbsp;&nbsp;└─ 📂 {sg.name} (二级子分类)
                          </option>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </select>
              </div>

              {/* URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">网站网址 (URL)</label>
                  <button
                    type="button"
                    onClick={autoDetectFavicon}
                    className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Sparkles size={11} /> 自动抓取 Favicon 与网站名称
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={autoDetectFavicon}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-colors pr-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={autoDetectFavicon}
                    className="absolute right-2 top-2 px-2.5 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
                  >
                    识别
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">网站名称 (Title)</label>
                <input
                  type="text"
                  placeholder="例如: GitHub"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>

              {/* Favicon & Multi-source Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Favicon 图标抓取源</span>
                  </label>
                  <span className="text-[10px] text-slate-500">失败自动展示首字母占位</span>
                </div>

                {/* Source Select Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSource}
                    onChange={(e) => handleSourceChange(e.target.value as IconSource)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                  >
                    {iconSources.map((s) => (
                      <option key={s.value} value={s.value} className="bg-white text-slate-900">
                        {s.label} ({s.detail})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={autoDetectFavicon}
                    title="重新根据所选源抓取"
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {/* Icon URL input & live preview */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                    <Favicon
                      url={url}
                      name={name}
                      icon={icon}
                      preferredSource={selectedSource}
                      size={24}
                      roundedClassName="rounded-md"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="留空自动抓取，或输入自定义图标/Emoji"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">简介说明 (可选)</label>
                <input
                  type="text"
                  placeholder="例如: 全球最大开源代码协作社区"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Pinned toggle */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isPinned
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Star size={13} className={isPinned ? 'fill-amber-400 text-amber-500' : ''} />
                  <span>在顶部常用速览中星标展示 (Pin)</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Check size={16} /> 保存书签
                </button>
              </div>
            </form>
          ) : (
            /* Mode: Group Form */
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">分组名称 (Category Name)</label>
                <input
                  type="text"
                  placeholder="例如: AI 效率工具、开发者选项..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">所属层级 (可选父级分类)</label>
                <select
                  value={parentGroupId}
                  onChange={(e) => setParentGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="" className="bg-white text-slate-900 font-medium">
                    📁 作为一级主分类 (独立展示)
                  </option>
                  {groups
                    .filter((g) => !editingGroup || g.id !== editingGroup.id)
                    .filter((g) => !g.parentId)
                    .map((g) => (
                      <option key={g.id} value={g.id} className="bg-white text-slate-700">
                        &nbsp;&nbsp;└─ 📂 作为「{g.name}」的二级子分类
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  设为二级子分类后，在侧边栏索引、标签页与书签文件中将呈现清晰的树状层级关系。
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Check size={16} /> 保存分组
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
