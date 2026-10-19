"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import {
  hoursToApproxDays,
  LEAVE_BADGE_ROUNDED,
  LEAVE_QUOTAS,
  LeaveType,
} from "@/lib/leave";
import { cn } from "@/lib/utils";
import {
  useMyQuotaQuery,
  type QuotaItem,
} from "@/features/quota/hooks";

interface DisplayQuota {
  type: LeaveType;
  total: number | null;
  used: number;
  remaining: number | null;
  bgColor: string;
  textColor: string;
  note: string | null;
}

// 將後端回傳的額度資料轉換成畫面顯示用的格式（補上每個假別對應的顏色樣式）
function buildDisplay(apiItems: QuotaItem[]): DisplayQuota[] {
  return apiItems.map((item) => {
    const style = LEAVE_QUOTAS[item.type as LeaveType];
    return {
      type: item.type as LeaveType,
      total: item.total_hours,
      used: item.used_hours,
      remaining: item.remaining_hours,
      bgColor: style?.bgColor ?? "bg-gray-100",
      textColor: style?.textColor ?? "text-gray-600",
      note: item.note,
    };
  });
}

// 假別餘額頁：顯示登入者各假別的總額度、已用時數與剩餘時數
export default function LeaveBalancePage() {
  const user = getCurrentUser();
  const { data, isLoading: loading } = useMyQuotaQuery();

  const quotas = useMemo(
    () => (data ? buildDisplay(data.quotas) : []),
    [data],
  );
  const seniority = data?.quotas.find((q) => q.type === "特休")?.note ?? "";
  const yearStart = data?.year_start ?? "";
  const yearEnd = data?.year_end ?? "";

  return (
    <div className="max-w-[1024px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">假別餘額</h1>
          <Button asChild size="sm" variant="outline">
            <Link href="/apply">
              <CalendarPlus className="size-4" />
              申請請假
            </Link>
          </Button>
        </div>

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
              <p className="text-xs text-muted-foreground">統計週年度</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">
                {yearStart ? `${yearStart} ～ ${yearEnd}` : "—"}
              </p>
            </div>
          </div>
          {seniority && (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              特休計算基準：{seniority}（依勞基法第 38 條）
            </p>
          )}
        </Card>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} padding="default" className="animate-pulse">
                <div className="mb-3 h-5 w-16 rounded bg-muted" />
                <div className="mb-1 h-8 w-20 rounded bg-muted" />
                <div className="h-3 w-12 rounded bg-muted" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quotas.map(
              ({ type, total, used, remaining, bgColor, textColor, note }) => (
                <Card key={type} padding="default">
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        LEAVE_BADGE_ROUNDED,
                        "px-2.5 py-1 text-xs font-medium",
                        bgColor,
                        textColor,
                      )}
                    >
                      {type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {total !== null ? `共 ${total} 小時` : "無上限"}
                    </span>
                  </div>
                  {remaining !== null ? (
                    <>
                      <div className="mb-1">
                        <span className="text-3xl font-bold tabular-nums">
                          {remaining}
                        </span>
                        <span className="ml-1 text-sm text-muted-foreground">
                          小時可用
                        </span>
                      </div>
                      <p className="mb-3 text-xs text-muted-foreground">
                        約 {hoursToApproxDays(remaining)} 天
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        已使用 {used} 小時
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {note ?? "依實際需要申請"}
                    </p>
                  )}
                </Card>
              ),
            )}
          </div>
        )}
      </div>
  );
}
