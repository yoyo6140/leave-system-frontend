import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type { OverviewData } from "./types";

export const overviewApi = {
  // 取得管理者總覽資料：待審核數、本月已核准數、員工數與排行榜
  get: async (): Promise<OverviewData> => {
    const res = await apiFetch<OverviewData>(API_ENDPOINTS.overview);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "載入總覽失敗");
  },
};
