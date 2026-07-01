"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Users } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEAVE_BADGE_ROUNDED, LEAVE_QUOTAS, LeaveType } from "@/lib/leave";
import { cn } from "@/lib/utils";
import { getOverview, type OverviewData } from "@/api/useOverview";

function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview().then((res) => {
      if (res.ok) setData(res.data);
      setLoading(false);
    });
  }, []);

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            <div className="flex flex-col gap-2">
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
                        {r.type}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {r.hours} 小時
                      </span>
                    </div>
                  </Card>
                );
              })}
              {data.pending_count > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  還有 {data.pending_count - 5} 筆，
                  <Link href="/review" className="underline">
                    前往查看
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>

        {/* 員工年請假總時數 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">員工年請假總時數</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/employees">員工管理</Link>
            </Button>
          </div>
          {loading ? (
            <Card
              padding="default"
              className="animate-pulse text-center text-sm text-muted-foreground"
            >
              載入中…
            </Card>
          ) : !data || data.top_leave_hours.length === 0 ? (
            <Card
              variant="dashed"
              padding="default"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Users className="size-4" />
              尚無員工年請假資料
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {data.top_leave_hours.map((emp) => (
                <Card
                  key={emp.user_id}
                  padding="sm"
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      年請假總時數：{emp.hours} 小時
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <AppLayout allowedRoles={["admin"]}>
      <div>
        <h1 className="mb-6 text-xl font-semibold">總覽</h1>
        <AdminOverview />
      </div>
    </AppLayout>
  );
}
