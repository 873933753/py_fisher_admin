import { requestClient } from '#/api/request';

export namespace SysDictApi {
  /** 球衣分类树节点（/sysDict/findJerseyTypeTree） */
  export interface JerseyTypeTreeNode {
    id: string;
    dictCode: string;
    dictDesc?: string;
    icon: string;
    label: string;
    parentId: string;
    sort?: number;
    children: JerseyTypeTreeNode[] | null;
  }

  /** 新增/修改分类（multipart/form-data） */
  export interface SaveOrUpdParams {
    file?: File;
    dictCode: string;
    dictName: string;
    sort: string;
    /** 修改时传 id，新增不传 */
    id?: string;
    /** 根目录传 0 */
    parentId: string;
    dictDesc: string;
    createdAt: string;
    updatedAt: string;
  }
}

/** 获取球衣分类树 */
export function findJerseyTypeTreeApi() {
  return requestClient.get<SysDictApi.JerseyTypeTreeNode[]>(
    '/sysDict/findJerseyTypeTree',
  );
}

/** 按 id 删除分类 */
export function delSysDictByIdApi(id: string) {
  return requestClient.get<unknown>('/sysDict/delById', {
    params: { id },
  });
}

/** 新增或修改分类 */
export function saveOrUpdSysDictApi(params: SysDictApi.SaveOrUpdParams) {
  const { file, ...fields } = params;
  const body: Record<string, File | string> = { ...fields };
  if (file) {
    body.file = file;
  }
  return requestClient.upload<unknown>(
    '/sysDict/saveOrUpd',
    body as Record<string, File | string> & { file: File },
  );
}
