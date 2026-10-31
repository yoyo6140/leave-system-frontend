import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type { MonthlyLeaveStatsData, OverviewData } from "./types";

export const overviewApi = {
  // 取得管理者總覽資料：待審核數、本月已核准數、員工數
  get: async (): Promise<OverviewData> => {
    const res = await apiFetch<OverviewData>(API_ENDPOINTS.overview);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "載入總覽失敗");
  },

  // 取得指定年度每月請假次數，獨立 API 可依年度篩選
  getMonthly: async (year: number): Promise<MonthlyLeaveStatsData> => {
    const res = await apiFetch<MonthlyLeaveStatsData>(
      API_ENDPOINTS.overviewMonthly(year),
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "載入每月請假次數統計失敗");
  },
};
