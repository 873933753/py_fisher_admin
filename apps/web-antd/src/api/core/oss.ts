import { requestClient } from '#/api/request';

export namespace OssApi {
  export interface UploadFileResult {
    fileName: string;
    fileUrl: string;
    fileExt: string;
    ossPath: string;
  }
}

/** OSS 单文件上传 */
export function uploadOssFileApi(file: File) {
  return requestClient.upload<OssApi.UploadFileResult>('/oss/uploadFile', {
    file,
  });
}
