import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { NavGroup, NavItem, ThemeConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  Star,
  Globe,
  Folder,
  Hash,
  CornerDownRight,
  ChevronDown,
  ChevronRight,
  FolderTree,
  FolderClosed,
  Maximize2,
  Minimize2,
  Search,
  Zap,
} from 'lucide-react';
import { Favicon } from './Favicon';

const STORAGE_COLLAPSED_KEY = 'lylme_collapsed_groups_v1';

interface LinkGridProps {
  groups: NavGroup[];
  theme: ThemeConfig;
  editMode: boolean;
  isDarkMode?: boolean;
  onEditLink: (item: NavItem, groupId: string) => void;
  onDeleteLink: (itemId: string, groupId: string) => void;
  onAddLink: (groupId: string) => void;
  onAddGroup: () => void;
  onEditGroup: (group: NavGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  cardBgClass?: string;
  cardBorderClass?: string;
  textClass?: string;
  subtextClass?: string;
}

export function LinkGrid({
  groups,
  theme,
  editMode,
  isDarkMode = false,
  onEditLink,
  onDeleteLink,
  onAddLink,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  cardBgClass,
  cardBorderClass,
  textClass,
  subtextClass,
}: LinkGridProps) {
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [activeSubTabId, setActiveSubTabId] = useState<string>('all');

  // Collapse state per group with LocalStorage persistence
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_COLLAPSED_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const resolvedTextClass = textClass || (isDarkMode ? 'text-white' : 'text-slate-900');
  const resolvedSubtextClass = subtextClass || (isDarkMode ? 'text-white/70' : 'text-slate-600');
  const resolvedCardBgClass =
    cardBgClass ||
    (isDarkMode
      ? 'bg-slate-900/60 backdrop-blur-xl'
      : 'bg-white/85 backdrop-blur-xl shadow-sm hover:shadow-md');
  const resolvedCardBorderClass =
    cardBorderClass ||
    (isDarkMode
      ? 'border-white/15 hover:border-white/40'
      : 'border-slate-200/90 hover:border-slate-300');

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(STORAGE_COLLAPSED_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setCollapsedGroups({});
    try {
      localStorage.removeItem(STORAGE_COLLAPSED_KEY);
    } catch (e) {}
  };

  const handleCollapseAll = () => {
    const all: Record<string, boolean> = {};
    groups.forEach((g) => {
      all[g.id] = true;
    });
    setCollapsedGroups(all);
    try {
      localStorage.setItem(STORAGE_COLLAPSED_KEY, JSON.stringify(all));
    } catch (e) {}
  };

  const isAllCollapsed = groups.length > 0 && groups.every((g) => collapsedGroups[g.id]);

  // Separate top-level groups for multi-level hierarchy
  const topLevelGroups = groups.filter(
    (g) => !g.parentId || !groups.some((p) => p.id === g.parentId)
  );

  // Subgroups for currently selected tab in Tabs mode
  const activeTopGroup = groups.find((g) => g.id === activeTabId);
  const currentSubGroups = activeTopGroup
    ? groups.filter((g) => g.parentId === activeTopGroup.id)
    : [];

  // Collect pinned links across all groups
  const pinnedLinks: { item: NavItem; groupId: string }[] = [];
  groups.forEach((g) => {
    g.items.forEach((it) => {
      if (it.isPinned) {
        pinnedLinks.push({ item: it, groupId: g.id });
      }
    });
  });

  const getBorderRadiusClass = () => {
    switch (theme.cardBorderRadius) {
      case 'rounded-xl':
        return 'rounded-xl';
      case 'rounded-3xl':
        return 'rounded-3xl';
      case 'rounded-2xl':
      default:
        return 'rounded-2xl';
    }
  };

  const radiusClass = getBorderRadiusClass();

  // Tabbed layout filter with multi-level categories support
  const displayedGroups =
    theme.layoutMode === 'tabs'
      ? activeTabId === 'all'
        ? groups
        : activeSubTabId === 'all'
        ? groups.filter((g) => g.id === activeTabId || g.parentId === activeTabId)
        : groups.filter((g) => g.id === activeSubTabId)
      : groups;

  return (
    <div className="w-full space-y-10">
      {/* Quick Pinned Links Bar (If any) */}
      {pinnedLinks.length > 0 && theme.layoutMode !== 'tabs' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${resolvedSubtextClass}`}>
              常用速览 (Pinned)
            </h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {pinnedLinks.map(({ item, groupId }) => (
              <QuickPinnedCard
                key={item.id}
                item={item}
                groupId={groupId}
                theme={theme}
                editMode={editMode}
                isDarkMode={isDarkMode}
                radiusClass={radiusClass}
                cardBgClass={resolvedCardBgClass}
                cardBorderClass={resolvedCardBorderClass}
                textClass={resolvedTextClass}
                onEdit={() => onEditLink(item, groupId)}
                onDelete={() => onDeleteLink(item.id, groupId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tabs Navigation Selector (If tabs mode) */}
      {theme.layoutMode === 'tabs' && (
        <div className="space-y-3 pt-2 pb-4">
          {/* Main Top-Level Categories */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTabId('all');
                setActiveSubTabId('all');
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm ${
                activeTabId === 'all'
                  ? isDarkMode
                    ? 'bg-white/25 text-white shadow-md backdrop-blur-lg border border-white/40'
                    : 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : isDarkMode
                  ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300/80 hover:text-slate-900'
              }`}
            >
              全部分类 ({groups.reduce((acc, g) => acc + g.items.length, 0)})
            </button>
            {topLevelGroups.map((group) => {
              const subCount = groups
                .filter((g) => g.parentId === group.id)
                .reduce((a, b) => a + b.items.length, 0);
              const totalItems = group.items.length + subCount;
              const isSelected = activeTabId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setActiveTabId(group.id);
                    setActiveSubTabId('all');
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-white/25 text-white shadow-md backdrop-blur-lg border border-white/40'
                        : 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                      : isDarkMode
                      ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300/80 hover:text-slate-900'
                  }`}
                >
                  {group.name} ({totalItems})
                </button>
              );
            })}
          </div>

          {/* Subcategories Secondary Filter (If active tab has subcategories) */}
          {activeTabId !== 'all' && currentSubGroups.length > 0 && (
            <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setActiveSubTabId('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeSubTabId === 'all'
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40 shadow-sm'
                    : isDarkMode
                    ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                全部子分类
              </button>
              {currentSubGroups.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSubTabId(sub.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    activeSubTabId === sub.id
                      ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40 shadow-sm'
                      : isDarkMode
                      ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <CornerDownRight size={10} className="opacity-60" />
                  <span>{sub.name} ({sub.items.length})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sidebar Layout Mode Structure */}
      {theme.layoutMode === 'sidebar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Category List */}
          <div className={`lg:col-span-1 sticky top-8 rounded-2xl p-4 border shadow-xl space-y-2 backdrop-blur-2xl ${
            isDarkMode
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-white/85 border-slate-200 text-slate-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider px-3 py-1 ${resolvedSubtextClass}`}>
              快捷分类索引
            </h3>
            <div className="space-y-1">
              {topLevelGroups.map((topG) => {
                const subGroups = groups.filter((g) => g.parentId === topG.id);
                const totalCount =
                  topG.items.length + subGroups.reduce((acc, s) => acc + s.items.length, 0);

                return (
                  <div key={topG.id} className="space-y-0.5">
                    <a
                      href={`#group-${topG.id}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isDarkMode
                          ? 'text-white/90 hover:bg-white/15 hover:text-white'
                          : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Folder size={14} className="opacity-75 text-sky-500 shrink-0" />
                        <span className="truncate">{topG.name}</span>
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isDarkMode ? 'bg-white/10 text-white/70' : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {totalCount}
                      </span>
                    </a>

                    {/* Subcategories Indented Tree */}
                    {subGroups.length > 0 && (
                      <div className={`pl-3 space-y-0.5 border-l ml-3 my-1 ${
                        isDarkMode ? 'border-white/15' : 'border-slate-200'
                      }`}>
                        {subGroups.map((sub) => (
                          <a
                            key={sub.id}
                            href={`#group-${sub.id}`}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isDarkMode
                                ? 'text-white/70 hover:bg-white/15 hover:text-white'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <CornerDownRight size={11} className="opacity-50 shrink-0 text-sky-400" />
                              <span className="truncate">{sub.name}</span>
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isDarkMode ? 'bg-white/10 text-white/60' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {sub.items.length}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {editMode && (
              <button
                type="button"
                onClick={onAddGroup}
                className={`w-full mt-3 py-2 px-3 border border-dashed rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  isDarkMode
                    ? 'border-white/30 text-white/80 hover:bg-white/10'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Plus size={14} /> 添加新分组
              </button>
            )}
          </div>

          {/* Group Content */}
          <div className="lg:col-span-3 space-y-10">
            {groups.map((group) => (
              <GroupSection
                key={group.id}
                group={group}
                allGroups={groups}
                theme={theme}
                editMode={editMode}
                isDarkMode={isDarkMode}
                radiusClass={radiusClass}
                cardBgClass={resolvedCardBgClass}
                cardBorderClass={resolvedCardBorderClass}
                textClass={resolvedTextClass}
                subtextClass={resolvedSubtextClass}
                isCollapsed={Boolean(collapsedGroups[group.id])}
                onToggleCollapse={() => toggleGroupCollapse(group.id)}
                onEditLink={onEditLink}
                onDeleteLink={onDeleteLink}
                onAddLink={onAddLink}
                onEditGroup={onEditGroup}
                onDeleteGroup={onDeleteGroup}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Standard Grid & Tabbed Mode */
        <div className="space-y-10">
          <AnimatePresence mode="wait">
            {displayedGroups.map((group) => (
              <GroupSection
                key={group.id}
                group={group}
                allGroups={groups}
                theme={theme}
                editMode={editMode}
                isDarkMode={isDarkMode}
                radiusClass={radiusClass}
                cardBgClass={resolvedCardBgClass}
                cardBorderClass={resolvedCardBorderClass}
                textClass={resolvedTextClass}
                subtextClass={resolvedSubtextClass}
                isCollapsed={Boolean(collapsedGroups[group.id])}
                onToggleCollapse={() => toggleGroupCollapse(group.id)}
                onEditLink={onEditLink}
                onDeleteLink={onDeleteLink}
                onAddLink={onAddLink}
                onEditGroup={onEditGroup}
                onDeleteGroup={onDeleteGroup}
              />
            ))}
          </AnimatePresence>

          {/* Edit Mode: Add New Group Button */}
          {editMode && (
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={onAddGroup}
                className={`px-6 py-3 border border-dashed rounded-2xl text-sm font-semibold transition-all flex items-center gap-2 backdrop-blur-md shadow-lg ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 border-white/40 text-white'
                    : 'bg-white/80 hover:bg-white border-slate-300 text-slate-800'
                }`}
              >
                <Plus size={18} />
                <span>新建导航分组 (Category)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Subcomponent: Group Section
   ========================================================================= */

interface GroupSectionProps {
  key?: string;
  group: NavGroup;
  allGroups: NavGroup[];
  theme: ThemeConfig;
  editMode: boolean;
  isDarkMode?: boolean;
  radiusClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  textClass: string;
  subtextClass: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onEditLink: (item: NavItem, groupId: string) => void;
  onDeleteLink: (itemId: string, groupId: string) => void;
  onAddLink: (groupId: string) => void;
  onEditGroup: (group: NavGroup) => void;
  onDeleteGroup: (groupId: string) => void;
}

const INITIAL_BATCH_SIZE = 60;
const BATCH_LOAD_STEP = 60;

function GroupSection({
  group,
  allGroups,
  theme,
  editMode,
  isDarkMode = false,
  radiusClass,
  cardBgClass,
  cardBorderClass,
  textClass,
  subtextClass,
  isCollapsed = false,
  onToggleCollapse,
  onEditLink,
  onDeleteLink,
  onAddLink,
  onEditGroup,
  onDeleteGroup,
}: GroupSectionProps) {
  const [renderedLimit, setRenderedLimit] = useState<number>(INITIAL_BATCH_SIZE);
  const [inGroupFilter, setInGroupFilter] = useState<string>('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset rendered limit when group changes or filter query changes
  useEffect(() => {
    setRenderedLimit(INITIAL_BATCH_SIZE);
  }, [group.id, inGroupFilter]);

  const parentGroup = group.parentId
    ? allGroups.find((g) => g.id === group.parentId)
    : undefined;

  const subCategories = allGroups.filter((g) => g.parentId === group.id);

  // Fast In-group filtering for large lists
  const filteredItems = useMemo(() => {
    const q = inGroupFilter.trim().toLowerCase();
    if (!q) return group.items;
    return group.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.url.toLowerCase().includes(q)
    );
  }, [group.items, inGroupFilter]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, renderedLimit);
  }, [filteredItems, renderedLimit]);

  const hasMore = visibleItems.length < filteredItems.length;

  // Infinite lazy batch loader when user scrolls down
  useEffect(() => {
    if (isCollapsed || !hasMore) return;
    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRenderedLimit((prev) => Math.min(prev + BATCH_LOAD_STEP, filteredItems.length));
        }
      },
      {
        rootMargin: '500px',
      }
    );

    observer.observe(currentSentinel);
    return () => observer.disconnect();
  }, [isCollapsed, hasMore, filteredItems.length, renderedLimit]);

  const gridColsClass =
    theme.layoutMode === 'sidebar'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';

  return (
    <section id={`group-${group.id}`} className="space-y-4">
      {/* Group Header */}
      <div className="flex items-center justify-between px-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isCollapsed ? (
            <FolderClosed size={16} className={`opacity-75 text-sky-400 ${textClass}`} />
          ) : (
            <Folder size={16} className={`opacity-75 text-sky-500 ${textClass}`} />
          )}

          <h3
            className={`text-base md:text-lg font-bold tracking-tight text-left select-none ${textClass}`}
          >
            {group.name}
          </h3>

          {/* Subcategory Visual Indicator Badge */}
          {subCategories.length > 0 && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
              isDarkMode
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              <FolderTree size={11} />
              <span>{subCategories.length} 个子目录</span>
            </span>
          )}

          {parentGroup && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
              isDarkMode
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              <CornerDownRight size={11} />
              <span>所属: {parentGroup.name}</span>
            </span>
          )}
        </div>

        {/* Right side controls: In-group search filter (if group is large) & edit controls */}
        <div className="flex items-center gap-2">
          {group.items.length > 18 && (
            <div className="relative flex items-center">
              <Search
                size={12}
                className={`absolute left-2.5 pointer-events-none opacity-50 ${
                  isDarkMode ? 'text-white' : 'text-slate-700'
                }`}
              />
              <input
                type="text"
                value={inGroupFilter}
                onChange={(e) => setInGroupFilter(e.target.value)}
                placeholder="组内筛选..."
                className={`text-xs pl-7 pr-5 py-1 rounded-lg border backdrop-blur-md outline-none transition-all duration-200 w-24 sm:w-32 focus:w-44 ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-sky-400'
                    : 'bg-white/80 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500'
                }`}
              />
              {inGroupFilter && (
                <button
                  type="button"
                  onClick={() => setInGroupFilter('')}
                  className="absolute right-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="清除组内筛选"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {editMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEditGroup(group)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/80'
                }`}
                title="编辑分组名称"
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDeleteGroup(group.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                title="删除整个分组"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Cards Grid Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={gridColsClass}>
              {visibleItems.map((item) => (
                <NavCard
                  key={item.id}
                  item={item}
                  groupId={group.id}
                  theme={theme}
                  editMode={editMode}
                  isDarkMode={isDarkMode}
                  radiusClass={radiusClass}
                  cardBgClass={cardBgClass}
                  cardBorderClass={cardBorderClass}
                  textClass={textClass}
                  subtextClass={subtextClass}
                  onEdit={() => onEditLink(item, group.id)}
                  onDelete={() => onDeleteLink(item.id, group.id)}
                />
              ))}

              {/* Add Link Card in Edit Mode */}
              {editMode && (
                <button
                  type="button"
                  onClick={() => onAddLink(group.id)}
                  className={`flex flex-col items-center justify-center p-5 border-2 border-dashed ${radiusClass} transition-all duration-200 min-h-[110px] group ${
                    isDarkMode
                      ? 'border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                      : 'border-slate-300 hover:border-slate-500 bg-white/60 hover:bg-white text-slate-700 hover:text-slate-900 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                    isDarkMode ? 'bg-white/10 group-hover:bg-white/20' : 'bg-slate-200/80 group-hover:bg-slate-300'
                  }`}>
                    <Plus size={20} />
                  </div>
                  <span className="text-xs font-semibold">添加书签</span>
                </button>
              )}
            </div>

            {/* Batch Status Bar & Controls (Displayed when dataset is large) */}
            {filteredItems.length > INITIAL_BATCH_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3.5 px-1 text-xs">
                <span className={`font-mono text-[11px] opacity-75 ${subtextClass}`}>
                  已展示 {visibleItems.length} / 共 {filteredItems.length} 项
                  {inGroupFilter ? ` (匹配 "${inGroupFilter}")` : ''}
                </span>

                <div className="flex items-center gap-2">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setRenderedLimit((prev) => Math.min(prev + BATCH_LOAD_STEP, filteredItems.length))}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all border shadow-sm ${
                        isDarkMode
                          ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      + 加载下批 ({Math.min(BATCH_LOAD_STEP, filteredItems.length - visibleItems.length)}项)
                    </button>
                  )}

                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setRenderedLimit(filteredItems.length)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all border flex items-center gap-1 shadow-sm ${
                        isDarkMode
                          ? 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/30 text-sky-300'
                          : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700'
                      }`}
                    >
                      <Zap size={12} />
                      <span>全量加载 ({filteredItems.length}项)</span>
                    </button>
                  )}

                  {renderedLimit > INITIAL_BATCH_SIZE && (
                    <button
                      type="button"
                      onClick={() => setRenderedLimit(INITIAL_BATCH_SIZE)}
                      className={`px-2.5 py-1.5 rounded-xl font-medium transition-colors opacity-75 hover:opacity-100 ${subtextClass}`}
                    >
                      ⇡ 收起分批
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Intersection Sentinel Element for auto lazy loading on scroll */}
            {hasMore && <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* =========================================================================
   Subcomponent: Standard Navigation Card (Memoized for max render performance)
   ========================================================================= */

interface NavCardProps {
  key?: string;
  item: NavItem;
  groupId: string;
  theme: ThemeConfig;
  editMode: boolean;
  isDarkMode?: boolean;
  radiusClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  textClass: string;
  subtextClass: string;
  onEdit: () => void;
  onDelete: () => void;
}

const NavCard = memo(function NavCard({
  item,
  theme,
  editMode,
  isDarkMode = false,
  radiusClass,
  cardBgClass,
  cardBorderClass,
  textClass,
  subtextClass,
  onEdit,
  onDelete,
}: NavCardProps) {
  return (
    <div className="relative group">
      <motion.a
        href={editMode ? undefined : item.url}
        target={theme.openInNewTab ? '_blank' : '_self'}
        rel="noopener noreferrer"
        whileHover={{ scale: editMode ? 1 : 1.03, y: editMode ? 0 : -3 }}
        whileTap={{ scale: editMode ? 1 : 0.98 }}
        className={`relative flex items-center gap-3.5 p-3.5 ${radiusClass} ${cardBgClass} border ${cardBorderClass} shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer block select-none`}
        style={{
          backdropFilter: `blur(${theme.blur}px)`,
        }}
      >
        {/* Favicon / Icon without filled background rectangle */}
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <Favicon
            url={item.url}
            name={item.name}
            icon={item.icon}
            size={28}
            preferredSource={theme.iconSource || 'favicon_im'}
            roundedClassName=""
          />
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-semibold tracking-tight ${
                theme.layoutMode === 'sidebar'
                  ? 'break-words whitespace-normal line-clamp-2 leading-snug'
                  : 'truncate block'
              } ${textClass}`}
              title={item.name}
            >
              {item.name}
            </span>
            {item.isPinned && (
              <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
            )}
          </div>
          {item.description ? (
            <p
              className={`text-[11px] ${
                theme.layoutMode === 'sidebar'
                  ? 'break-words whitespace-normal line-clamp-2'
                  : 'truncate'
              } mt-0.5 leading-relaxed ${subtextClass}`}
              title={item.description}
            >
              {item.description}
            </p>
          ) : (
            <p className={`text-[10px] truncate mt-0.5 opacity-50 ${subtextClass}`}>
              {(() => {
                try {
                  return new URL(item.url).hostname;
                } catch {
                  return item.url;
                }
              })()}
            </p>
          )}
        </div>
      </motion.a>

      {/* Action Buttons in Edit Mode */}
      {editMode && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-20 bg-black/75 backdrop-blur-md rounded-lg p-1 shadow-lg border border-white/20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="编辑此项"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
            title="删除此项"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
});

/* =========================================================================
   Subcomponent: Quick Pinned Card (Memoized)
   ========================================================================= */

const QuickPinnedCard = memo(function QuickPinnedCard({
  item,
  theme,
  editMode,
  isDarkMode = false,
  radiusClass,
  cardBgClass,
  cardBorderClass,
  textClass,
  onEdit,
  onDelete,
}: {
  key?: string;
  item: NavItem;
  groupId: string;
  theme: ThemeConfig;
  editMode: boolean;
  isDarkMode?: boolean;
  radiusClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  textClass: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative group">
      <motion.a
        href={editMode ? undefined : item.url}
        target={theme.openInNewTab ? '_blank' : '_self'}
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05, y: -2 }}
        className={`flex items-center gap-2.5 p-2.5 ${radiusClass} ${cardBgClass} border ${cardBorderClass} shadow-sm hover:shadow-md transition-all truncate`}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <Favicon
            url={item.url}
            name={item.name}
            icon={item.icon}
            size={18}
            preferredSource={theme.iconSource || 'favicon_im'}
            roundedClassName=""
          />
        </div>
        <span className={`text-xs font-semibold truncate ${textClass}`}>{item.name}</span>
      </motion.a>

      {editMode && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 z-20 bg-black/80 rounded p-0.5 shadow">
          <button type="button" onClick={onEdit} className="p-0.5 text-white/80 hover:text-white">
            <Edit2 size={10} />
          </button>
          <button type="button" onClick={onDelete} className="p-0.5 text-rose-400 hover:text-rose-200">
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  );
});
