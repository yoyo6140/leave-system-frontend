import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type {
  ApiUser,
  UserCreateInput,
  UserListResponse,
  UserUpdateInput,
  UsersQueryParams,
} from "./types";

export const userApi = {
  getList: async (params: UsersQueryParams = {}): Promise<UserListResponse> => {
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
  },

  create: async (input: UserCreateInput): Promise<ApiUser> => {
    const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.create, {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "新增員工失敗");
  },

  update: async (id: number, input: UserUpdateInput): Promise<ApiUser> => {
    const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.update(id), {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "更新員工失敗");
  },

  updateStatus: async (id: number, isActive: boolean): Promise<ApiUser> => {
    const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.updateStatus(id), {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "更新帳號狀態失敗");
  },
};
