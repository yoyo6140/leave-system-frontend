"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LEAVE_BADGE_ROUNDED,
  LEAVE_QUOTAS,
  LEAVE_TYPE_LABEL,
  LeaveType,
} from "@/lib/leave";
import { cn } from "@/lib/utils";
import {
  type MonthlyLeaveStat,
  useOverviewMonthlyQuery,
  useOverviewQuery,
} from "@/features/overview/hooks";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

// 管理者總覽主要內容：待審核數/本月核准數/員工數統計卡、待審核列表與每月請假統計
function AdminOverview() {
  const { data, isLoading: loading } = useOverviewQuery();
  const [year, setYear] = useState(CURRENT_YEAR);
  const { data: monthlyData, isLoading: monthlyLoading } =
    useOverviewMonthlyQuery(year);

  const peakMonth = (monthlyData?.months ?? []).reduce<MonthlyLeaveStat | null>(
    (max, m) => (!max || m.count > max.count ? m : max),
    null,
  );
  const hasPeak = !!peakMonth && peakMonth.count > 0;

  return (
    <div className="space-y-8">
      {/* 統計卡 */}
      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card padding="default">
            <p className="mb-1 text-xs text-muted-foreground">待審核申請</p>
            <p className="text-3xl font-bold tabular-nums text-amber-500">
              {loading ? "—" : (data?.pending_count ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">筆</p>
          </Card>
          <Card padding="default">
            <p className="mb-1 text-xs text-muted-foreground">本月已核准</p>
            <p className="text-3xl font-bold tabular-nums text-blue-500">
              {loading ? "—" : (data?.approved_this_month ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">筆</p>
          </Card>
          <Card padding="default">
            <p className="mb-1 text-xs text-muted-foreground">員工人數</p>
            <p className="text-3xl font-bold tabular-nums">
              {loading ? "—" : (data?.employee_count ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">人</p>
          </Card>
        </div>
      </section>

      {/* 待審核列表 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">待審核申請</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/review">前往審核</Link>
          </Button>
        </div>
        {loading ? (
          <Card
            padding="default"
            className="animate-pulse text-center text-sm text-muted-foreground"
          >
            載入中…
          </Card>
        ) : !data || data.pending_list.length === 0 ? (
          <Card
            variant="dashed"
            padding="default"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <ClipboardCheck className="size-4" />
            目前沒有待審核的申請
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.pending_list.slice(0, 5).map((r) => {
              const q = LEAVE_QUOTAS[r.type as LeaveType];
              return (
                <Card
                  key={r.id}
                  padding="sm"
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium shrink-0">
                      {r.user_name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 px-2.5 py-0.5 text-xs font-medium",
                        LEAVE_BADGE_ROUNDED,
                        q?.bgColor,
                        q?.textColor,
                      )}
                    >
                      {LEAVE_TYPE_LABEL[r.type as LeaveType]}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {r.hours} 小時
                    </span>
                  </div>
                </Card>
              );
            })}
            {data.pending_count > 5 && (
              <p className="col-span-full text-center text-xs text-muted-foreground">
                還有 {data.pending_count - 5} 筆，
                <Link href="/review" className="underline">
                  前往查看
                </Link>
              </p>
            )}
          </div>
        )}
      </section>

      {/* 每月請假統計：可切換年度，看出哪個月是請假尖峰 */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-semibold">每月請假統計</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y} 年
              </option>
            ))}
          </select>
        </div>

        {hasPeak && peakMonth && (
          <p className="mb-3 text-sm text-muted-foreground">
            請假尖峰月份：
            <span className="font-medium text-foreground">
              {peakMonth.month} 月
            </span>
            （{peakMonth.count} 次請假）
          </p>
        )}

        {monthlyLoading ? (
          <Card
            padding="default"
            className="animate-pulse text-center text-sm text-muted-foreground"
          >
            載入中…
          </Card>
        ) : (
          <Card padding="none" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">月份</th>
                  <th className="px-4 py-3 font-medium">請假次數</th>
                </tr>
              </thead>
              <tbody>
                {(monthlyData?.months ?? []).map((m) => (
                  <tr
                    key={m.month}
                    className={cn(
                      "border-b border-border last:border-0",
                      hasPeak &&
                        m.month === peakMonth?.month &&
                        "bg-amber-50",
                    )}
                  >
                    <td className="px-4 py-2.5 tabular-nums">{m.month} 月</td>
                    <td className="px-4 py-2.5 tabular-nums">{m.count} 次</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}

// 管理者總覽頁（/overview）
export default function OverviewPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">總覽</h1>
      <AdminOverview />
    </div>
  );
}
