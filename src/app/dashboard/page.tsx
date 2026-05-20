"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  getUsedHours,
  hoursToApproxDays,
  LEAVE_QUOTAS,
  LEAVE_TYPES,
  LeaveType,
} from "@/lib/leave";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const YEAR = new Date().getFullYear();

type QuotaData = {
  type: LeaveType;
  total: number;
  used: number;
  remaining: number;
  bgColor: string;
  textColor: string;
  barColor: string;
};

export default function DashboardPage() {
  const [quotas, setQuotas] = useState<QuotaData[]>([]);

  useEffect(() => {
    const data = LEAVE_TYPES.map((type) => {
      const { total, bgColor, textColor, barColor } = LEAVE_QUOTAS[type];
      const used = getUsedHours(type);
      return { type, total, used, remaining: total - used, bgColor, textColor, barColor };
    });
    setQuotas(data);
  }, []);

  return (
    <AppLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">假別總覽</h1>
          <span className="text-sm text-muted-foreground">
            {YEAR}/01/01 ~ {YEAR}/12/31
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotas.map(({ type, total, used, remaining, bgColor, textColor, barColor }) => {
            const pct = total > 0 ? Math.round((used / total) * 100) : 0;

            return (
              <Card key={type}>
                {/* 標題列 */}
                <div className="mb-4 flex items-center justify-between">
                  <span className={cn("rounded-lg px-2.5 py-1 text-sm font-medium", bgColor, textColor)}>
                    {type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    共 {total} 小時 / 年
                  </span>
                </div>

                {/* 剩餘時數 */}
                <div className="mb-1">
                  <span className="text-3xl font-bold tabular-nums">{remaining}</span>
                  <span className="ml-1 text-sm text-muted-foreground">小時可用</span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  約 {hoursToApproxDays(remaining)} 天
                </p>

                <p className="text-xs text-muted-foreground">
                  已使用 {used} 小時 · 共 {total} 小時
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
