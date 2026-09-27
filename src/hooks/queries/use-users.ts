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
};

async function fetchUsers(
  params: UsersQueryParams = {},
): Promise<UserListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

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

async function fetchDeleteUser(id: number): Promise<null> {
  const res = await apiFetch(API_ENDPOINTS.users.delete(id), {
    method: "DELETE",
  });
  if (res.success) return null;
  throw new Error(res.error?.message ?? "刪除員工失敗");
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

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: fetchDeleteUser,
    onSuccess: () => invalidate(),
  });
}
