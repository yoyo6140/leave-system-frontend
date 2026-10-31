"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SuccessDialog, AlertDialog } from "@/components/ui/app-dialog";
import { getCurrentUser } from "@/lib/auth";
import {
  hoursToApproxDays,
  LEAVE_TYPE_LABEL,
  LEAVE_TYPES,
  LeaveType,
} from "@/lib/leave";
import { useMyQuotaQuery } from "@/features/quota/hooks";
import { useCreateLeave } from "@/features/leaves/hooks";
import { createLeaveFormSchema } from "@/features/leaves/schema";

// 申請請假頁：依剩餘額度即時顯示可選時數上限，表單驗證通過後呼叫新增假單 API
export default function ApplyPage() {
  const router = useRouter();
  const user = getCurrentUser();

  const [type, setType] = useState<LeaveType>("annual");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [hours, setHours] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const { data: quota, isLoading: quotaLoading } = useMyQuotaQuery();
  const createLeave = useCreateLeave();

  const remaining = useMemo(() => {
    return Object.fromEntries(
      LEAVE_TYPES.map((t) => {
        const item = quota?.quotas.find((q) => q.type === t);
        // null = 無上限
        return [
          t,
          item?.remaining_hours ?? (item?.total_hours === null ? null : 0),
        ];
      }),
    ) as Record<LeaveType, number | null>;
  }, [quota]);

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  // 驗證表單（含剩餘額度檢查）後送出請假申請
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = createLeaveFormSchema(remaining[type]).safeParse({
      type,
      startDate,
      endDate,
      hours,
      reason,
    });
    if (!parsed.success) {
      setAlertMsg(parsed.error.issues[0]?.message ?? "輸入資料有誤");
      return;
    }

    try {
      await createLeave.mutateAsync({
        type: parsed.data.type,
        start_date: parsed.data.startDate,
        end_date: parsed.data.endDate || parsed.data.startDate,
        hours: parsed.data.hours,
        reason: parsed.data.reason,
      });
      setSuccessOpen(true);
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : "新增假單失敗");
    }
  }

  // 關閉成功提示後導向個人請假紀錄頁，方便確認剛送出的申請
  function handleSuccessClose() {
    setSuccessOpen(false);
    router.push("/records");
  }

  // 將某假別的剩餘時數轉成下拉選單顯示用的文字
  const remainingDisplay = (t: LeaveType) => {
    const r = remaining[t];
    if (r === null) return "無上限";
    return `剩餘 ${r} 小時`;
  };

  return (
    <>
      <div className="max-w-[1024px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">申請請假</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leave-balance">查看假別餘額</Link>
          </Button>
        </div>

        {/* 員工資訊 */}
        <Card padding="default" className="mb-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">員工編號</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">
                {user?.username ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">姓名</p>
              <p className="mt-0.5 text-sm font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">入職日期</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">
                {user?.hireDate ?? "—"}
              </p>
            </div>
          </div>
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
                      ? LEAVE_TYPE_LABEL[t]
                      : `${LEAVE_TYPE_LABEL[t]}（${remainingDisplay(t)}${remaining[t] !== null ? ` / 約 ${hoursToApproxDays(remaining[t]!)} 天` : ""}）`}
                  </option>
                ))}
              </select>
            </Field>

            {/* 日期範圍 + 時數 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>請假日期</FieldLabel>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </Field>

              <Field>
                <FieldLabel>請假時數</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={remaining[type] ?? undefined}
                    value={hours}
                    onChange={(e) =>
                      setHours(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="輸入時數"
                    required
                  />
                  <span className="shrink-0 text-sm text-muted-foreground">
                    小時
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hours !== "" && Number(hours) > 0
                    ? `約 ${hoursToApproxDays(Number(hours))} 天`
                    : remainingDisplay(type)}
                </p>
              </Field>
            </div>

            {/* 原因 */}
            <Field>
              <FieldLabel>
                請假原因
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  （選填）
                </span>
              </FieldLabel>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="請輸入請假原因"
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
              />
            </Field>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                送出
              </Button>
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
    </>
  );
}
