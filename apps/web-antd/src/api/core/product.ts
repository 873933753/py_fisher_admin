import { requestClient } from '#/api/request';

export namespace ProductInitApi {
  export interface VolumePricingItem {
    discount: number;
    label: string;
    min: number;
  }

  export interface InitProductInfoData {
    initProductParamList: Record<string, string>;
    initVolumePricingList: VolumePricingItem[];
    initHandlingTimeList: string[];
    initReturnsAllowedDayList: number[];
    initShippingAddrsList: string[];
    allowBuyCountryMap: Record<string, string>;
    initReturnPolicy: string;
    initDeliveryDesc: string;
  }
}

export namespace ProductFindPageApi {
  export interface VolumePricingItem {
    discount: number;
    label: string;
    min: number;
  }

  export interface FindPageParams {
    current?: number;
    size?: number;
    /** 分类 dictId */
    dictId?: string;
    /** 商品名称关键词 */
    productName?: string;
  }

  export interface ProductRecord {
    id: string;
    productName: string;
    productSubtitle: string;
    mainImg: string;
    salePrice: string;
    orgPrice: number;
    stock: number;
    /** 销售量 */
    salesVolume: number;
    /** 近30天收藏量 */
    followCount30Days: number;
    /** 近30天浏览量 */
    browseCount30Days: number;
    /** 是否热门：0否 1是 */
    isHot: string;
    /** 是否新品：0否 1是 */
    isNew: string;
    isMultiAttr: number;
    isVolumePricing: number;
    volumePricing: VolumePricingItem[];
    /** 邮件已读状态：0=未读，1=已读 */
    mailIsRead?: number;
  }

  export interface FindPageResult {
    current: string;
    pages: string;
    size: string;
    total: string;
    records: ProductRecord[];
  }
}
/* 商品详情 */
export namespace ProductInfoApi {
  export interface FilePathItem {
    filePath: string;
    fileUrl: string;
  }

  export interface VolumePricingItem {
    discount: number;
    label: string;
    min: number;
  }

  export interface ProductDetail {
    allowBuyCountry?: Record<string, string>;
    createTime?: string;
    createUserId?: string;
    deliveryDesc?: string;
    detailContent?: string;
    dictIds?: string;
    handlingTime?: string;
    id?: string;
    isDel?: number;
    isFreeShipping?: number;
    /** 是否热门：0否 1是 */
    isHot?: string;
    isMultiAttr?: number;
    /** 是否新品：0否 1是 */
    isNew?: string;
    isNoReasonReturn?: number;
    isVolumePricing?: number;
    mainImg?: string[];
    mainImgList?: FilePathItem[];
    orgPrice?: number;
    productName?: string;
    productParam?: Record<string, string>;
    productSubtitle?: string;
    returnDays?: number;
    returnDesc?: string;
    salePrice?: number;
    shippingAddress?: string;
    shippingFee?: number;
    sort?: number;
    stock?: number;
    unit?: string;
    volumePricing?: VolumePricingItem[];
  }

  export interface SpecValueItem {
    id: string;
    value: string;
  }

  export interface SpecNameValueItem {
    specName: string;
    specNameId: string;
    values: SpecValueItem[];
  }

  export interface SpecValueImgRow {
    imgPath?: string[];
    imgPathList?: FilePathItem[];
    photoCount?: number;
    specName?: string;
    specNameId?: string;
    specValue?: string;
    specValueId: string;
  }

  export interface SpecValueImgMap {
    specName?: { id: string; value: string };
    specValueImgList?: SpecValueImgRow[];
  }

  export interface SpecSkuColumn {
    id: string;
    value: string;
  }

  export interface SpecSkuRow {
    skuId: string;
    skuCode?: string;
    stock?: number;
    salePrice?: number;
    orgPrice?: number;
    mainPhoto?: string;
    mainPhotoUrl?: string;
    [specName: string]: number | string | undefined;
  }

  export interface SpecSkuMap {
    columns?: SpecSkuColumn[];
    list?: SpecSkuRow[];
  }

