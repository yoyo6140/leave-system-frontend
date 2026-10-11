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

function useInvalidateLeaveRelated() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
      queryClient.invalidateQueries({ queryKey: quotaKeys.all }),
      queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
    ]);
}

export function useCreateLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: leaveApi.create,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeaveUpdateInput }) =>
      leaveApi.update(id, input),
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
    }) => leaveApi.updateStatus(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteLeave() {
  const invalidate = useInvalidateLeaveRelated();
  return useMutation({
    mutationFn: leaveApi.delete,
    onSuccess: () => invalidate(),
  });
}
