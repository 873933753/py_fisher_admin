export interface BannerFileFormItem {
  filePath: string;
  fileUrl?: string;
  jumpType: string;
  jumpValue: string;
  /** 跳转类目叶子 id 列表，提交时 join 为 jumpValue */
  jumpCategoryIds: string[];
  /** 多选 Cascader 路径，每条为 [一级, 二级, 三级] */
  jumpCategoryPaths: string[][];
}

export interface PickedProduct {
  id: string;
  productName: string;
  mainImg: string;
  categoryLabel: string;
}

export interface BannerFormState {
  id?: string;
  title: string;
  feedType: string;
  sortNum: number;
  /** 是否轮播，仅广告图：0=否，1=是 */
  isScroll: string;
  bannerFile: BannerFileFormItem[];
  productIds: string;
  pickedProducts: PickedProduct[];
}