  export interface GetProductInfoData {
    product: ProductDetail;
    specNameValueList?: SpecNameValueItem[];
    specValueImgMap?: SpecValueImgMap;
    specSkuMap?: SpecSkuMap;
  }
}

export namespace ProductSaveApi {
  export interface VolumePricingItem {
    discount: number;
    label: string;
    min: number;
  }

  export interface ProductPayload {
    /** 编辑时携带后台主键；新增不传 */
    id?: string;
    productName: string;
    productSubtitle: string;
    /** 三级分类 id，逗号分隔 */
    dictIds: string;
    orgPrice: number;
    salePrice: number;
    stock: number;
    detailContent: string;
    unit: string;
    sort: number;
    isMultiAttr: number;
    /** 是否热门：0否 1是 */
    isHot: string;
    /** 是否新品：0否 1是 */
    isNew: string;
    mainImg: string[];
    isVolumePricing: number;
    volumePricing: VolumePricingItem[];
    isFreeShipping: number;
    /** 不包邮（isFreeShipping=1）时填写 */
    shippingFee?: number;
    isNoReasonReturn: number;
    returnDays: number;
    returnDesc: string;
    shippingAddress: string;
    handlingTime: string;
    deliveryDesc: string;
    allowBuyCountry: Record<string, string>;
    productParam: Record<string, string>;
  }

  export interface SpecValueItem {
    specValue: string;
    tempId: string;
  }

  export interface SpecListItem {
    specName: string;
    isShowImg: number;
    values: SpecValueItem[];
  }

  export interface SkuListItem {
    tempValueIds: string[];
    salePrice: number;
    orgPrice: number;
    stock: number;
    skuCode: string;
  }

  export interface SpecImageItem {
    tempId: string;
    imgPath: string[];
  }

  export interface SaveOrUpdBody {
    product: ProductPayload;
    specList: SpecListItem[];
    skuList: SkuListItem[];
    specImages: SpecImageItem[];
  }
}

/** 新增/编辑页：商品表单初始化配置（选项与默认值） */
export function initProductInfoApi() {
  return requestClient.get<ProductInitApi.InitProductInfoData>(
    '/product/initProductInfo',
  );
}

function isProductDetailPayload(
  value: unknown,
): value is ProductInfoApi.GetProductInfoData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'product' in value &&
    typeof (value as ProductInfoApi.GetProductInfoData).product === 'object'
  );
}

/**
 * 详情接口业务 code 与全局约定不一致，不走默认 code 校验。
 * 支持 { data: { product, ... } } 或根节点直接返回详情结构。
 */
function normalizeProductDetailBody(
  body: unknown,
): ProductInfoApi.GetProductInfoData {
  if (isProductDetailPayload(body)) {
    return body;
  }

  if (typeof body === 'object' && body !== null && 'data' in body) {
    const nested = (body as { data?: unknown }).data;
    if (isProductDetailPayload(nested)) {
      return nested;
    }
  }

  const message =
    typeof body === 'object' && body !== null
      ? String(
          (body as { message?: string; msg?: string }).message ??
            (body as { msg?: string }).msg ??
            '',
        ).trim()
      : '';
  throw new Error(message || '商品详情数据格式异常');
}

/** 商品详情（编辑页回显） */
export async function getProductInfoApi(id: string) {
  const body = await requestClient.get<unknown>('/product/getProductInfo', {
    params: { id },
    responseReturn: 'body',
  });
  return normalizeProductDetailBody(body);
}

/** 商品分页列表 */
export function findPageProductApi(params: ProductFindPageApi.FindPageParams) {
  return requestClient.post<ProductFindPageApi.FindPageResult>(
    '/product/findPage',
    params,
  );
}

/** 删除商品 */
export function delProductApi(id: string) {
  return requestClient.get<unknown>('/product/delProd', {
    params: { id },
  });
}

/**
 * 商品新增/修改
 * 请求头 x-auth-token 由 request 拦截器统一附加
 */
export function saveOrUpdProductApi(data: ProductSaveApi.SaveOrUpdBody) {
  return requestClient.post<unknown>('/product/saveOrUpd', data);
}
