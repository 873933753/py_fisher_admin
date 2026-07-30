export type WhatsappFileUploadStatus = 'done' | 'error' | 'uploading';

export interface WhatsappFileItem {
  uid: string;
  name: string;
  /** 预览地址（完整 URL 或 blob） */
  previewUrl: string;
  /** 保存用相对路径，如 /aaa.jpg */
  ossPath: string;
  uploadStatus: WhatsappFileUploadStatus;
  file?: File;
}

export interface AboutUsFormState {
  title: string;
  content: string;
  /** 每行一个邮箱，保存时拼成接口 email 字段 */
  emails: string[];
  endPage: string;
  whatsappFiles: WhatsappFileItem[];
}
