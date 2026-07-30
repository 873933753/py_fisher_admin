import type { MenuRecordRaw } from '@vben/types';

import { getCustomPreferences } from '@vben/preferences';

export interface TopSideMenuCustomPreferences {
  enableTopSideMenu?: boolean;
}

/** [menu-layout-custom] 顶栏一级 + 侧栏二级菜单偏好开关 */
export function isTopSideMenuEnabled(): boolean {
  const custom = getCustomPreferences<TopSideMenuCustomPreferences>();
  return custom.enableTopSideMenu === true;
}

/** 获取菜单树中第一个可导航路径 */
export function findFirstNavigableMenuPath(
  menus: MenuRecordRaw[],
): string | undefined {
  if (menus.length === 0) {
    return undefined;
  }

  const [first] = menus;
  if (!first) {
    return undefined;
  }

  if (!first.children?.length) {
    return first.path;
  }

  return findFirstNavigableMenuPath(first.children) ?? first.path;
}
