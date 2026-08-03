/** 项目允许的菜单图标（Iconify 完整格式），仅可从列表中选择 */
export interface MenuIconOption {
  label: string;
  value: string;
}

export const MENU_ICON_OPTIONS: MenuIconOption[] = [
  { label: '默认（留空）', value: '' },
  // lucide - 系统
  { label: '设置', value: 'lucide:settings' },
  { label: '用户', value: 'lucide:users' },
  { label: '权限', value: 'lucide:shield' },
  { label: '菜单', value: 'lucide:list-tree' },
  { label: '个人', value: 'lucide:user' },
  { label: '个人(圆)', value: 'lucide:user-round' },
  // lucide - 通用
  { label: '工作台', value: 'lucide:layout-dashboard' },
  { label: '首页', value: 'lucide:home' },
  { label: '文件夹', value: 'lucide:folder' },
  { label: '文件', value: 'lucide:file' },
  { label: '圆形', value: 'lucide:circle' },
  // mdi - 商城
  { label: '用户组', value: 'mdi:account-group-outline' },
  { label: '商城首页', value: 'mdi:home-outline' },
  { label: '轮播', value: 'mdi:view-carousel-outline' },
  { label: '关于', value: 'mdi:information-outline' },
  { label: '商店', value: 'mdi:store-outline' },
  { label: '商品', value: 'mdi:package-variant-closed' },
  { label: '分类', value: 'mdi:shape-outline' },
  { label: '优惠券', value: 'mdi:ticket-percent-outline' },
  { label: '订单', value: 'mdi:clipboard-list-outline' },
  { label: '收据', value: 'mdi:receipt-text-outline' },
  { label: '收银', value: 'mdi:cash-register' },
  { label: '支付', value: 'mdi:cash-multiple' },
  { label: '评论', value: 'mdi:comment-text-outline' },
  // carbon
  { label: 'Carbon 工作台', value: 'carbon:workspace' },
];

export const MENU_ICON_VALUES = new Set<string>(
  MENU_ICON_OPTIONS.map((option) => option.value).filter(Boolean),
);

export function isAllowedMenuIcon(icon: string) {
  const trimmed = icon.trim();
  return !trimmed || MENU_ICON_VALUES.has(trimmed);
}
