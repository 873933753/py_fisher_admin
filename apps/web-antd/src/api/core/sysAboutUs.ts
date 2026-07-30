import { requestClient } from '#/api/request';

export namespace SysAboutUsApi {
  export interface AboutUsInfo {
    id?: string;
    title: string;
    content: string;
    email: string;
    endPage: string;
    whatsappFiles: string[];
    createTime?: string;
    updateTime?: string;
    createUserId?: string;
    updateUserId?: string;
    isDel?: number;
  }

  export interface SaveOrUpdBody {
    title: string;
    content: string;
    email: string;
    endPage: string;
    whatsappFiles: string[];
  }
}

/** 查询关于我们配置 */
export function findAboutUsInfoApi() {
  return requestClient.get<null | SysAboutUsApi.AboutUsInfo>(
    '/sysAboutUs/findInfo',
  );
}

/** 新增或修改关于我们配置 */
export function saveOrUpdAboutUsApi(data: SysAboutUsApi.SaveOrUpdBody) {
  return requestClient.post<unknown>('/sysAboutUs/saveOrUpd', data);
}
