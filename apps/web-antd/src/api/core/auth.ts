import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 管理员信息 */
  export interface AdminInfo {
    id: number;
    permissions: string[];
    phone_number: string;
    role: string;
  }

  /** 登录接口参数 */
  export interface LoginParams {
    password: string;
    phone_number: string;
  }

  /** 登录接口返回值（适配 Vben） */
  export interface LoginResult {
    accessToken: string;
    adminInfo: AdminInfo;
    userInfo: UserInfo;
  }

  /** /admin/login 返回的 data */
  export interface AdminLoginData {
    token: string;
    userInfo: AdminInfo;
  }
}

export function mapAdminInfoToUserInfo(
  admin: AuthApi.AdminInfo,
  token: string,
): UserInfo {
  return {
    avatar: '',
    desc: '',
    homePath: preferences.app.defaultHomePath,
    realName: admin.phone_number,
    roles: admin.role ? [admin.role] : [],
    token,
    userId: String(admin.id),
    username: '',
  };
}

/**
 * 管理员登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const response = await requestClient.post<AuthApi.AdminLoginData>(
    '/admin/login',
    {
      password: data.password,
      phone_number: data.phone_number,
    },
  );

  return {
    accessToken: response.token,
    adminInfo: response.userInfo,
    userInfo: mapAdminInfoToUserInfo(response.userInfo, response.token),
  } satisfies AuthApi.LoginResult;
}

/**
 * 获取当前管理员信息
 */
export async function getAdminProfileApi() {
  return requestClient.get<AuthApi.AdminInfo>('/admin/profile');
}
