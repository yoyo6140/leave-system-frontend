"use client";

import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/hooks/constants";
import { apiFetch } from "@/hooks/client";
import { queryKeys } from "./keys";

export interface QuotaItem {
  type: string;
  total_days: number | null;
  total_hours: number | null;
  used_hours: number;
  remaining_hours: number | null;
  note: string | null;
}

export interface LeaveQuotaData {
  user_id: number;
  username: string;
  name: string;
  as_of: string;
  year_start: string;
  year_end: string;
  quotas: QuotaItem[];
}

async function fetchMyQuota(asOf?: string): Promise<LeaveQuotaData> {
  const url = asOf
    ? `${API_ENDPOINTS.quota.me}?as_of=${asOf}`
    : API_ENDPOINTS.quota.me;
  const body = await apiFetch<LeaveQuotaData>(url);
  if (body.success && body.data) return body.data;
  throw new Error(body.error?.message ?? "載入假別餘額失敗");
}

export function useMyQuotaQuery(asOf?: string) {
  return useQuery({
    queryKey: queryKeys.quotaMe(asOf),
    queryFn: () => fetchMyQuota(asOf),
  });
}
