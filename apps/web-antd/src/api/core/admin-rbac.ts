import { requestClient } from '#/api/request';

export namespace AdminRbacApi {
  export interface RoleItem {
    code: string;
    id: number;
    name: string;
  }

  export interface CreateRoleParams {
    code: string;
    name: string;
  }

  export interface UpdateRoleParams {
    name?: string;
  }

  export interface RoleAccessResult {
    menu_api_ids: number[];
    menu_ids: number[];
    role_code: string;
  }

  export interface UpdateRoleAccessParams {
    menu_api_ids?: number[];
    menu_ids?: number[];
  }

  export interface MenuItem {
    component: null | string;
    icon: null | string;
    id: number;
    menu_type: 'directory' | 'menu';
    parent_id: null | number;
    path: null | string;
    sort: number;
    title: string;
  }

  export interface MenuTreeNode extends MenuItem {
    children: MenuTreeNode[];
  }

  export interface CreateMenuParams {
    component?: null | string;
    icon?: null | string;
    menu_type?: 'directory' | 'menu';
    parent_id?: null | number;
    path?: null | string;
    sort?: number;
    title: string;
  }

  export interface UpdateMenuParams {
    component?: null | string;
    icon?: null | string;
    menu_type?: 'directory' | 'menu';
    parent_id?: null | number;
    path?: null | string;
    sort?: number;
    title?: string;
  }

  export interface MenuApiRule {
    id: number;
    menu_id: number;
    method: string;
    path_pattern: string;
    remark: null | string;
    sort: number;
  }

  export interface MenuApisResult {
    apis: MenuApiRule[];
    menu_id: number;
  }

  export interface UpdateMenuApiItem {
    method?: string;
    path_pattern: string;
    remark?: null | string;
    sort?: number;
  }

  export interface UpdateMenuApisParams {
    apis?: UpdateMenuApiItem[];
  }
}

/** 角色列表 */
export function listRbacRolesApi() {
  return requestClient.get<AdminRbacApi.RoleItem[]>('/admin/rbac/roles');
}

/** 创建角色 */
export function createRoleApi(data: AdminRbacApi.CreateRoleParams) {
  return requestClient.post<AdminRbacApi.RoleItem>(
    '/admin/rbac/roles/create',
    data,
  );
}

/** 更新角色 */
export function updateRoleApi(
  roleCode: string,
  data: AdminRbacApi.UpdateRoleParams,
) {
  return requestClient.request<AdminRbacApi.RoleItem>(
    `/admin/rbac/roles/update/${roleCode}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

/** 删除角色 */
export function deleteRoleApi(roleCode: string) {
  return requestClient.delete<null>(`/admin/rbac/roles/delete/${roleCode}`);
}

/** 查询角色菜单与接口授权 */
export function getRoleAccessApi(roleCode: string) {
  return requestClient.get<AdminRbacApi.RoleAccessResult>(
    `/admin/rbac/roles/${roleCode}/access`,
  );
}

/** 覆盖角色菜单与接口授权 */
export function updateRoleAccessApi(
  roleCode: string,
  data: AdminRbacApi.UpdateRoleAccessParams,
) {
  return requestClient.put<AdminRbacApi.RoleAccessResult>(
    `/admin/rbac/roles/${roleCode}/access`,
    data,
  );
}

/** 当前用户菜单树（侧栏） */
export function getUserMenuApi() {
  return requestClient.get<AdminRbacApi.MenuTreeNode[]>(
    '/admin/menus/userMenu',
  );
}

/** 全量菜单树 */
export function listMenuTreeApi() {
  return requestClient.get<AdminRbacApi.MenuTreeNode[]>(
    '/admin/rbac/menus/tree',
  );
}

/** 菜单详情 */
export function getMenuDetailApi(menuId: number) {
  return requestClient.get<AdminRbacApi.MenuItem>(
    `/admin/rbac/menus/${menuId}`,
  );
}

/** 创建菜单 */
export function createMenuApi(data: AdminRbacApi.CreateMenuParams) {
  return requestClient.post<AdminRbacApi.MenuItem>(
    '/admin/rbac/menus/create',
    data,
  );
}

/** 更新菜单 */
export function updateMenuApi(
  menuId: number,
  data: AdminRbacApi.UpdateMenuParams,
) {
  return requestClient.request<AdminRbacApi.MenuItem>(
    `/admin/rbac/menus/update/${menuId}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

/** 软删除菜单 */
export function deleteMenuApi(menuId: number) {
  return requestClient.delete<null>(`/admin/rbac/menus/delete/${menuId}`);
}

/** 查询菜单已绑接口 */
export function getMenuApisApi(menuId: number) {
  return requestClient.get<AdminRbacApi.MenuApisResult>(
    `/admin/rbac/menus/${menuId}/apis`,
  );
}

/** 覆盖菜单绑定接口 */
export function updateMenuApisApi(
  menuId: number,
  data: AdminRbacApi.UpdateMenuApisParams,
) {
  return requestClient.put<AdminRbacApi.MenuApisResult>(
    `/admin/rbac/menus/${menuId}/apis`,
    data,
  );
}
