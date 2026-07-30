import { requestClient } from '#/api/request';

export namespace SysHomeFeedApi {
  export interface BannerFileItem {
    filePath: string;
    fileUrl?: string;
    jumpType: string;
    jumpValue: string;
    jumpTypeName?: string;
    jumpValueName?: string;
  }

  export interface FindPageParams {
    current?: number;
    size?: number;
    title?: string;
  }

  export interface HomeFeedRecord {
    id: string;
    title: string;
    feedType: string;
    feedTypeName: string;
    sortNum: number;
    limitNum?: number;
    bannerFile: BannerFileItem[] | null;
    productIds?: null | string;
    dictIds?: null | string;
    dictNames?: string;
    /** 是否轮播，仅广告图：0=否，1=是（接口可能为 number 或 string） */
    isScroll?: null | number | string;
    createTime: string;
  }

  export interface FindPageResult {
    current: string;
    pages: string;
    size: string;
    total: string;
    records: HomeFeedRecord[];
  }

  export interface SaveOrUpdBody {
    id?: string;
    title: string;
    feedType: string;
    sortNum: number;
    limitNum?: number;
    bannerFile?: BannerFileItem[];
    productIds?: string;
    /** 是否轮播，仅广告图必填：0=否，1=是 */
    isScroll?: string;
  }

  export interface HomepageHierarchyData {
    homepageHierarchyMap: Record<string, string>;
    jumpMap: Record<string, string>;
  }
}

/** 首页配置分页列表 */
export function findPageSysHomeFeedApi(params: SysHomeFeedApi.FindPageParams) {
  return requestClient.post<SysHomeFeedApi.FindPageResult>(
    '/sysHomeFeed/findPage',
    params,
  );
}

/** 新增或修改首页配置 */
export function saveOrUpdSysHomeFeedApi(data: SysHomeFeedApi.SaveOrUpdBody) {
  return requestClient.post<unknown>('/sysHomeFeed/saveOrUpd', data);
}

/** 删除首页配置 */
export function deleteSysHomeFeedApi(id: string) {
  return requestClient.get<unknown>('/sysHomeFeed/delete', {
    params: { id },
  });
}

/** 首页层级与跳转类型字典 */
export function getHomepageHierarchyApi() {
  return requestClient.get<SysHomeFeedApi.HomepageHierarchyData>(
    '/sysHomeFeed/homepageHierarchy',
  );
}
