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
