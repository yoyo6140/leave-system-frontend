"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { type DateRange } from "react-day-picker"
import { CalendarIcon } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SuccessDialog, AlertDialog } from "@/components/ui/app-dialog"
import { getCurrentUser } from "@/lib/auth"
import {
  addRecord,
  getRecords,
  getUsedHours,
  hoursToApproxDays,
  LEAVE_BADGE_ROUNDED,
  LEAVE_QUOTAS,
  LEAVE_STATUS_STYLE,
  LEAVE_TYPES,
  LeaveRecord,
  LeaveType,
} from "@/lib/leave"
import { cn } from "@/lib/utils"
import { getMyQuota } from "@/api/useQuota"

export default function ApplyPage() {
  const router = useRouter()
  const user   = getCurrentUser()

  const [type,      setType]      = useState<LeaveType>("特休")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [hours,     setHours]     = useState<number | "">("")
  const [reason,    setReason]    = useState("")
  const [remaining,     setRemaining]     = useState<Record<LeaveType, number>>(
    () => Object.fromEntries(LEAVE_TYPES.map((t) => [t, 0])) as Record<LeaveType, number>
  )
  const [quotaLoading,  setQuotaLoading]  = useState(true)
  const [successOpen,   setSuccessOpen]   = useState(false)
  const [alertMsg,      setAlertMsg]      = useState("")
  const [recent,        setRecent]        = useState<LeaveRecord[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setQuotaLoading(true)
      const quota = await getMyQuota()
      if (cancelled) return

      const totals = Object.fromEntries(
        LEAVE_TYPES.map((t) => {
          const item  = quota?.quotas.find((q) => q.type === t)
          const total = item?.total_hours ?? 0
          return [t, Math.max(total - getUsedHours(t, user?.username), 0)]
        })
      ) as Record<LeaveType, number>

      setRemaining(totals)
      setQuotaLoading(false)
    }
    load()
    setRecent(
      getRecords(user?.username)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    )
    return () => { cancelled = true }
  }, [user?.username])

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""
  const endDate   = dateRange?.to   ? format(dateRange.to,   "yyyy-MM-dd") : ""

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate) { setAlertMsg("請選擇請假日期"); return }
    if (!hours || Number(hours) <= 0) { setAlertMsg("請填寫請假時數"); return }
    if (Number(hours) > remaining[type]) {
      setAlertMsg(`${type} 剩餘時數不足（剩餘 ${remaining[type]} 小時，申請 ${hours} 小時）`)
      return
    }
    addRecord({
      username: user?.username ?? "employee",
      type,
      startDate,
      endDate: endDate || startDate,
      hours: Number(hours),
      reason,
    })
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    router.push("/records")
  }

  return (
    <AppLayout>
      <div className="max-w-[1024px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">申請請假</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leave-balance">查看假別餘額</Link>
          </Button>
        </div>

        {/* 員工資訊 */}
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
              <p className="text-xs text-muted-foreground">入職日期</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">{user?.hireDate ?? "—"}</p>
            </div>
          </div>
        </Card>

        {/* 最新申請狀態 */}
        <Card padding="default" className="mb-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">最新申請狀態</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/records">查看全部</Link>
            </Button>
          </div>
          {recent.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">尚無申請紀錄</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((r) => {
                const q = LEAVE_QUOTAS[r.type]
                return (
                  <div key={r.id} className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn("shrink-0 px-2.5 py-0.5 text-xs font-medium", LEAVE_BADGE_ROUNDED, q.bgColor, q.textColor)}>
                        {r.type}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {r.startDate} ～ {r.endDate}
                        <span className="ml-1.5">{r.hours} 小時</span>
                      </span>
                    </div>
                    <span className={cn("shrink-0 px-2.5 py-0.5 text-xs font-medium", LEAVE_BADGE_ROUNDED, LEAVE_STATUS_STYLE[r.status])}>
                      {r.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* 請假表單 */}
        <Card asChild padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* 假別 */}
            <Field>
              <FieldLabel>假別</FieldLabel>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                disabled={quotaLoading}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {quotaLoading
                      ? t
                      : `${t}（剩餘 ${remaining[t]} 小時 / 約 ${hoursToApproxDays(remaining[t])} 天）`}
                  </option>
                ))}
              </select>
            </Field>

            {/* 日期範圍 + 時數（同行） */}
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>請假日期</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start px-3 font-normal text-left">
                      <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                      {dateRange?.from ? (
                        dateRange.to
                          ? <>{format(dateRange.from, "yyyy/MM/dd", { locale: zhTW })} — {format(dateRange.to, "yyyy/MM/dd", { locale: zhTW })}</>
                          : format(dateRange.from, "yyyy/MM/dd", { locale: zhTW })
                      ) : (
                        <span className="text-muted-foreground">選擇請假日期</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={zhTW}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel>請假時數</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={remaining[type]}
                    value={hours}
                    onChange={(e) => setHours(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="輸入時數"
                    required
                  />
                  <span className="shrink-0 text-sm text-muted-foreground">小時</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hours !== "" && Number(hours) > 0
                    ? `約 ${hoursToApproxDays(Number(hours))} 天`
                    : `剩餘 ${remaining[type]} 小時可申請`}
                </p>
              </Field>
            </div>

            {/* 原因 */}
            <Field>
              <FieldLabel>
                請假原因
                <span className="ml-1 text-xs font-normal text-muted-foreground">（選填）</span>
              </FieldLabel>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="請輸入請假原因"
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
              />
            </Field>

            <div className="flex justify-end gap-3">
              <Button type="submit">送出</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
            </div>
          </form>
        </Card>
      </div>

      <SuccessDialog
        open={successOpen}
        title="申請成功"
        message="請假申請已送出，等待主管審核。"
        onClose={handleSuccessClose}
      />
      <AlertDialog
        open={!!alertMsg}
        title="無法送出"
        message={alertMsg}
        onClose={() => setAlertMsg("")}
      />
    </AppLayout>
  )
}
