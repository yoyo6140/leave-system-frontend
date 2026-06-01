"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardCheck, Users } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { mockOverviewResponse } from "@/api/useOverview"
import { getCurrentUser } from "@/lib/auth"
import {
  getRecords,
  getUsedHours,
  hoursToApproxDays,
  LEAVE_QUOTAS,
  LEAVE_TYPES,
  LeaveRecord,
  LeaveType,
} from "@/lib/leave"
import { cn } from "@/lib/utils"

const YEAR = new Date().getFullYear()

const STATUS_STYLE: Record<string, string> = {
  待審核: "bg-amber-50 text-amber-600",
  已通過: "bg-blue-50 text-blue-600",
  已拒絕: "bg-red-50 text-red-600",
}

// ── Employee View ─────────────────────────────────────────────────────────────

function EmployeeDashboard({ username }: { username: string }) {
  const [quotas, setQuotas] = useState<
    { type: LeaveType; total: number; used: number; remaining: number; bgColor: string; textColor: string }[]
  >([])
  const [recent, setRecent] = useState<LeaveRecord[]>([])

  useEffect(() => {
    setQuotas(
      LEAVE_TYPES.map((type) => {
        const { total, bgColor, textColor } = LEAVE_QUOTAS[type]
        const used = getUsedHours(type, username)
        return { type, total, used, remaining: total - used, bgColor, textColor }
      })
    )
    setRecent(
      getRecords(username)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    )
  }, [username])

  return (
    <div className="space-y-8">
      {/* 假別餘額 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">假別餘額</h2>
          <span className="text-xs text-muted-foreground">{YEAR}/01/01 ～ {YEAR}/12/31</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotas.map(({ type, total, used, remaining, bgColor, textColor }) => (
            <Card key={type} padding="default">
              <div className="mb-3 flex items-center justify-between">
                <span className={cn("rounded-lg px-2.5 py-1 text-xs font-medium", bgColor, textColor)}>{type}</span>
                <span className="text-xs text-muted-foreground">共 {total} 小時</span>
              </div>
              <div className="mb-1">
                <span className="text-3xl font-bold tabular-nums">{remaining}</span>
                <span className="ml-1 text-sm text-muted-foreground">小時可用</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">約 {hoursToApproxDays(remaining)} 天</p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0}%`,
                    backgroundColor: LEAVE_QUOTAS[type].barColor,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">已使用 {used} 小時</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 最新申請狀態 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">最新申請狀態</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/records">查看全部</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <Card variant="dashed" padding="default" className="text-center text-sm text-muted-foreground">
            尚無申請紀錄
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((r) => {
              const q = LEAVE_QUOTAS[r.type]
              return (
                <Card key={r.id} padding="sm" className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", q.bgColor, q.textColor)}>
                      {r.type}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {r.startDate} ～ {r.endDate}
                      <span className="ml-1.5">{r.hours} 小時</span>
                    </span>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>
                    {r.status}
                  </span>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Admin View ────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [pending, setPending]   = useState<typeof mockOverviewResponse.pendingLeaveList>([])
  const [employeeYearLeaveHours, setEmployeeYearLeaveHours] = useState<typeof mockOverviewResponse.employeeYearLeaveHoursList>([])
  const [employeeCount, setEmployeeCount] = useState(0)
  const [approvedThisMonth, setApprovedThisMonth] = useState(0)

  useEffect(() => {
    setPending(mockOverviewResponse.pendingLeaveList)
    setEmployeeYearLeaveHours(mockOverviewResponse.employeeYearLeaveHoursList)
    setApprovedThisMonth(mockOverviewResponse.approvedMonthCount)
    setEmployeeCount(mockOverviewResponse.employeeCount)
  }, [])

  return (
    <div className="space-y-8">
      {/* 統計卡 */}
      <section>
        <h2 className="mb-4 text-base font-semibold">團隊總覽</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card padding="default">
            <p className="mb-1 text-xs text-muted-foreground">待審核申請</p>
            <p className="text-3xl font-bold tabular-nums text-amber-500">{pending.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">筆</p>
          </Card>
          <Card padding="default">
            <p className="mb-1 text-xs text-muted-foreground">本月已核准</p>
            <p className="text-3xl font-bold tabular-nums text-blue-500">{approvedThisMonth}</p>
            <p className="mt-1 text-xs text-muted-foreground">筆</p>
          </Card>
          <Card padding="default">
            <p className="mb-1 text-xs text-muted-foreground">員工人數</p>
            <p className="text-3xl font-bold tabular-nums">{employeeCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">人</p>
          </Card>
        </div>
      </section>

      {/* 待審核列表 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">待審核申請</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/review">前往審核</Link>
          </Button>
        </div>
        {pending.length === 0 ? (
          <Card variant="dashed" padding="default" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ClipboardCheck className="size-4" />
            目前沒有待審核的申請
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.slice(0, 5).map((r) => {
              const q = LEAVE_QUOTAS[r.type as LeaveType]
              return (
                <Card key={r.id} padding="sm" className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium shrink-0">{r.name}</span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", q.bgColor, q.textColor)}>
                      {r.type}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{r.hours} 小時</span>
                  </div>
                </Card>
              )
            })}
            {pending.length > 5 && (
              <p className="text-center text-xs text-muted-foreground">
                還有 {pending.length - 5} 筆，<Link href="/admin/review" className="underline">前往查看</Link>
              </p>
            )}
          </div>
        )}
      </section>

      {/* 員工年請假總時數 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">員工年請假總時數</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/employees">員工管理</Link>
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {employeeYearLeaveHours.map((emp) => {
            return (
              <Card key={emp.id} padding="sm" className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {emp.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">年請假總時數：{emp.hours} 小時</p>
                  </div>
                </div>
              </Card>
            )
          })}
          {employeeYearLeaveHours.length === 0 && (
            <Card variant="dashed" padding="default" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              尚無員工年請假資料
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = getCurrentUser()
  const isAdmin = user?.role === "admin"

  return (
    <AppLayout>
      <div>
        <h1 className="mb-6 text-xl font-semibold">儀表板</h1>
        {isAdmin
          ? <AdminDashboard />
          : <EmployeeDashboard username={user?.username ?? ""} />
        }
      </div>
    </AppLayout>
  )
}
