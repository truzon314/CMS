import { useQuery } from "@tanstack/react-query";
import { auditLogService, type AuditLogListParams } from "@/services/auditLog";

const AUDIT_LOGS_KEY = ["audit-logs"];

export function useAuditLogsList(params: AuditLogListParams = {}) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_KEY, params],
    queryFn: () => auditLogService.list(params),
  });
}
