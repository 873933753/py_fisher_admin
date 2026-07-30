import { requestClient } from '#/api/request';

export namespace SysUserApi {
  export interface RandomUserRecord {
    avatar?: string;
    email?: string;
    id: string;
    nickName?: string;
    [property: string]: unknown;
  }
}

/** 随机虚拟用户（商品添加评论） */
export function randomSysUserApi() {
  return requestClient.get<SysUserApi.RandomUserRecord>('/sysUser/randomUser');
}
