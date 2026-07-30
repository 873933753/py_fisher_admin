import type { InjectionKey, Ref } from 'vue';

import type { ProductBizPayload, VolumePricingRow } from './types/product';

/** 商品编辑页 `form/index.vue` 提供，子组件可安全变更业务载荷（非 prop） */
export const mallProductFormBizKey: InjectionKey<Ref<ProductBizPayload>> =
  Symbol('mallProductFormBiz');

/** 列表元字段（标题、分类、SKU、上下架），与 biz 分离持久化 */
export interface MallProductFormMeta {
  categoryId: string;
  /** 是否热门（接口 0/1 字符串，表单用布尔） */
  isHot: boolean;
  /** 是否新品（接口 0/1 字符串，表单用布尔） */
  isNew: boolean;
  sku: string;
  status: 'off' | 'on';
  title: string;
}

export const mallProductFormMetaKey: InjectionKey<MallProductFormMeta> = Symbol(
  'mallProductFormMeta',
);

/** 由 initProductInfo 提供的下拉选项（新增/编辑共用） */
export interface ProductFormOptions {
  handlingTimeOptions: string[];
  shippingAddrsOptions: string[];
  allowBuyCountryMap: Record<string, string>;
  allowBuyCountryOptions: Array<{ label: string; value: string }>;
  returnDaysOptions: number[];
  /** initProductInfo.initVolumePricingList，勾选后写入 biz.volumePricingList */
  volumePricingOptions: VolumePricingRow[];
}

export const mallProductFormOptionsKey: InjectionKey<Ref<ProductFormOptions>> =
  Symbol('mallProductFormOptions');
