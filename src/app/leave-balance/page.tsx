"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarPlus } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import {
  getUsedHours,
  hoursToApproxDays,
  LEAVE_QUOTAS,
  LEAVE_TYPES,
  LeaveType,
} from "@/lib/leave"
import { cn } from "@/lib/utils"

const YEAR = new Date().getFullYear()

export default function LeaveBalancePage() {
  const user = getCurrentUser()

  const [quotas, setQuotas] = useState<
    { type: LeaveType; total: number; used: number; remaining: number; bgColor: string; textColor: string }[]
  >([])

  useEffect(() => {
    setQuotas(
      LEAVE_TYPES.map((type) => {
        const { total, bgColor, textColor } = LEAVE_QUOTAS[type]
        const used = getUsedHours(type, user?.username)
        return { type, total, used, remaining: total - used, bgColor, textColor }
      })
    )
  }, [user?.username])

  return (
    <AppLayout>
      <div className="max-w-[1024px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">假別餘額</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/apply">
              <CalendarPlus className="size-4" />
              申請請假
            </Link>
          </Button>
        </div>

        <Card padding="default" className="mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">員工編號</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">{user?.username ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">姓名</p>
              <p className="mt-0.5 text-sm font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">統計期間</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">{YEAR}/01/01 ～ {YEAR}/12/31</p>
            </div>
          </div>
        </Card>

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
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
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
      </div>
    </AppLayout>
  )
}
