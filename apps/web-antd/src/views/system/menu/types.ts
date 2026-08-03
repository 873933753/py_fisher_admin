import type { AdminRbacApi } from '#/api/core/admin-rbac';

export type PanelMode = 'add' | 'edit' | 'view';

export interface MenuFormState {
  component: string;
  icon: string;
  menu_type: AdminRbacApi.MenuTreeNode['menu_type'];
  parent_id: number | undefined;
  path: string;
  permission_code: string;
  sort: number;
  title: string;
}

export interface MenuApiRow {
  key: string;
  method: string;
  path_pattern: string;
  remark: string;
  sort: number;
}
