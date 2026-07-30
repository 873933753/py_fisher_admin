/** oss：选图后立即上传 OSS；admin-image：管理端图片上传；defer-file：仅本地暂存 File，由父级随表单 multipart 提交 */
export type MallSingleImageUploadMode = 'admin-image' | 'defer-file' | 'oss';
