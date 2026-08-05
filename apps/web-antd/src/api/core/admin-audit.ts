import { requestClient } from '#/api/request';

export namespace AdminAuditApi {
  export interface ListItem {
    action: string;
    create_time: number;
    error_message: string | null;
    id: number;
    ip: string | null;
    method: string | null;
    module: string;
    operator_id: number | null;
    operator_name: string | null;
    operator_role: string | null;
    path: string | null;
    resource_id: string | null;
    resource_type: string | null;
    success: boolean;
  }

  export interface Detail extends ListItem {
    after_summary: string | null;
    before_summary: string | null;
    request_summary: string | null;
    user_agent: string | null;
  }

  export interface ListParams {
    action?: string;
    end_time?: number;
    module?: string;
    operator_id?: number;
    page?: number;
    size?: number;
    start_time?: number;
    success?: boolean;
  }

  export interface ListResult {
    items: ListItem[];
    page: number;
    pages: number;
    size: number;
    total: number;
  }
}

/** 操作审计日志分页列表 */
export function listAdminAuditLogsApi(params: AdminAuditApi.ListParams) {
  return requestClient.get<AdminAuditApi.ListResult>('/admin/audit/logs', {
    params,
  });
}

/** 操作审计日志详情 */
export function getAdminAuditLogApi(logId: number) {
  return requestClient.get<AdminAuditApi.Detail>(
    `/admin/audit/logs/${logId}`,
  );
}
