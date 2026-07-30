import type { ProductBizPayload } from '../types/product';

import type { ProductSaveApi } from '#/api/core/product';

import {
  getMainImgUrlsForSave,
  getSkuOptionImgPathsForSave,
} from './productMedia';

function newTempId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `t_${crypto.randomUUID()}`
    : `t_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function boolTo01(v: boolean): number {
  return v ? 1 : 0;
}

function boolTo01Str(v: boolean): string {
  return v ? '1' : '0';
}

function numOr0(n: number | undefined): number {
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

export function buildAllowBuyCountry(
  codes: string[],
  map: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const code of codes) {
    const label = map[code];
    if (label) out[code] = label;
  }
  return out;
}

export interface AssembleProductSaveParams {
  formMeta: {
    isHot: boolean;
    isNew: boolean;
    title: string;
  };
  /** 三级分类 id 路径，保存时 join 为 dictIds */
  dictCategoryPath: string[];
  biz: ProductBizPayload;
  allowBuyCountryMap: Record<string, string>;
  /** 编辑时传入，写入 product.id */
  productId?: null | string;
}

/**
 * 表单状态 -> /product/saveOrUpd 请求体
 */
export function assembleProductSaveOrUpdBody(
  params: AssembleProductSaveParams,
): ProductSaveApi.SaveOrUpdBody {
  const { formMeta, biz, productId, dictCategoryPath, allowBuyCountryMap } =
    params;

  const multi = biz.multiSkuEnabled;

  const specList: ProductSaveApi.SpecListItem[] = [];
  const specImages: ProductSaveApi.SpecImageItem[] = [];
  const skuList: ProductSaveApi.SkuListItem[] = [];

  if (multi) {
    const valueKeyToTempId = new Map<string, string>();

    for (const row of biz.skuAttributes) {
      const specName = row.name.trim();
      if (!specName) continue;

      const values: ProductSaveApi.SpecValueItem[] = [];
      let isShowImg = 0;

      for (const opt of row.options) {
        const specValue = opt.label.trim();
        if (!specValue) continue;
        const tempId = newTempId();
        valueKeyToTempId.set(`${specName}::${specValue}`, tempId);
        values.push({ specValue, tempId });
        if (getSkuOptionImgPathsForSave(opt.images).length > 0) isShowImg = 1;
      }

      if (values.length === 0) continue;

      specList.push({
        specName,
        isShowImg,
        values,
      });

      for (const opt of row.options) {
        const specValue = opt.label.trim();
        const imgPaths = getSkuOptionImgPathsForSave(opt.images);
        if (!specValue || imgPaths.length === 0) continue;
        const tid = valueKeyToTempId.get(`${specName}::${specValue}`);
        if (!tid) continue;
        specImages.push({
          tempId: tid,
          imgPath: imgPaths,
        });
      }
    }

    for (const v of biz.variations) {
      const tempValueIds: string[] = [];
      let ok = true;
      for (const row of biz.skuAttributes) {
        const specName = row.name.trim();
        if (!specName) continue;
        const label = (v.attrs[specName] ?? '').trim();
        if (!label) {
          ok = false;
          break;
        }
        const tid = valueKeyToTempId.get(`${specName}::${label}`);
        if (!tid) {
          ok = false;
          break;
        }
        tempValueIds.push(tid);
      }
      if (!ok || tempValueIds.length === 0) continue;

      skuList.push({
        tempValueIds,
        salePrice: numOr0(v.price),
        orgPrice: numOr0(v.originalPrice),
        stock: numOr0(v.quantity),
        skuCode: v.skuCode?.trim() ?? '',
      });
    }
  }

  const orgPrice = numOr0(biz.singleSku.orgPrice);
  const salePrice = numOr0(biz.singleSku.salePrice);
  const stock = numOr0(biz.singleSku.stock);

  const mainImg = getMainImgUrlsForSave(biz.mediaItems);
  const dictIds = dictCategoryPath.join(',');

  const product: ProductSaveApi.ProductPayload = {
    ...(productId ? { id: productId } : {}),
    productName: formMeta.title.trim(),
    productSubtitle: biz.subtitle.trim(),
    dictIds,
    orgPrice,
    salePrice,
    stock,
    detailContent: biz.descriptionRich,
    unit: '个',
    sort: 0,
    isMultiAttr: boolTo01(multi),
    isHot: boolTo01Str(formMeta.isHot),
    isNew: boolTo01Str(formMeta.isNew),
    mainImg,
    /** 0=无折扣 1=有折扣；与 UI「是否有折扣」开/关同向，勿与 isFreeShipping 取反写法混用 */
    isVolumePricing: biz.discountEnabled ? 1 : 0,
    volumePricing: biz.discountEnabled
      ? biz.volumePricingList.map((x) => ({
          min: x.min,
          discount: x.discount,
          label: x.label,
        }))
      : [],
    isFreeShipping: biz.shippingFree ? 0 : 1,
    ...(biz.shippingFree ? {} : { shippingFee: numOr0(biz.shippingFee) }),
    isNoReasonReturn: biz.returnsAllowed ? 0 : 1,
    returnDays: numOr0(biz.returnWithinDays),
    returnDesc: biz.returnPolicy,
    shippingAddress: biz.shippingAddrsList.join(', '),
    handlingTime: biz.handlingTimeList[0] ?? '',
    deliveryDesc: biz.deliveryDesc,
    allowBuyCountry: buildAllowBuyCountry(
      biz.allowPurchaseAddrsList,
      allowBuyCountryMap,
    ),
    productParam: { ...biz.productParam },
  };

  return {
    product,
    specList: multi ? specList : [],
    skuList: multi ? skuList : [],
    specImages: multi ? specImages : [],
  };
}
