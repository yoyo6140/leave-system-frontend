"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type MonthlyLeaveStat,
  useOverviewMonthlyQuery,
  useOverviewQuery,
} from "@/features/overview/hooks";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);
const MAX_BAR_HEIGHT = 160; // px

// 管理者總覽主要內容：待審核數/本月核准數/員工數統計卡與每月請假次數長條圖
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
  const maxCount = Math.max(0, ...(monthlyData?.months ?? []).map((m) => m.count));

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
          <Card padding="default" className="overflow-x-auto">
            <div className="flex min-w-[480px] items-end gap-2">
              {(monthlyData?.months ?? []).map((m) => {
                const isPeak = hasPeak && m.month === peakMonth?.month;
                const barHeight =
                  maxCount > 0
                    ? Math.max(
                        Math.round((m.count / maxCount) * MAX_BAR_HEIGHT),
                        6,
                      )
                    : 2;
                return (
                  <div
                    key={m.month}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {m.count}
                    </span>
                    <div
                      className={cn(
                        "w-full max-w-10 rounded-t-md transition-all",
                        isPeak ? "bg-blue-600" : "bg-blue-200",
                      )}
                      style={{ height: `${barHeight}px` }}
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {m.month} 月
                    </span>
                  </div>
                );
              })}
            </div>
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
