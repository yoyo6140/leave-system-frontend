import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type { LeaveQuotaData } from "./types";

export const quotaApi = {
  getMine: async (asOf?: string): Promise<LeaveQuotaData> => {
    const url = asOf
      ? `${API_ENDPOINTS.quota.me}?as_of=${asOf}`
      : API_ENDPOINTS.quota.me;
    const body = await apiFetch<LeaveQuotaData>(url);
    if (body.success && body.data) return body.data;
    throw new Error(body.error?.message ?? "載入假別餘額失敗");
  },
};
