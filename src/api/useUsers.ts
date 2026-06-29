import { API_ENDPOINTS } from "./constants"
import { apiFetch, type ApiError } from "./client"

export interface ApiUser {
  id:         number
  username:   string
  name:       string
  role:       string
  email:      string
  gender:     string
  id_number:  string
  hire_date:  string
  birth_date: string
}

export interface UserListResponse {
  total: number
  page:  number
  limit: number
  data:  ApiUser[]
}

export interface UserCreateInput {
  username:   string
  password:   string
  name:       string
  role:       string
  email:      string
  gender:     string
  id_number:  string
  hire_date:  string
  birth_date: string
}

export interface UserUpdateInput {
  username:   string
  name:       string
  role:       string
  email:      string
  gender:     string
  id_number:  string
  hire_date:  string
  birth_date: string
}

type Result<T> =
  | { ok: true;  data: T }
  | { ok: false; message: string }

export async function getUsers(params?: {
  search?: string
  page?:   number
  limit?:  number
}): Promise<Result<UserListResponse>> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set("search", params.search)
  if (params?.page)   qs.set("page",   String(params.page))
  if (params?.limit)  qs.set("limit",  String(params.limit))

  const url = qs.size ? `${API_ENDPOINTS.users.list}?${qs}` : API_ENDPOINTS.users.list
  const res = await apiFetch<UserListResponse>(url)
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "查詢員工列表失敗" }
}

export async function getUser(id: number): Promise<Result<ApiUser>> {
  const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.get(id))
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "查詢員工失敗" }
}

export async function createUser(input: UserCreateInput): Promise<Result<ApiUser>> {
  const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.create, {
    method: "POST",
    body:   JSON.stringify(input),
  })
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "新增員工失敗" }
}

export async function updateUser(id: number, input: UserUpdateInput): Promise<Result<ApiUser>> {
  const res = await apiFetch<ApiUser>(API_ENDPOINTS.users.update(id), {
    method: "PUT",
    body:   JSON.stringify(input),
  })
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "更新員工失敗" }
}

export async function deleteUser(id: number): Promise<Result<null>> {
  const res = await apiFetch(API_ENDPOINTS.users.delete(id), { method: "DELETE" })
  if (res.success) return { ok: true, data: null }
  return { ok: false, message: res.error?.message ?? "刪除員工失敗" }
}
