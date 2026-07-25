import { apiFetch } from "@/lib/api-client";
import type { DashboardStats } from "@/types/dashboard";

export const dashboardService = {
  getStats: () => apiFetch<DashboardStats>("/api/v1/dashboard/stats"),
};
