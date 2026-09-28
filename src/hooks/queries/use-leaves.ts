"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/hooks/constants";
import { apiFetch } from "@/hooks/client";
import { queryKeys } from "./keys";

export interface ApiLeaveRecord {
  id: string;
  user_id: number;
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string;
  status: string;
  reviewer: string | null;
  created_at: string;
  updated_at: string | null;
  /** 由呼叫端從使用者列表填入，方便顯示 */
  _username?: string;
}

export interface LeaveListData {
  total: number;
  page: number;
  limit: number;
  data: ApiLeaveRecord[];
}

export interface LeaveCreateInput {
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason?: string;
}

export interface LeaveUpdateInput {
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason?: string;
}

export interface LeaveStatusUpdateInput {
  status: string;
  reviewer?: string | null;
}

export type LeavesQueryParams = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  mine?: boolean;
};

async function fetchLeaves(
  params: LeavesQueryParams = {},
): Promise<LeaveListData> {
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
}

async function fetchCreateLeave(
  input: LeaveCreateInput,
): Promise<ApiLeaveRecord> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.create, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "新增假單失敗");
}

async function fetchUpdateLeave(
  id: string,
  input: LeaveUpdateInput,
): Promise<ApiLeaveRecord> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.update(id), {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "修改假單失敗");
}

async function fetchUpdateLeaveStatus(
  id: string,
  input: LeaveStatusUpdateInput,
): Promise<ApiLeaveRecord> {
  const res = await apiFetch<ApiLeaveRecord>(
    API_ENDPOINTS.leaves.updateStatus(id),
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "更新假單狀態失敗");
}

/** 取消請假申請＝軟刪除，狀態改為「已取消」並保留紀錄，僅限「待審核」狀態 */
async function fetchDeleteLeave(id: string): Promise<ApiLeaveRecord> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.delete(id), {
    method: "DELETE",
  });
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "取消申請失敗");
}

export function useLeavesQuery(
  params: LeavesQueryParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.leaves(params),
    queryFn: () => fetchLeaves(params),
    enabled: options?.enabled,
  });
}

function useInvalidateLeaveRelated() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["leaves"] }),
      queryClient.invalidateQueries({ queryKey: ["quota"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
    ]);
}

export function useCreateLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: fetchCreateLeave,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeaveUpdateInput }) =>
      fetchUpdateLeave(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateLeaveStatus() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: LeaveStatusUpdateInput;
    }) => fetchUpdateLeaveStatus(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: fetchDeleteLeave,
    onSuccess: () => invalidate(),
  });
}
