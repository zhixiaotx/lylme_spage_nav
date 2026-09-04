/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavGroup, NavItem, AppConfig } from '../types';

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Export NavGroups as standard Netscape Bookmark HTML file format
 * Compatible with Chrome, Edge, Firefox, Safari, Arc, and other browsers
 */
export function generateNetscapeBookmarksHtml(groups: NavGroup[]): string {
  const now = Math.floor(Date.now() / 1000);

  // Separate top-level groups and determine hierarchy
  const topGroups = groups.filter(
    (g) => !g.parentId || !groups.some((p) => p.id === g.parentId)
  );

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  const renderGroupTree = (group: NavGroup, indent: string): string => {
    const subGroups = groups.filter((g) => g.parentId === group.id);
    let block = `${indent}<DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHtml(group.name)}</H3>\n`;
    block += `${indent}<DL><p>\n`;

    // Render items in this category
    for (const item of group.items) {
      const iconAttr =
        item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'))
          ? ` ICON="${escapeHtml(item.icon)}"`
          : '';
      block += `${indent}    <DT><A HREF="${escapeHtml(item.url)}" ADD_DATE="${now}"${iconAttr}>${escapeHtml(item.name)}</A>\n`;
    }

    // Render subcategories recursively
    for (const sub of subGroups) {
      block += renderGroupTree(sub, indent + '    ');
    }

    block += `${indent}</DL><p>\n`;
    return block;
  };

  const visitedGroupIds = new Set<string>();
  const markVisited = (g: NavGroup) => {
    visitedGroupIds.add(g.id);
    groups.filter((sub) => sub.parentId === g.id).forEach(markVisited);
  };

  for (const topGroup of topGroups) {
    html += renderGroupTree(topGroup, '    ');
    markVisited(topGroup);
  }

  // Handle any orphan groups
  const orphans = groups.filter((g) => !visitedGroupIds.has(g.id));
  for (const orphan of orphans) {
    html += renderGroupTree(orphan, '    ');
  }

  html += `</DL><p>\n`;
  return html;
}

/**
 * Trigger download of HTML bookmark file
 */
