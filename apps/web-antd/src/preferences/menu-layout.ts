import { getCustomPreferences, updatePreferences } from '@vben/preferences';

import { PROJECT_HEADER_HEIGHT, PROJECT_SIDEBAR_WIDTH } from '../preferences';

interface TopSideMenuCustomPreferences {
  enableTopSideMenu?: boolean;
}

/** 根据 enableTopSideMenu 开关同步布局与面包屑配置 */
export function applyTopSideMenuLayoutPreferences() {
  const { enableTopSideMenu } =
    getCustomPreferences<TopSideMenuCustomPreferences>();

  updatePreferences({
    app: {
      layout: enableTopSideMenu ? 'mixed-nav' : 'sidebar-nav',
    },
    breadcrumb: {
      enable: !enableTopSideMenu,
    },
    navigation: {
      split: true,
    },
    sidebar: {
      width: PROJECT_SIDEBAR_WIDTH,
    },
    header: {
      height: PROJECT_HEADER_HEIGHT,
    },
  });
}
