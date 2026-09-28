"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/hooks/constants";
import { apiFetch } from "@/hooks/client";
import { queryKeys } from "./keys";

export interface ApiUser {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
  is_active: boolean;
}

export interface UserListResponse {
  total: number;
  page: number;
  limit: number;
  data: ApiUser[];
}

export interface UserCreateInput {
  username: string;
  password: string;
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
}

export interface UserUpdateInput {
  username: string;
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
}

export type UsersQueryParams = {
  search?: string;
  page?: number;
  limit?: number;
  /** 是否包含已停用帳號（預設 false） */
  include_inactive?: boolean;
};

async function fetchUsers(
  params: UsersQueryParams = {},
): Promise<UserListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.include_inactive) qs.set("include_inactive", "true");

  const url = qs.size
    ? `${API_ENDPOINTS.users.list}?${qs}`
    : API_ENDPOINTS.users.list;
  const res = await apiFetch<UserListResponse>(url);
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "查詢員工列表失敗");
}

async function fetchCreateUser(input: UserCreateInput): Promise<ApiUser> {
  const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.create, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "新增員工失敗");
}

async function fetchUpdateUser(
  id: number,
  input: UserUpdateInput,
): Promise<ApiUser> {
  const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.update(id), {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "更新員工失敗");
}

async function fetchUpdateUserStatus(
  id: number,
  isActive: boolean,
): Promise<ApiUser> {
  const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.updateStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
  if (res.success && res.data) return res.data;
  throw new Error(res.error?.message ?? "更新帳號狀態失敗");
}

export function useUsersQuery(
  params: UsersQueryParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => fetchUsers(params),
    enabled: options?.enabled,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["users"] });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: fetchCreateUser,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UserUpdateInput }) =>
      fetchUpdateUser(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      fetchUpdateUserStatus(id, isActive),
    onSuccess: () => invalidate(),
  });
}