export function downloadNetscapeBookmarksHtml(groups: NavGroup[], filename?: string) {
  const htmlContent = generateNetscapeBookmarksHtml(groups);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `bookmarks_backup_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse Netscape Bookmark HTML file (exported from Chrome, Edge, Firefox, Safari)
 * Traverses folder hierarchy to produce top-level and subcategories (multi-level groups)
 */
export function parseNetscapeBookmarksHtml(htmlString: string): {
  groups: NavGroup[];
  totalBookmarks: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const groups: NavGroup[] = [];
  let totalBookmarks = 0;

  // Helper to create a new NavGroup
  const createGroup = (name: string, parentId?: string): NavGroup => {
    return {
      id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || '未命名分类',
      parentId: parentId || undefined,
      items: [],
    };
  };

  // Find root DL container
  const rootDl = doc.querySelector('dl');
  if (!rootDl) {
    // Fallback: extract all <a> tags into a single category
    const allLinks = Array.from(doc.querySelectorAll('a'));
    if (allLinks.length > 0) {
      const fallbackGroup = createGroup('导入书签');
      allLinks.forEach((a) => {
        const href = a.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          fallbackGroup.items.push({
            id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: a.textContent?.trim() || href,
            url: href,
            icon: a.getAttribute('icon') || undefined,
          });
          totalBookmarks++;
        }
      });
      return { groups: [fallbackGroup], totalBookmarks };
    }
    return { groups: [], totalBookmarks: 0 };
  }

  // Recursive DL traversal
  function traverseDl(dlElement: Element, parentGroupId?: string) {
    // Look for DT items inside DL
    const children = Array.from(dlElement.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const tag = child.tagName.toUpperCase();

      if (tag === 'DT') {
        const h3 = child.querySelector(':scope > h3');
        const a = child.querySelector(':scope > a');
        let nestedDl = child.querySelector(':scope > dl');

        // Sometimes DL is a sibling of DT, not a child
        if (!nestedDl && i + 1 < children.length && children[i + 1].tagName.toUpperCase() === 'DL') {
          nestedDl = children[i + 1];
        }

        if (h3) {
          const folderName = h3.textContent?.trim() || '未命名分类';
          // Filter out generic wrapper names if at root (like "书签栏" or "Bookmarks Bar")
          // but preserve them as categories
          const newGroup = createGroup(folderName, parentGroupId);
          groups.push(newGroup);

          if (nestedDl) {
            traverseDl(nestedDl, newGroup.id);
          }
        } else if (a) {
          const href = a.getAttribute('href');
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            const item: NavItem = {
              id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: a.textContent?.trim() || href,
              url: href,
              icon: a.getAttribute('icon') || undefined,
            };

            // If there's an active group, add to it
            let targetGroup = groups.find((g) => g.id === parentGroupId);
            if (!targetGroup) {
              // Add to or create an "其他书签" group
              targetGroup = groups.find((g) => g.name === '常用书签' || g.name === '其他书签');
              if (!targetGroup) {
                targetGroup = createGroup('常用书签');
                groups.unshift(targetGroup);
              }
            }
            targetGroup.items.push(item);
            totalBookmarks++;
          }
        }
      } else if (tag === 'DL') {
        // Direct nested DL without DT wrapper
        traverseDl(child, parentGroupId);
      }
    }
  }

  traverseDl(rootDl, undefined);

  // Filter out empty groups if there are any non-empty groups, or keep non-empty groups
  const nonEmptyGroups = groups.filter((g) => g.items.length > 0 || groups.some((sub) => sub.parentId === g.id));
  const finalGroups = nonEmptyGroups.length > 0 ? nonEmptyGroups : groups;

  return { groups: finalGroups, totalBookmarks };
}

/**
 * Merge imported groups into current groups (Incremental Merge)
 * Deduplicates by URL within each group, creates new groups if not found
 */
export function mergeGroupsIncrementally(
  currentGroups: NavGroup[],
  importedGroups: NavGroup[]
): {
  mergedGroups: NavGroup[];
  addedBookmarksCount: number;
  addedGroupsCount: number;
} {
  let addedBookmarksCount = 0;
  let addedGroupsCount = 0;

  // Clone current groups
  const resultGroups: NavGroup[] = currentGroups.map((g) => ({
    ...g,
    items: [...g.items],
  }));

  // Map of group names to existing group objects
  const nameToGroupMap = new Map<string, NavGroup>();
  resultGroups.forEach((g) => {
    nameToGroupMap.set(g.name.toLowerCase().trim(), g);
  });

  // Map old imported group IDs to new/matched group IDs (to preserve parentId)
  const idMapping = new Map<string, string>();

  for (const impGroup of importedGroups) {
    const key = impGroup.name.toLowerCase().trim();
    let target = nameToGroupMap.get(key);

    if (target) {
      idMapping.set(impGroup.id, target.id);
      // Merge items into existing group
      const existingUrls = new Set(target.items.map((it) => it.url.toLowerCase().trim()));
      for (const item of impGroup.items) {
        if (!existingUrls.has(item.url.toLowerCase().trim())) {
          target.items.push({ ...item });
          existingUrls.add(item.url.toLowerCase().trim());
          addedBookmarksCount++;
        }
      }
    } else {
      // Create new group
      const newGroupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      idMapping.set(impGroup.id, newGroupId);

      const newGroup: NavGroup = {
        ...impGroup,
        id: newGroupId,
        parentId: impGroup.parentId ? idMapping.get(impGroup.parentId) || impGroup.parentId : undefined,
        items: [...impGroup.items],
      };

      resultGroups.push(newGroup);
      nameToGroupMap.set(key, newGroup);
      addedGroupsCount++;
      addedBookmarksCount += impGroup.items.length;
    }
  }

  // Update parentIds for any newly created groups if mapped
  resultGroups.forEach((g) => {
    if (g.parentId && idMapping.has(g.parentId)) {
      g.parentId = idMapping.get(g.parentId);
    }
  });

  return {
    mergedGroups: resultGroups,
    addedBookmarksCount,
    addedGroupsCount,
  };
}
