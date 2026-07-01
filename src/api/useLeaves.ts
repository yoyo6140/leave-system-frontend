import { API_ENDPOINTS } from "./constants"
import { apiFetch } from "./client"

export interface ApiLeaveRecord {
  id:         string
  user_id:    number
  type:       string
  start_date: string
  end_date:   string
  hours:      number
  reason:     string
  status:     string
  reviewer:   string | null
  created_at: string
  updated_at: string | null
  /** 由呼叫端從使用者列表填入，方便顯示 */
  _username?: string
}

export interface LeaveListData {
  total: number
  page:  number
  limit: number
  data:  ApiLeaveRecord[]
}

export interface LeaveCreateInput {
  type:       string
  start_date: string
  end_date:   string
  hours:      number
  reason?:    string
}

export interface LeaveUpdateInput {
  type:       string
  start_date: string
  end_date:   string
  hours:      number
  reason?:    string
}

export interface LeaveStatusUpdateInput {
  status:    string
  reviewer?: string | null
}

type Result<T> =
  | { ok: true;  data: T }
  | { ok: false; message: string }

export async function getLeaves(params?: {
  status?: string
  page?:   number
  limit?:  number
}): Promise<Result<LeaveListData>> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set("status", params.status)
  if (params?.page)   qs.set("page",   String(params.page))
  if (params?.limit)  qs.set("limit",  String(params.limit))
  const url = qs.size ? `${API_ENDPOINTS.leaves.list}?${qs}` : API_ENDPOINTS.leaves.list
  const res = await apiFetch<LeaveListData>(url)
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "查詢假單失敗" }
}

export async function getLeave(id: string): Promise<Result<ApiLeaveRecord>> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.get(id))
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "查詢假單失敗" }
}

export async function createLeave(input: LeaveCreateInput): Promise<Result<ApiLeaveRecord>> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.create, {
    method: "POST",
    body:   JSON.stringify(input),
  })
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "新增假單失敗" }
}

export async function updateLeave(id: string, input: LeaveUpdateInput): Promise<Result<ApiLeaveRecord>> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.update(id), {
    method: "PUT",
    body:   JSON.stringify(input),
  })
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "修改假單失敗" }
}

export async function updateLeaveStatus(id: string, input: LeaveStatusUpdateInput): Promise<Result<ApiLeaveRecord>> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.updateStatus(id), {
    method: "PATCH",
    body:   JSON.stringify(input),
  })
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "更新假單狀態失敗" }
}

export async function cancelLeave(id: string): Promise<Result<ApiLeaveRecord>> {
  const res = await apiFetch<ApiLeaveRecord>(API_ENDPOINTS.leaves.cancel(id), {
    method: "PATCH",
  })
  if (res.success && res.data) return { ok: true, data: res.data }
  return { ok: false, message: res.error?.message ?? "取消假單失敗" }
}

export async function deleteLeave(id: string): Promise<Result<null>> {
  const res = await apiFetch(API_ENDPOINTS.leaves.delete(id), { method: "DELETE" })
  if (res.success) return { ok: true, data: null }
  return { ok: false, message: res.error?.message ?? "刪除假單失敗" }
}
