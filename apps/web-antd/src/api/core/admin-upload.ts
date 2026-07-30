import { requestClient } from '#/api/request';

export namespace AdminUploadApi {
  export type ImageUploadPrefix = 'avatars' | 'products' | 'uploads';

  export interface ImageUploadResult {
    url: string;
  }
}

/** 上传图片到 OSS */
export function uploadAdminImageApi(
  file: File,
  prefix: AdminUploadApi.ImageUploadPrefix = 'avatars',
) {
  return requestClient.upload<AdminUploadApi.ImageUploadResult>(
    '/admin/uploads/image',
    { file },
    { params: { prefix } },
  );
}
