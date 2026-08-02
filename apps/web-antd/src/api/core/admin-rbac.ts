import { requestClient } from '#/api/request';

export namespace AdminRbacApi {
  export interface RoleItem {
    code: string;
    id: number;
    name: string;
  }

  export interface PermissionItem {
    code: string;
    group_name: string;
    id: number;
    name: string;
  }

  export interface ListPermissionsParams {
    group_name?: string;
  }

  export interface RolePermissionsResult {
    codes: string[];
    role_code: string;
  }

  export interface UpdateRolePermissionsParams {
    codes?: string[];
  }

  export interface RoleMenusResult {
    menu_ids: number[];
    role_code: string;
  }

  export interface UpdateRoleMenusParams {
    menu_ids?: number[];
  }

  export interface MenuItem {
    component: null | string;
    icon: null | string;
    id: number;
    menu_type: 'directory' | 'menu';
    parent_id: null | number;
    path: null | string;
    permission_code: null | string;
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
    permission_code?: null | string;
    sort?: number;
    title: string;
  }

  export interface UpdateMenuParams {
    component?: null | string;
    icon?: null | string;
    menu_type?: 'directory' | 'menu';
    parent_id?: null | number;
    path?: null | string;
    permission_code?: null | string;
    sort?: number;
    title?: string;
  }
}

/** 角色列表 */
export function listRbacRolesApi() {
  return requestClient.get<AdminRbacApi.RoleItem[]>('/admin/rbac/roles');
}

/** 权限列表 */
export function listRbacPermissionsApi(
  params?: AdminRbacApi.ListPermissionsParams,
) {
  return requestClient.get<AdminRbacApi.PermissionItem[]>(
    '/admin/rbac/permissions',
    { params },
  );
}

/** 查询角色已绑权限 */
export function getRolePermissionsApi(roleCode: string) {
  return requestClient.get<AdminRbacApi.RolePermissionsResult>(
    `/admin/rbac/roles/${roleCode}/permissions`,
  );
}

/** 覆盖角色权限 */
export function updateRolePermissionsApi(
  roleCode: string,
  data: AdminRbacApi.UpdateRolePermissionsParams,
) {
  return requestClient.put<AdminRbacApi.RolePermissionsResult>(
    `/admin/rbac/roles/${roleCode}/permissions`,
    data,
  );
}

/** 查询角色已绑菜单 */
export function getRoleMenusApi(roleCode: string) {
  return requestClient.get<AdminRbacApi.RoleMenusResult>(
    `/admin/rbac/roles/${roleCode}/menus`,
  );
}

/** 覆盖角色菜单 */
export function updateRoleMenusApi(
  roleCode: string,
  data: AdminRbacApi.UpdateRoleMenusParams,
) {
  return requestClient.put<AdminRbacApi.RoleMenusResult>(
    `/admin/rbac/roles/${roleCode}/menus`,
    data,
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
