import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type { LeaveQuotaData } from "./types";

export const quotaApi = {
  // 查詢自己各假別的額度與剩餘時數，可用 asOf 指定計算基準日
  getMine: async (asOf?: string): Promise<LeaveQuotaData> => {
    const url = asOf
      ? `${API_ENDPOINTS.quota.me}?as_of=${asOf}`
      : API_ENDPOINTS.quota.me;
    const body = await apiFetch<LeaveQuotaData>(url);
    if (body.success && body.data) return body.data;
    throw new Error(body.error?.message ?? "載入假別餘額失敗");
  },
};
