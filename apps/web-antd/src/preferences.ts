import {
  defineOverridesPreferences,
  definePreferencesExtension,
} from '@vben/preferences';

/** 项目侧栏宽度（启动时会强制覆盖 localStorage 缓存值） */
export const PROJECT_SIDEBAR_WIDTH = 220;

/** 项目顶栏高度（启动时会强制覆盖 localStorage 缓存值） */
export const PROJECT_HEADER_HEIGHT = 60;

/** 项目顶栏用户头像尺寸 */
export const PROJECT_HEADER_AVATAR_SIZE = 40;

interface WebAntdPreferencesExtension {
  defaultTableSize: number;
  enableFormFullscreen: boolean;
  enableTopSideMenu: boolean;
  reportTitle: string;
  tenantMode: 'multi' | 'single';
}

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    accessMode: 'mixed',
    authPageLayout: 'panel-center',
    defaultHomePath: '/workspace',
    enableCheckUpdates: false,
    enableCopyPreferences: false,
    enableRefreshToken: true,
    // enablePreferences: false,
    enablePreferences: true,
    name: import.meta.env.VITE_APP_TITLE,
  },
  copyright: {
    enable: false,
    settingShow: false,
  },
  logo: {
    source: '/logo.png',
    sourceDark: '/logo.png',
  },
  header: {
    height: PROJECT_HEADER_HEIGHT,
  },
  navigation: {
    accordion: false,
  },
  sidebar: {
    collapsed: false,
    draggable: false,
    expandOnHover: false,
    width: PROJECT_SIDEBAR_WIDTH,
  },
  theme: {
    colorPrimary: 'hsl(245 82% 67%)', // 默认主题色
    mode: 'light',
  },
  shortcutKeys: {
    enable: false,
    globalLockScreen: false,
    globalPreferences: false,
    globalSearch: false,
  },
  tabbar: {
    showMaximize: false,
  },
  widget: {
    globalSearch: false,
    languageToggle: false,
    lockScreen: false,
    notification: false,
    sidebarToggle: false,
    themeToggle: false,
    timezone: false,
  },
});

export const preferencesExtension =
  definePreferencesExtension<WebAntdPreferencesExtension>({
    tabLabel: 'preferences.antd.tabLabel',
    title: 'preferences.antd.title',
    fields: [
      {
        component: 'switch',
        // defaultValue: true,
        defaultValue: false,
        key: 'enableTopSideMenu',
        label: 'preferences.antd.fields.enableTopSideMenu.label',
        tip: 'preferences.antd.fields.enableTopSideMenu.tip',
      },
      {
        component: 'switch',
        defaultValue: true,
        key: 'enableFormFullscreen',
        label: 'preferences.antd.fields.enableFormFullscreen.label',
        tip: 'preferences.antd.fields.enableFormFullscreen.tip',
      },
      {
        component: 'select',
        defaultValue: 'single',
        key: 'tenantMode',
        label: 'preferences.antd.fields.tenantMode.label',
        options: [
          {
            label: 'preferences.antd.fields.tenantMode.options.single.label',
            value: 'single',
          },
          {
            label: 'preferences.antd.fields.tenantMode.options.multi.label',
            value: 'multi',
          },
        ],
      },
      {
        component: 'number',
        componentProps: {
          max: 200,
          min: 10,
          step: 10,
        },
        defaultValue: 20,
        key: 'defaultTableSize',
        label: 'preferences.antd.fields.defaultTableSize.label',
      },
      {
        component: 'input',
        defaultValue: '',
        key: 'reportTitle',
        label: 'preferences.antd.fields.reportTitle.label',
        placeholder: 'preferences.antd.fields.reportTitle.placeholder',
      },
    ],
  });
