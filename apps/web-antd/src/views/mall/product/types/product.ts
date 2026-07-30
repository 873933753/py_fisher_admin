/** 与新增/编辑商品接口一致的业务载荷（对应 data.ts 中 data 字段） */
export interface VolumePricingRow {
  discount: number;
  label: string;
  min: number;
}

export type ProductMediaUploadStatus = 'done' | 'error' | 'uploading';

/** 商品级图片 / 视频素材（上传前 url 为 blob:，成功后 url 为完整 fileUrl 用于预览） */
export interface ProductMediaItem {
  kind: 'image' | 'video';
  name: string;
  uid: string;
  /** 预览：上传成功后为完整 fileUrl；上传中为 blob: */
  url: string;
  /** 保存 mainImg（图片/视频）：上传成功后的 ossPath，不含域名 */
  ossPath?: string;
  uploadStatus: ProductMediaUploadStatus;
  /** 上传失败时保留，用于重试 */
  file?: File;
}

/**
 * SKU 属性「选项」的图片项
 */
export interface ProductSkuOptionMedia {
  name: string;
  uid: string;
  /** 预览：上传成功后为完整 fileUrl；上传中为 blob: */
  url: string;
  /** 保存 specImages.imgPath：上传成功后的 ossPath，不含域名 */
  ossPath?: string;
  uploadStatus?: ProductMediaUploadStatus;
  /** 上传失败时保留，用于重试 */
  file?: File;
}

/**
 * SKU 属性下的「单个选项」
 */
export interface ProductSkuAttributeOption {
  id: string;
  /** 可见的选项名*/
  label: string;
  /** 该选项的图集，最多 12 张；为空表示该选项不挂图 */
  images: ProductSkuOptionMedia[];
}

/** 多规格维度：一个属性名 + 多个选项，用于笛卡尔积生成 SKU 行 */
export interface ProductSkuAttributeRow {
  id: string;
  name: string;
  options: ProductSkuAttributeOption[];
}

/** 变体组合表中的一行 */
export interface ProductVariationRow {
  /** 各属性维度取值，键为属性名 */
  attrs: Record<string, string>;
  id: string;
  /**
   * 主图
   */
  imageUrls: string[];
  /**
   * 是否在变体组合表里手动改过本行主图（非详情 mainPhotoUrl、非选项图继承）。
   * true 时 rebuildVariations 保留 imageUrls，不再跟选项图同步。
   */
  imageOverride?: boolean;
  originalPrice?: number;
  price?: number;
  quantity?: number;
  selected: boolean;
  skuCode: string;
}

/** 单规格（无多属性）时写入 product 层的价库 */
export interface ProductSingleSkuPricing {
  orgPrice?: number;
  salePrice?: number;
  stock?: number;
}

export interface ProductBizPayload {
  allowPurchaseAddrsList: string[];
  deliveryDesc: string;
  /** 是否启用量价阶梯（关则仍可保留列表数据但不展示） */
  discountEnabled: boolean;
  /** 描述：预留富文本 HTML；当前可用多行文本代替编辑器 */
  descriptionRich: string;
  handlingTimeList: string[];
  mediaItems: ProductMediaItem[];
  /** 是否多属性（对应后台 isMultiAttr：0 否 / 1 是） */
  multiSkuEnabled: boolean;
  productParam: Record<string, string>;
  returnPolicy: string;
  /** 是否允许退货（与退货天数联动显示） */
  returnsAllowed: boolean;
  /** 允许退货时的天数 */
  returnWithinDays?: number;
  shippingAddrsList: string[];
  /** 非包邮时的运费金额 */
  shippingFee?: number;
  /** 是否包邮 */
  shippingFree: boolean;
  /** 商品层价库 */
  singleSku: ProductSingleSkuPricing;
  skuAttributes: ProductSkuAttributeRow[];
  subtitle: string;
  variations: ProductVariationRow[];
  /**
   * 变体组合表里用户主动删除的组合签名（variationSignature），
   * rebuild 时不再自动补回；新增属性选项产生的新组合不受影响。
   */
  excludedVariationSignatures: string[];
  volumePricingList: VolumePricingRow[];
}

export interface ProductListItem {
  biz: ProductBizPayload;
  categoryId: string;
  categoryName: string;
  id: string;
  sku: string;
  status: 'off' | 'on';
  title: string;
}

/** 列表筛选用：展平分类选项 */
export interface ProductCategoryOption {
  label: string;
  value: string;
}
