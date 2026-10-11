import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type {
  ApiLeaveRecord,
  LeaveCreateInput,
  LeaveListData,
  LeaveStatusUpdateInput,
  LeaveUpdateInput,
  LeavesQueryParams,
} from "./types";

export const leaveApi = {
  getList: async (params: LeavesQueryParams = {}): Promise<LeaveListData> => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.mine) qs.set("mine", "true");
    const url = qs.size
      ? `${API_ENDPOINTS.leaves.list}?${qs}`
      : API_ENDPOINTS.leaves.list;
    const res = await apiFetch<LeaveListData>(url);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "查詢假單失敗");
  },

  create: async (input: LeaveCreateInput): Promise<ApiLeaveRecord> => {
    const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.create, {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "新增假單失敗");
  },

  update: async (
    id: string,
    input: LeaveUpdateInput,
  ): Promise<ApiLeaveRecord> => {
    const res = await apiFetch<ApiLeaveRecord>(
      API_ENDPOINTS.leaves.update(id),
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "修改假單失敗");
  },

  updateStatus: async (
    id: string,
    input: LeaveStatusUpdateInput,
  ): Promise<ApiLeaveRecord> => {
    const res = await apiFetch<ApiLeaveRecord>(
      API_ENDPOINTS.leaves.updateStatus(id),
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "更新假單狀態失敗");
  },

  // 取消請假申請＝軟刪除，狀態改為「已取消」並保留紀錄，僅限「待審核」狀態
  delete: async (id: string): Promise<ApiLeaveRecord> => {
    const res = await apiFetch<ApiLeaveRecord>(
      API_ENDPOINTS.leaves.delete(id),
      {
        method: "DELETE",
      },
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "取消申請失敗");
  },
};
