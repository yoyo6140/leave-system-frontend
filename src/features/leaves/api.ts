import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type {
  ApiLeaveRecord,
  LeaveCreateInput,
  LeaveListData,
  LeaveStatusLog,
  LeaveStatusUpdateInput,
  LeaveUpdateInput,
  LeavesQueryParams,
} from "./types";

export const leaveApi = {
  // 查詢假單列表，支援狀態/關鍵字篩選、分頁，以及只看自己（mine）
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

  // 送出一筆新的請假申請
  create: async (input: LeaveCreateInput): Promise<ApiLeaveRecord> => {
    const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.create, {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "新增假單失敗");
  },

  // 修改既有假單內容（假別、日期、時數、事由）
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

  // 審核假單：更新狀態（通過/拒絕）並記錄審核者
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

  // 查詢單筆假單的狀態變更歷史（建立、編輯、審核、取消、銷假）
  getStatusLogs: async (id: string): Promise<LeaveStatusLog[]> => {
    const res = await apiFetch<LeaveStatusLog[]>(
      API_ENDPOINTS.leaves.statusLogs(id),
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "查詢假單紀錄失敗");
  },
};
