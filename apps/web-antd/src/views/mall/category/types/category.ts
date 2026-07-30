export interface RawNode {
  id: string;
  dictCode: string;
  dictDesc?: string;
  icon: string;
  label: string;
  parentId: string;
  sort?: number;
  children: null | RawNode[];
}

export interface CategoryNode {
  id: string;
  name: string;
  dictCode: string;
  dictDesc: string;
  label: string;
  icon: string;
  parentId: string;
  immediateParentId: null | string;
  sort: number;
  level: number;
  productCount: number;
  createTime: string;
  deletedAt: null | string;
  children?: CategoryNode[];
}
