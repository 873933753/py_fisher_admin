import type {
  ProductBizPayload,
  ProductMediaItem,
  ProductSkuAttributeOption,
  ProductSkuAttributeRow,
  ProductSkuOptionMedia,
  ProductVariationRow,
} from '../types/product';

import type { ProductInfoApi } from '#/api/core/product';

import { inferMediaKindFromUrl } from './mediaKind';
import { createEmptyProductBiz } from './productInitMapper';
import {
  isDisplayablePreviewUrl,
  resolveOssPreviewUrl,
  sanitizeSkuAttributesPreviewUrls,
} from './productMedia';
import {
  computeExcludedVariationSignatures,
  pickVariationPreviewFromSkuAttributes,
  rebuildVariations,
} from './productVariation';

export interface ProductDetailFormMapped {
  biz: ProductBizPayload;
  meta: {
    categoryId: string;
    isHot: boolean;
    isNew: boolean;
    sku: string;
    status: 'off' | 'on';
    title: string;
  };
}

function flag01ToBool(value?: number | string): boolean {
  return String(value ?? '0') === '1';
}

function leafCategoryIdFromDictIds(dictIds?: string): string {
  const parts = (dictIds ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.at(-1) ?? '';
}

function splitCommaList(value?: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function allowBuyCountryToCodes(map?: Record<string, string>): string[] {
  return Object.keys(map ?? {});
}

function resolveShippingFee(
  product: ProductInfoApi.ProductDetail,
): number | undefined {
  if (product.isFreeShipping === 0) return undefined;
  return typeof product.shippingFee === 'number'
    ? product.shippingFee
    : undefined;
}

function mainMediaKindFromPath(path: string): ProductMediaItem['kind'] {
  return inferMediaKindFromUrl(path) ?? 'image';
}

function mapMainMedia(
  product: ProductInfoApi.ProductDetail,
): ProductMediaItem[] {
  const list = product.mainImgList;
  if (list?.length) {
    return list.map((item, index) => {
      const path = item.filePath;
      return {
        kind: mainMediaKindFromPath(path),
        name: path.split('/').pop() ?? path,
        uid: `main-${index}-${path}`,
        url: resolveOssPreviewUrl(item.fileUrl, path) ?? item.fileUrl ?? '',
        ossPath: path,
        uploadStatus: 'done' as const,
      };
    });
  }
  return (product.mainImg ?? []).map((path, index) => ({
    kind: mainMediaKindFromPath(path),
    name: path.split('/').pop() ?? path,
    uid: `main-${index}-${path}`,
    url: resolveOssPreviewUrl(path, path) ?? path,
    ossPath: path,
    uploadStatus: 'done' as const,
  }));
}

function buildSpecValueImageMap(
  specValueImgMap?: ProductInfoApi.SpecValueImgMap,
): Map<string, ProductInfoApi.FilePathItem[]> {
  const map = new Map<string, ProductInfoApi.FilePathItem[]>();
  for (const row of specValueImgMap?.specValueImgList ?? []) {
    if (row.specValueId) {
      map.set(row.specValueId, row.imgPathList ?? []);
    }
  }
  return map;
}

function mapOptionImages(
  files: ProductInfoApi.FilePathItem[],
): ProductSkuOptionMedia[] {
  return files.map((file, index) => {
    const url = resolveOssPreviewUrl(file.fileUrl, file.filePath) ?? '';
    return {
      name: file.filePath.split('/').pop() ?? file.filePath,
      uid: `spec-img-${file.filePath}-${index}`,
      url,
      ossPath: file.filePath,
      uploadStatus: 'done' as const,
    };
  });
}

function mapSkuAttributes(
  specNameValueList: ProductInfoApi.SpecNameValueItem[] | undefined,
  specValueImgMap: ProductInfoApi.SpecValueImgMap | undefined,
): ProductSkuAttributeRow[] {
  const imageByValueId = buildSpecValueImageMap(specValueImgMap);

  return (specNameValueList ?? []).map((spec) => ({
    id: spec.specNameId,
    name: spec.specName,
    options: (spec.values ?? []).map(
      (val): ProductSkuAttributeOption => ({
        id: val.id,
        label: val.value,
        images: mapOptionImages(imageByValueId.get(val.id) ?? []),
      }),
    ),
  }));
}

function mapVariations(
  specSkuMap: ProductInfoApi.SpecSkuMap | undefined,
  skuAttributes: ProductSkuAttributeRow[],
): ProductVariationRow[] {
  const attrNames = skuAttributes.map((r) => r.name.trim()).filter(Boolean);
  const columnNames = (specSkuMap?.columns ?? []).map((c) => c.value.trim());

  return (specSkuMap?.list ?? []).map((row) => {
    const attrs: Record<string, string> = {};
    for (const name of columnNames.length > 0 ? columnNames : attrNames) {
      const val = row[name];
      if (typeof val === 'string' && val.trim()) {
        attrs[name] = val.trim();
      }
    }

    const inherited = pickVariationPreviewFromSkuAttributes(
      skuAttributes,
      attrs,
    );
    const mainPhotoUrl =
      typeof row.mainPhotoUrl === 'string' ? row.mainPhotoUrl.trim() : '';
    const resolvedMainPhoto = resolveOssPreviewUrl(mainPhotoUrl);
    let imageUrls: string[] = [];
    if (inherited) {
      imageUrls = [inherited];
    } else if (
      resolvedMainPhoto &&
      isDisplayablePreviewUrl(resolvedMainPhoto)
    ) {
      imageUrls = [resolvedMainPhoto];
    }

    return {
      id: row.skuId,
      attrs,
      imageUrls,
      imageOverride: false,
      originalPrice:
        typeof row.orgPrice === 'number' ? row.orgPrice : undefined,
      price: typeof row.salePrice === 'number' ? row.salePrice : undefined,
      quantity: typeof row.stock === 'number' ? row.stock : undefined,
      selected: false,
      skuCode: row.skuCode ?? '',
    };
  });
}

/** 详情接口 -> 编辑页 formBiz + formMeta */
export function mapProductDetailToForm(
  detail: ProductInfoApi.GetProductInfoData,
): ProductDetailFormMapped {
  const product = detail.product;
  const empty = createEmptyProductBiz();
  const multiSkuEnabled = product.isMultiAttr === 1;
  const skuAttributes = multiSkuEnabled
    ? mapSkuAttributes(detail.specNameValueList, detail.specValueImgMap)
    : [];
  if (multiSkuEnabled) {
    sanitizeSkuAttributesPreviewUrls(skuAttributes);
  }
  const loadedVariations = multiSkuEnabled
    ? mapVariations(detail.specSkuMap, skuAttributes)
    : [];
  const excludedVariationSignatures = multiSkuEnabled
    ? computeExcludedVariationSignatures(skuAttributes, loadedVariations)
    : [];
  const variations = multiSkuEnabled
    ? rebuildVariations(
        skuAttributes,
        loadedVariations,
        excludedVariationSignatures,
      )
    : [];

  const firstSkuCode = variations[0]?.skuCode ?? '';

  return {
    meta: {
      title: product.productName ?? '',
      categoryId: leafCategoryIdFromDictIds(product.dictIds),
      sku: firstSkuCode,
      status: 'on',
      isHot: flag01ToBool(product.isHot),
      isNew: flag01ToBool(product.isNew),
    },
    biz: {
      ...empty,
      mediaItems: mapMainMedia(product),
      subtitle: product.productSubtitle ?? '',
      descriptionRich: product.detailContent ?? '',
      multiSkuEnabled,
      skuAttributes,
      variations,
      excludedVariationSignatures,
      discountEnabled: product.isVolumePricing === 1,
      volumePricingList: (product.volumePricing ?? []).map((row) => ({
        min: row.min,
        discount: row.discount,
        label: row.label,
      })),
      shippingFree: product.isFreeShipping === 0,
      shippingFee: resolveShippingFee(product),
      returnsAllowed: product.isNoReasonReturn === 0,
      returnWithinDays:
        typeof product.returnDays === 'number' ? product.returnDays : undefined,
      returnPolicy: product.returnDesc ?? '',
      shippingAddrsList: splitCommaList(product.shippingAddress),
      handlingTimeList: product.handlingTime ? [product.handlingTime] : [],
      deliveryDesc: product.deliveryDesc ?? '',
      allowPurchaseAddrsList: allowBuyCountryToCodes(product.allowBuyCountry),
      productParam: product.productParam ? { ...product.productParam } : {},
      singleSku: {
        orgPrice:
          typeof product.orgPrice === 'number' ? product.orgPrice : undefined,
        salePrice:
          typeof product.salePrice === 'number' ? product.salePrice : undefined,
        stock: typeof product.stock === 'number' ? product.stock : undefined,
      },
    },
  };
}
