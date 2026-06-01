"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardCheck, Users } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { mockOverviewResponse } from "@/api/useOverview"
import { LEAVE_QUOTAS, LeaveType } from "@/lib/leave"
import { cn } from "@/lib/utils"

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

export default function DashboardPage() {
  return (
    <AppLayout allowedRoles={["admin"]}>
      <div>
        <h1 className="mb-6 text-xl font-semibold">儀表板</h1>
        <AdminDashboard />
      </div>
    </AppLayout>
  )
}
