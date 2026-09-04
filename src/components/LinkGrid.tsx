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
  ChevronDown,
  ChevronRight,
  FolderTree,
  FolderClosed,
  Maximize2,
  Minimize2,
  Search,
  Zap,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Favicon } from './Favicon';
import { stripHtmlTags } from '../lib/bookmarkParser';

const STORAGE_COLLAPSED_KEY = 'lylme_collapsed_groups_v1';
const INITIAL_BATCH_SIZE = 36;
const BATCH_LOAD_STEP = 36;
const VIRTUAL_SCROLL_THRESHOLD = 500;

interface LinkGridProps {
  groups: NavGroup[];
  theme: ThemeConfig;
  editMode: boolean;
  isDarkMode?: boolean;
  onEditLink: (item: NavItem, groupId: string) => void;
  onDeleteLink: (itemId: string, groupId: string) => void;
  onReorderLinks?: (groupId: string, items: NavItem[]) => void;
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
  onReorderLinks,
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Total bookmarks count for virtual scrolling threshold determination (>500)
  const totalBookmarkCount = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.items.length, 0);
  }, [groups]);

  const isVirtualModeGlobal = totalBookmarkCount >= VIRTUAL_SCROLL_THRESHOLD;

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
  const resolvedCardBorderClass = cardBorderClass || 'border-transparent';

  // Compute dynamic card style respecting theme opacity and blur settings
  const opacityVal = typeof theme?.opacity === 'number' ? theme.opacity : 0.85;
  const blurVal = typeof theme?.blur === 'number' ? theme.blur : 12;

  const dynamicCardStyle: React.CSSProperties = useMemo(() => ({
    backgroundColor: isDarkMode
      ? `rgba(15, 23, 42, ${opacityVal})`
      : `rgba(255, 255, 255, ${opacityVal})`,
    backdropFilter: `blur(${blurVal}px)`,
    WebkitBackdropFilter: `blur(${blurVal}px)`,
  }), [opacityVal, blurVal, isDarkMode]);

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

      {/* Tabs Navigation Selector (If tabs mode with smooth gesture touch swipe on mobile) */}
      {theme.layoutMode === 'tabs' && (
        <div className="space-y-3 pt-2 pb-4">
          {/* Main Top-Level Categories - Gesture Swipe Container */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-1.5 px-2 sm:flex-wrap sm:justify-center -mx-4 sm:mx-0">
            <button
              type="button"
              onClick={() => {
                setActiveTabId('all');
                setActiveSubTabId('all');
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0 ${
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
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0 ${
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

          {/* Subcategories Secondary Filter */}
          {activeTabId !== 'all' && currentSubGroups.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-1 px-2 sm:flex-wrap sm:justify-center -mx-4 sm:mx-0">
              <button
                type="button"
                onClick={() => setActiveSubTabId('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
                    activeSubTabId === sub.id
                      ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40 shadow-sm'
                      : isDarkMode
                      ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{sub.name} ({sub.items.length})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sidebar Layout Mode Structure */}
      {theme.layoutMode === 'sidebar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          {/* Mobile Toggle Button for Collapsible Sidebar Index */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border shadow-md transition-all ${
                isDarkMode
                  ? 'bg-slate-900/80 border-white/20 text-white'
                  : 'bg-white/90 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderTree size={16} className="text-sky-500" />
                <span className="text-xs font-bold">快捷分类索引 ({topLevelGroups.length} 个大类)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                <span>{isMobileSidebarOpen ? '收起面板' : '展开选择'}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileSidebarOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </div>

          {/* Sidebar Category List */}
          <div
            style={dynamicCardStyle}
            className={`lg:col-span-1 lg:sticky top-8 rounded-2xl p-4 shadow-xl space-y-2 ${
              isMobileSidebarOpen ? 'block' : 'hidden lg:block'
            } ${
              isDarkMode
                ? 'text-white'
                : 'text-slate-800'
            }`}
          >
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
                onReorderLinks={onReorderLinks}
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
                onReorderLinks={onReorderLinks}
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
  onReorderLinks?: (groupId: string, items: NavItem[]) => void;
  onAddLink: (groupId: string) => void;
  onEditGroup: (group: NavGroup) => void;
  onDeleteGroup: (groupId: string) => void;
}

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
  onReorderLinks,
  onAddLink,
  onEditGroup,
  onDeleteGroup,
}: GroupSectionProps) {
  const [renderedLimit, setRenderedLimit] = useState<number>(INITIAL_BATCH_SIZE);
  const [inGroupFilter, setInGroupFilter] = useState<string>('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollPos, setScrollPos] = useState({ scrollTop: 0, vh: 800 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderLinks) return;

    const oldIndex = group.items.findIndex((item) => item.id === active.id);
    const newIndex = group.items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(group.items, oldIndex, newIndex);
      onReorderLinks(group.id, reordered);
    }
  };

  // Reset rendered limit when group changes or filter query changes
  useEffect(() => {
    setRenderedLimit(INITIAL_BATCH_SIZE);
  }, [group.id, inGroupFilter]);

  // Window scroll observer for Virtual Scrolling window calculation
  useEffect(() => {
    let animationFrameId: number;
    const updateScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setScrollPos({
          scrollTop: window.scrollY || document.documentElement.scrollTop,
          vh: window.innerHeight,
        });
      });
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    updateScroll();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

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

  // Render all items in the group directly without virtual slicing or pagination buttons
  const visibleItems = filteredItems;

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
            {stripHtmlTags(group.name)}
          </h3>

          {editMode && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1 select-none">
              <GripVertical size={11} />
              <span>拖拽卡片调整排序</span>
            </span>
          )}
        </div>

        {/* Right side controls: Edit controls */}
        <div className="flex items-center gap-2">

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleItems.map((it) => it.id)}
                strategy={rectSortingStrategy}
                disabled={!editMode}
              >
                <div ref={gridContainerRef} className="w-full">
                  <div className={gridColsClass}>
                    {visibleItems.map((item) => (
                      <SortableNavCard
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
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* =========================================================================
   Subcomponent: Sortable Navigation Card (with dnd-kit support)
   ========================================================================= */

interface SortableNavCardProps {
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

const SortableNavCard = memo(function SortableNavCard({
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
}: SortableNavCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !editMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.4 : 1,
    touchAction: editMode ? 'none' : undefined,
  };

  const cardOpacity = typeof theme.opacity === 'number' ? theme.opacity : 0.85;
  const cardBlur = typeof theme.blur === 'number' ? theme.blur : 12;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${
        isDragging ? 'scale-105 shadow-2xl ring-2 ring-sky-500 rounded-2xl' : ''
      }`}
    >
      <motion.a
        href={editMode ? undefined : item.url}
        target={theme.openInNewTab ? '_blank' : '_self'}
        rel="noopener noreferrer"
        whileHover={{ scale: editMode ? 1.01 : 1.03, y: editMode ? 0 : -3 }}
        whileTap={{ scale: editMode ? 0.99 : 0.98 }}
        className={`relative flex items-center gap-3 p-3 sm:gap-3.5 sm:p-3.5 ${radiusClass} border ${cardBorderClass} shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden select-none ${
          editMode
            ? 'cursor-grab active:cursor-grabbing hover:border-sky-400/50'
            : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: isDarkMode
            ? `rgba(15, 23, 42, ${cardOpacity})`
            : `rgba(255, 255, 255, ${cardOpacity})`,
          backdropFilter: `blur(${cardBlur}px)`,
          WebkitBackdropFilter: `blur(${cardBlur}px)`,
        }}
        {...(editMode ? { ...attributes, ...listeners } : {})}
      >
        {/* Drag handle icon indicator in editMode */}
        {editMode && (
          <div
            className="text-sky-400 opacity-60 group-hover:opacity-100 transition-opacity -mr-1 shrink-0 cursor-grab active:cursor-grabbing"
            title="按住拖拽调整顺序"
          >
            <GripVertical size={16} />
          </div>
        )}

        {/* Favicon / Icon without filled background rectangle */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
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
              title={stripHtmlTags(item.name)}
            >
              {stripHtmlTags(item.name)}
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
              title={stripHtmlTags(item.description)}
            >
              {stripHtmlTags(item.description)}
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
  const subtextClass = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const cardOpacity = typeof theme.opacity === 'number' ? theme.opacity : 0.85;
  const cardBlur = typeof theme.blur === 'number' ? theme.blur : 12;

  return (
    <div className="relative group">
      <motion.a
        href={editMode ? undefined : item.url}
        target={theme.openInNewTab ? '_blank' : '_self'}
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05, y: -2 }}
        className={`flex items-center gap-2.5 p-2.5 ${radiusClass} border ${cardBorderClass} shadow-sm hover:shadow-md transition-all truncate`}
        style={{
          backgroundColor: isDarkMode
            ? `rgba(15, 23, 42, ${cardOpacity})`
            : `rgba(255, 255, 255, ${cardOpacity})`,
          backdropFilter: `blur(${cardBlur}px)`,
          WebkitBackdropFilter: `blur(${cardBlur}px)`,
        }}
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
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-semibold truncate block ${textClass}`}>{stripHtmlTags(item.name)}</span>
          {item.description && (
            <p className={`text-[10px] truncate mt-0.5 opacity-75 ${subtextClass}`} title={stripHtmlTags(item.description)}>
              {stripHtmlTags(item.description)}
            </p>
          )}
        </div>
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
