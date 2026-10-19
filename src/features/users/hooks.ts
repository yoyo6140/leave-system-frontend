import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { overviewKeys } from "@/features/overview/keys";
import { userApi } from "./api";
import { userKeys } from "./keys";
import type { UserUpdateInput, UsersQueryParams } from "./types";

export type {
  ApiUser,
  UserCreateInput,
  UserListResponse,
  UserUpdateInput,
  UsersQueryParams,
} from "./types";

// 查詢員工列表的 React Query hook
export function useUsersQuery(
  params: UsersQueryParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.getList(params),
    enabled: options?.enabled,
  });
}

// 員工姓名／人數都會出現在 /overview（排行榜姓名、員工人數），
// 三個 mutation 一律連同 overviewKeys 一起失效，避免總覽顯示舊資料
function useInvalidateUsersAndOverview() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
      queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
    ]);
}

// 新增員工的 mutation hook，成功後刷新員工列表與總覽
export function useCreateUser() {
  const invalidate = useInvalidateUsersAndOverview();
  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => invalidate(),
  });
}

// 編輯員工資料的 mutation hook，成功後刷新員工列表與總覽
export function useUpdateUser() {
  const invalidate = useInvalidateUsersAndOverview();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UserUpdateInput }) =>
      userApi.update(id, input),
    onSuccess: () => invalidate(),
  });
}

// 啟用/停用員工帳號的 mutation hook，成功後刷新員工列表與總覽
export function useUpdateUserStatus() {
  const invalidate = useInvalidateUsersAndOverview();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      userApi.updateStatus(id, isActive),
    onSuccess: () => invalidate(),
  });
}
