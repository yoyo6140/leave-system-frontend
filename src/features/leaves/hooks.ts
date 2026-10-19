import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { overviewKeys } from "@/features/overview/keys";
import { quotaKeys } from "@/features/quota/keys";
import { leaveApi } from "./api";
import { leaveKeys } from "./keys";
import type { LeaveStatusUpdateInput, LeaveUpdateInput, LeavesQueryParams } from "./types";

export type {
  ApiLeaveRecord,
  LeaveCreateInput,
  LeaveListData,
  LeaveStatusUpdateInput,
  LeaveUpdateInput,
  LeavesQueryParams,
} from "./types";

// 查詢假單列表的 React Query hook，依查詢參數快取結果
export function useLeavesQuery(
  params: LeavesQueryParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: leaveKeys.list(params),
    queryFn: () => leaveApi.getList(params),
    enabled: options?.enabled,
  });
}

// 假單異動後，一併讓「假單、額度、總覽」相關快取失效以重新抓取最新資料
function useInvalidateLeaveRelated() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
      queryClient.invalidateQueries({ queryKey: quotaKeys.all }),
      queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
    ]);
}

// 新增假單的 mutation hook，成功後刷新相關資料
export function useCreateLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: leaveApi.create,
    onSuccess: () => invalidate(),
  });
}

// 編輯假單的 mutation hook，成功後刷新相關資料
export function useUpdateLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeaveUpdateInput }) =>
      leaveApi.update(id, input),
    onSuccess: () => invalidate(),
  });
}

// 審核假單狀態（通過/拒絕）的 mutation hook，成功後刷新相關資料
export function useUpdateLeaveStatus() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: LeaveStatusUpdateInput;
    }) => leaveApi.updateStatus(id, input),
    onSuccess: () => invalidate(),
  });
}

// 取消請假申請的 mutation hook（實際為刪除），成功後刷新相關資料
export function useDeleteLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: leaveApi.delete,
    onSuccess: () => invalidate(),
  });
}
