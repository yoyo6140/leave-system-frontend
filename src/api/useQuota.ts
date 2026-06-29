import { API_ENDPOINTS } from "./constants"
import { apiFetch } from "./client"

export interface QuotaItem {
  type:        string
  total_days:  number | null
  total_hours: number | null
  note:        string | null
}

export interface LeaveQuotaData {
  user_id:  number
  username: string
  name:     string
  as_of:    string
  quotas:   QuotaItem[]
}

export async function getMyQuota(asOf?: string): Promise<LeaveQuotaData | null> {
  const url = asOf
    ? `${API_ENDPOINTS.quota.me}?as_of=${asOf}`
    : API_ENDPOINTS.quota.me
  const body = await apiFetch<LeaveQuotaData>(url)
  return body.success ? (body.data ?? null) : null
}

export async function getUserQuota(userId: number, asOf?: string): Promise<LeaveQuotaData | null> {
  const url = asOf
    ? `${API_ENDPOINTS.quota.user(userId)}?as_of=${asOf}`
    : API_ENDPOINTS.quota.user(userId)
  const body = await apiFetch<LeaveQuotaData>(url)
  return body.success ? (body.data ?? null) : null
}
