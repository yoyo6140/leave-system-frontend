"use client";

import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/hooks/constants";
import { apiFetch } from "@/hooks/client";
import { queryKeys } from "./keys";

export interface PendingLeaveItem {
  id: string;
  user_id: number;
  user_name: string;
  type: string;
  hours: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface TopLeaveHoursItem {
  user_id: number;
  name: string;
  hours: number;
}

export interface OverviewData {
  pending_count: number;
  approved_this_month: number;
  employee_count: number;
  pending_list: PendingLeaveItem[];
  top_leave_hours: TopLeaveHoursItem[];
}

async function fetchOverview(): Promise<OverviewData> {
  const res = await apiFetch<OverviewData>(API_ENDPOINTS.overview);
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "載入總覽失敗");
}

export function useOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: fetchOverview,
  });
}
