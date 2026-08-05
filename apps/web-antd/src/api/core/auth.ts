import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 管理员信息 */
  export interface AdminInfo {
    id: number;
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
    refreshToken: string;
    userInfo: UserInfo;
  }

  /** /admin/login 返回的 data */
  export interface AdminLoginData {
    refreshToken: string;
    token: string;
    userInfo: AdminInfo;
  }

  /** /admin/refresh 返回的 data */
  export interface AdminRefreshData {
    refreshToken: string;
    token: string;
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
    refreshToken: response.refreshToken,
    userInfo: mapAdminInfoToUserInfo(response.userInfo, response.token),
  } satisfies AuthApi.LoginResult;
}

/**
 * 刷新访问令牌
 */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post<AuthApi.AdminRefreshData>('/admin/refresh', {
    refreshToken,
  });
}

/**
 * 退出登录
 */
export async function logoutApi(
  accessToken: string,
  refreshToken?: null | string,
) {
  return baseRequestClient.post<Record<string, never>>(
    '/admin/logout',
    refreshToken ? { refreshToken } : {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

/**
 * 获取当前管理员信息
 */
export async function getAdminProfileApi() {
  return requestClient.get<AuthApi.AdminInfo>('/admin/profile');
}
