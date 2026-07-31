import { requestClient } from '#/api/request';

export namespace AdminAdminApi {
  export interface ListItem {
    create_time: string;
    id: number;
    is_disabled: boolean;
    phone_number: string;
  }

  export type Detail = ListItem;

  export interface ListParams {
    keyword?: string;
    page?: number;
    size?: number;
  }

  export interface ListResult {
    items: ListItem[];
    page: number;
    pages: number;
    size: number;
    total: number;
  }

  export interface CreateParams {
    password: string;
    phone_number: string;
  }

  export interface UpdateParams {
    is_disabled?: boolean;
    password?: string;
    phone_number?: string;
  }
}

/** 后台账号分页列表 */
export function listAdminAdminsApi(params: AdminAdminApi.ListParams) {
  return requestClient.get<AdminAdminApi.ListResult>('/admin/admins', {
    params,
  });
}

/** 后台账号详情 */
export function getAdminAdminApi(adminId: number) {
  return requestClient.get<AdminAdminApi.Detail>(`/admin/admins/${adminId}`);
}

/** 创建后台账号 */
export function createAdminAdminApi(data: AdminAdminApi.CreateParams) {
  return requestClient.post<AdminAdminApi.Detail>('/admin/admins/create', data);
}

/** 更新后台账号 */
export function updateAdminAdminApi(
  adminId: number,
  data: AdminAdminApi.UpdateParams,
) {
  return requestClient.request<AdminAdminApi.Detail>(
    `/admin/admins/update/${adminId}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

/** 软删除后台账号 */
export function deleteAdminAdminApi(adminId: number) {
  return requestClient.delete<null>(`/admin/admins/delete/${adminId}`);
}
