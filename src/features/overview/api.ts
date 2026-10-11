import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type { OverviewData } from "./types";

export const overviewApi = {
  get: async (): Promise<OverviewData> => {
    const res = await apiFetch<OverviewData>(API_ENDPOINTS.overview);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "載入總覽失敗");
  },
};
