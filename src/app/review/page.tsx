"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, X } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SuccessDialog, ConfirmDialog } from "@/components/ui/app-dialog"
import { cn } from "@/lib/utils"
import { getRecords, LeaveRecord, LEAVE_BADGE_ROUNDED, LEAVE_QUOTAS } from "@/lib/leave"

const STORAGE_KEY = "leave_records"

export default function ReviewPage() {
  const [records, setRecords] = useState<LeaveRecord[]>([])
  const [successMsg, setSuccessMsg] = useState("")
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

  useEffect(() => {
    setRecords(getRecords())
  }, [])

  const pending  = records.filter((r) => r.status === "待審核")
  const approved = records.filter((r) => r.status === "已通過").length
  const rejected = records.filter((r) => r.status === "已拒絕").length

  const updateStatus = useCallback(
    (id: string, status: "已通過" | "已拒絕") => {
      const updated = records.map((r) => (r.id === id ? { ...r, status } : r))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setRecords(updated)
    },
    [records]
  )

  function handleApprove(id: string) {
    updateStatus(id, "已通過")
    setSuccessMsg("申請已核准")
  }

  function handleRejectConfirm() {
    if (!rejectTarget) return
    updateStatus(rejectTarget, "已拒絕")
    setRejectTarget(null)
  }

  return (
    <AppLayout allowedRoles={["admin"]}>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">審核管理</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            待審核 {pending.length} 筆・已核准 {approved} 筆・已拒絕 {rejected} 筆
          </p>
        </div>

        {pending.length === 0 ? (
          <Card variant="dashed" padding="none" className="flex flex-col items-center justify-center py-16 text-center">
            <Check className="mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">目前沒有待審核的申請</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((record) => {
              const q = LEAVE_QUOTAS[record.type as keyof typeof LEAVE_QUOTAS]
              return (
                <Card key={record.id} padding="default">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={cn("shrink-0 px-2.5 py-0.5 text-xs font-medium", LEAVE_BADGE_ROUNDED, q?.bgColor, q?.textColor)}>
                        {record.type}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          <span className="mr-2 text-xs text-muted-foreground">@{record.username}</span>
                          {record.startDate} ～ {record.endDate}
                          <span className="ml-2 text-xs text-muted-foreground">{record.hours} 小時</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          申請時間：{new Date(record.createdAt).toLocaleDateString("zh-TW")}
                          {record.reason && <span className="ml-2">・{record.reason}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" onClick={() => handleApprove(record.id)}>
                        <Check className="size-3.5" />
                        核准
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectTarget(record.id)}>
                        <X className="size-3.5" />
                        拒絕
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <SuccessDialog
        open={!!successMsg}
        title="Success"
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
      <ConfirmDialog
        open={!!rejectTarget}
        title="確認拒絕？"
        message="拒絕後將通知員工，此操作無法復原。"
        confirmLabel="確認拒絕"
        variant="destructive"
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />
    </AppLayout>
  )
}
