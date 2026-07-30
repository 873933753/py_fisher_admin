import { requestClient } from '#/api/request';

export namespace LogisticsApi {
  export interface UploadTrackingNoParams {
    orderId: string;
    logistics: string;
    trackingNo?: string;
    waybillNo?: string;
    logisticsTracesId?: string;
  }

  export interface FindTrackingNoResult {
    logistics: string;
    logisticsTracesId: string;
    orderId: string;
    trackingNo?: null | string;
    waybillNo?: null | string;
  }
}

/** 获取支持的物流公司列表 */
export function getLogisticsApi() {
  return requestClient.get<string[]>('/logisticsTraces/getLogistics');
}

/** 上传物流单号 */
export function uploadTrackingNoApi(data: LogisticsApi.UploadTrackingNoParams) {
  return requestClient.post('/logisticsTraces/uploadTrackingNo', data);
}

/** 根据物流轨迹 ID 查询物流单号 */
export function findTrackingNoApi(logisticsTracesId: string) {
  return requestClient.get<LogisticsApi.FindTrackingNoResult>(
    '/logisticsTraces/findTrackingNo',
    {
      params: { logisticsTracesId },
    },
  );
}
