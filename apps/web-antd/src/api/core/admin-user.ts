import { requestClient } from '#/api/request';

export namespace AdminUserApi {
  export interface ListItem {
    avatar: string;
    beans: number;
    create_time: string;
    email: string;
    id: number;
    is_disabled: boolean;
    nickname: string;
    update_time: string;
  }

  export interface Detail extends ListItem {
    phone_number: string;
    receive_counter: number;
    send_counter: number;
    wx_name: string;
    wx_open_id: string;
  }

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

  export interface UpdateParams {
    avatar?: string;
    beans?: number;
    is_disabled?: boolean;
    nickname?: string;
    phone_number?: string;
  }
}

/** 用户分页列表 */
export function listAdminUsersApi(params: AdminUserApi.ListParams) {
  return requestClient.get<AdminUserApi.ListResult>('/admin/users', {
    params,
  });
}

/** 用户详情 */
export function getAdminUserApi(userId: number) {
  return requestClient.get<AdminUserApi.Detail>(`/admin/users/${userId}`);
}

/** 更新用户 */
export function updateAdminUserApi(
  userId: number,
  data: AdminUserApi.UpdateParams,
) {
  return requestClient.request<null>(`/admin/users/${userId}`, {
    data,
    method: 'PATCH',
  });
}

/** 软删除用户 */
export function deleteAdminUserApi(userId: number) {
  return requestClient.delete<null>(`/admin/users/${userId}`);
}
