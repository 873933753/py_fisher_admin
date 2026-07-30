import type { ProductFormOptions } from '../injectionKeys';
import type { ProductBizPayload } from '../types/product';

import type { ProductInitApi } from '#/api/core/product';

/** 表单空壳（由 init 或详情接口填充） */
export function createEmptyProductBiz(): ProductBizPayload {
  return {
    mediaItems: [],
    subtitle: '',
    descriptionRich: '',
    multiSkuEnabled: false,
    skuAttributes: [],
    variations: [],
    excludedVariationSignatures: [],
    discountEnabled: true,
    shippingFree: true,
    shippingFee: undefined,
    returnsAllowed: true,
    returnWithinDays: undefined,
    productParam: {},
    volumePricingList: [],
    handlingTimeList: [],
    shippingAddrsList: [],
    allowPurchaseAddrsList: [],
    returnPolicy: '',
    deliveryDesc: '',
    singleSku: {},
  };
}

export function createEmptyProductFormOptions(): ProductFormOptions {
  return {
    handlingTimeOptions: [],
    shippingAddrsOptions: [],
    allowBuyCountryMap: {},
    allowBuyCountryOptions: [],
    returnDaysOptions: [],
    volumePricingOptions: [],
  };
}

export function mapInitToFormOptions(
  init: ProductInitApi.InitProductInfoData,
): ProductFormOptions {
  const allowBuyCountryOptions = Object.entries(
    init.allowBuyCountryMap ?? {},
  ).map(([code, label]) => ({ label, value: code }));

  return {
    handlingTimeOptions: [...(init.initHandlingTimeList ?? [])],
    shippingAddrsOptions: [...(init.initShippingAddrsList ?? [])],
    allowBuyCountryMap: { ...init.allowBuyCountryMap },
    allowBuyCountryOptions,
    returnDaysOptions: [...(init.initReturnsAllowedDayList ?? [])],
    volumePricingOptions: (init.initVolumePricingList ?? []).map((row) => ({
      min: row.min,
      discount: row.discount,
      label: row.label,
    })),
  };
}

/** 新增模式：将 init 默认值写入 formBiz */
export function mapInitToAddBiz(
  init: ProductInitApi.InitProductInfoData,
): ProductBizPayload {
  const empty = createEmptyProductBiz();
  const firstHandling = init.initHandlingTimeList?.[0];
  const firstReturnDay = init.initReturnsAllowedDayList?.[0];

  return {
    ...empty,
    productParam: { ...init.initProductParamList },
    handlingTimeList: firstHandling ? [firstHandling] : [],
    returnPolicy: init.initReturnPolicy ?? '',
    deliveryDesc: init.initDeliveryDesc ?? '',
    returnWithinDays:
      typeof firstReturnDay === 'number' ? firstReturnDay : undefined,
    shippingAddrsList: [...(init.initShippingAddrsList ?? [])],
    allowPurchaseAddrsList: Object.keys(init.allowBuyCountryMap ?? {}),
  };
}
