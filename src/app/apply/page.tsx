"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { type DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  addRecord,
  getUsedHours,
  hoursToApproxDays,
  LEAVE_QUOTAS,
  LEAVE_TYPES,
  LeaveType,
} from "@/lib/leave";

export default function ApplyPage() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>("特休");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [hours, setHours] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<Record<LeaveType, number>>(
    () => Object.fromEntries(LEAVE_TYPES.map((t) => [t, LEAVE_QUOTAS[t].total])) as Record<LeaveType, number>
  );

  useEffect(() => {
    const data = {} as Record<LeaveType, number>;
    LEAVE_TYPES.forEach((t) => {
      data[t] = LEAVE_QUOTAS[t].total - getUsedHours(t);
    });
    setRemaining(data);
  }, []);

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!startDate) {
      setError("請選擇請假日期");
      return;
    }
    if (!hours || Number(hours) <= 0) {
      setError("請填寫請假時數");
      return;
    }
    if (Number(hours) > remaining[type]) {
      setError(`${type}剩餘時數不足（剩餘 ${remaining[type]} 小時，申請 ${hours} 小時）`);
      return;
    }

    addRecord({
      type,
      startDate,
      endDate: endDate || startDate,
      hours: Number(hours),
      reason,
    });
    router.push("/records");
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="mb-6 text-xl font-semibold">申請請假</h1>
        <Card asChild padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* 假別 */}
            <Field>
              <FieldLabel>假別</FieldLabel>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}（剩餘 {remaining[t]} 小時 / 約 {hoursToApproxDays(remaining[t])} 天）
                  </option>
                ))}
              </select>
            </Field>

            {/* 日期範圍 */}
            <Field>
              <FieldLabel>請假日期</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start px-3 font-normal text-left"
                  >
                    <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy/MM/dd", { locale: zhTW })}
                          {" — "}
                          {format(dateRange.to, "yyyy/MM/dd", { locale: zhTW })}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy/MM/dd", { locale: zhTW })
                      )
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

            {/* 時數 */}
            <Field>
              <FieldLabel>請假時數</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={remaining[type]}
                  value={hours}
                  onChange={(e) =>
                    setHours(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="輸入時數"
                  className="w-32"
                  required
                />
                <span className="text-sm text-muted-foreground">
                  小時
                  {hours !== "" && Number(hours) > 0 && (
                    <span className="ml-1">
                      （約 {hoursToApproxDays(Number(hours))} 天）
                    </span>
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {type} 剩餘 {remaining[type]} 小時可申請
              </p>
            </Field>

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
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" variant="success">送出申請</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
