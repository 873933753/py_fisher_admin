import type { Rule } from 'ant-design-vue/es/form';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import type { MenuFormState, PanelMode } from './types';

const MENU_TYPE_LABELS: Record<AdminRbacApi.MenuTreeNode['menu_type'], string> =
  {
    directory: '目录',
    menu: '页面',
  };

export const MENU_TYPE_OPTIONS: Array<{
  label: string;
  value: AdminRbacApi.MenuTreeNode['menu_type'];
}> = [
  { label: '目录', value: 'directory' },
  { label: '页面', value: 'menu' },
];

export function formatMenuTypeLabel(
  menuType: AdminRbacApi.MenuTreeNode['menu_type'],
) {
  return MENU_TYPE_LABELS[menuType] ?? menuType;
}

export function defaultMenuFormState(): MenuFormState {
  return {
    parent_id: undefined,
    title: '',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    menu_type: 'menu',
  };
}

export function menuDetailToFormState(
  detail: AdminRbacApi.MenuItem,
): MenuFormState {
  return {
    parent_id: detail.parent_id ?? undefined,
    title: detail.title,
    path: detail.path ?? '',
    component: detail.component ?? '',
    icon: detail.icon ?? '',
    sort: detail.sort,
    menu_type: detail.menu_type,
  };
}

export function formStateToCreateParams(
  form: MenuFormState,
): AdminRbacApi.CreateMenuParams {
  return {
    parent_id: form.parent_id ?? null,
    title: form.title.trim(),
    path: form.path.trim() || null,
    component: form.component.trim() || null,
    icon: form.icon.trim() || null,
    sort: form.sort,
    menu_type: form.menu_type,
  };
}

export function formStateToUpdateParams(
  form: MenuFormState,
  original: AdminRbacApi.MenuItem,
): AdminRbacApi.UpdateMenuParams {
  const payload: AdminRbacApi.UpdateMenuParams = {};
  const parentId = form.parent_id ?? null;
  const path = form.path.trim() || null;
  const component = form.component.trim() || null;
  const icon = form.icon.trim() || null;
  const title = form.title.trim();

  if (parentId !== original.parent_id) {
    payload.parent_id = parentId;
  }
  if (title !== original.title) {
    payload.title = title;
  }
  if (path !== original.path) {
    payload.path = path;
  }
  if (component !== original.component) {
    payload.component = component;
  }
  if (icon !== original.icon) {
    payload.icon = icon;
  }
  if (form.sort !== original.sort) {
    payload.sort = form.sort;
  }
  if (form.menu_type !== original.menu_type) {
    payload.menu_type = form.menu_type;
  }

  return payload;
}

export const menuFormRules: Record<string, Rule[]> = {
  title: [
    {
      required: true,
      message: '请输入菜单标题',
      trigger: 'blur',
      type: 'string',
    },
    {
      max: 64,
      message: '标题不能超过 64 个字符',
      trigger: 'blur',
      type: 'string',
    },
  ],
  sort: [
    {
      required: true,
      type: 'number',
      message: '请输入排序值',
      trigger: 'change',
    },
  ],
  menu_type: [
    {
      required: true,
      message: '请选择菜单类型',
      trigger: 'change',
      type: 'string',
    },
  ],
};

export function panelTitleByMode(mode: PanelMode) {
  switch (mode) {
    case 'add': {
      return '新增菜单';
    }
    case 'edit': {
      return '编辑菜单';
    }
    default: {
      return '菜单详情';
    }
  }
}
