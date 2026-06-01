export type LeaveType = "特休" | "病假" | "事假" | "婚假" | "喪假" | "公假" | "其他"
export type LeaveStatus = "待審核" | "已通過" | "已拒絕"

export type LeaveRecord = {
  id: string
  username: string
  type: LeaveType
  startDate: string
  endDate: string
  hours: number
  reason: string
  status: LeaveStatus
  createdAt: string
}

export const LEAVE_QUOTAS: Record<
  LeaveType,
  { total: number; bgColor: string; textColor: string; barColor: string }
> = {
  特休: { total: 112, bgColor: "bg-blue-50",  textColor: "text-blue-600",  barColor: "#3b82f6" },
  病假: { total: 240, bgColor: "bg-red-50",   textColor: "text-red-600",   barColor: "#ef4444" },
  事假: { total: 112, bgColor: "bg-amber-50", textColor: "text-amber-600", barColor: "#f59e0b" },
  婚假: { total: 64,  bgColor: "bg-red-50",   textColor: "text-red-600",   barColor: "#ef4444" },
  喪假: { total: 48,  bgColor: "bg-red-50",   textColor: "text-red-600",   barColor: "#ef4444" },
  公假: { total: 40,  bgColor: "bg-amber-50", textColor: "text-amber-600", barColor: "#f59e0b" },
  其他: { total: 999, bgColor: "bg-amber-50", textColor: "text-amber-600", barColor: "#f59e0b" },
}

export const LEAVE_TYPES = Object.keys(LEAVE_QUOTAS) as LeaveType[]

const STORAGE_KEY = "leave_records"

export function getRecords(username?: string): LeaveRecord[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  const all = data
    ? (JSON.parse(data) as Partial<LeaveRecord>[]).map((r) => ({
        ...r,
        username: r.username ?? "admin",
      })) as LeaveRecord[]
    : []
  return username ? all.filter((r) => r.username === username) : all
}

export function addRecord(
  data: Omit<LeaveRecord, "id" | "createdAt" | "status">
): LeaveRecord {
  const all = getRecords()
  const record: LeaveRecord = {
    ...data,
    id: crypto.randomUUID(),
    status: "待審核",
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, record]))
  return record
}

export function getUsedHours(type: LeaveType, username?: string): number {
  return getRecords(username)
    .filter((r) => r.type === type && r.status !== "已拒絕")
    .reduce((sum, r) => sum + r.hours, 0)
}

export function hoursToApproxDays(hours: number): number {
  return Math.round((hours / 8) * 10) / 10
}
