import { requestClient } from '#/api/request';

export namespace CouponTemplateApi {
  export interface CouponTemplateRecord {
    id: string;
    title: string;
    discountPercentage: number;
    isDefault: number;
  }

  export interface SaveOrUpdBody {
    id?: string;
    title: string;
    discountPercentage: number;
    isDefault: number;
  }
}

/** 优惠券列表（无分页） */
export function findListCouponTemplateApi() {
  return requestClient.get<CouponTemplateApi.CouponTemplateRecord[]>(
    '/couponTemplate/findList',
  );
}

/** 新增或修改优惠券 */
export function saveOrUpdCouponTemplateApi(
  data: CouponTemplateApi.SaveOrUpdBody,
) {
  return requestClient.post<unknown>('/couponTemplate/saveOrUpd', data);
}

/** 删除优惠券 */
export function deleteCouponTemplateApi(id: string) {
  return requestClient.get<unknown>('/couponTemplate/delete', {
    params: { id },
  });
}

/** 设置默认优惠券 */
export function setDefaultCouponTemplateApi(id: string) {
  return requestClient.get<unknown>('/couponTemplate/setDefault', {
    params: { id },
  });
}
