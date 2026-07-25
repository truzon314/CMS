import { apiFetchBlob, apiFetchPage } from "@/lib/api-client";
import type { AuditLogEntry } from "@/types/auditLog";

export interface AuditLogListParams {
  page?: number;
  perPage?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}

function toQuery(params: AuditLogListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("per_page", String(params.perPage));
  if (params.userId) query.set("user_id", params.userId);
  if (params.action) query.set("action", params.action);
  if (params.entityType) query.set("entity_type", params.entityType);
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);
  return query;
}

export const auditLogService = {
  list: (params: AuditLogListParams = {}) =>
    apiFetchPage<AuditLogEntry[]>(`/api/v1/audit-logs?${toQuery(params).toString()}`),

  exportCsv: (params: AuditLogListParams = {}) => apiFetchBlob(`/api/v1/audit-logs/export?${toQuery(params).toString()}`),
};
