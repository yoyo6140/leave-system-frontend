"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { LEAVE_TYPE_LABEL, LEAVE_TYPES, LeaveType } from "@/lib/leave";
import {
  type ApiLeaveRecord,
  useUpdateLeave,
} from "@/features/leaves/hooks";
import { leaveFormSchema } from "@/features/leaves/schema";

interface EditLeaveDialogProps {
  record: ApiLeaveRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

// 編輯請假申請的彈出對話框：載入該筆紀錄資料、表單驗證後呼叫更新 API
export function EditLeaveDialog({
  record,
  onClose,
  onSaved,
}: EditLeaveDialogProps) {
  const updateLeave = useUpdateLeave();
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<LeaveType>("annual");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [hours, setHours] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 每次換一筆要編輯的紀錄，用它的資料重新初始化表單
  useEffect(() => {
    if (!record) return;
    setType(record.type as LeaveType);
    setDateRange({
      from: new Date(record.start_date),
      to: new Date(record.end_date),
    });
    setHours(record.hours);
    setReason(record.reason ?? "");
    setError("");
  }, [record]);

  if (!record || !mounted) return null;

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  // 驗證表單內容，通過才呼叫更新假單 API
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    setError("");

    const parsed = leaveFormSchema.safeParse({
      type,
      startDate,
      endDate,
      hours,
      reason,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "輸入資料有誤");
      return;
    }

    setSaving(true);
    try {
      await updateLeave.mutateAsync({
        id: record.id,
        input: {
          type: parsed.data.type,
          start_date: parsed.data.startDate,
          end_date: parsed.data.endDate || parsed.data.startDate,
          hours: parsed.data.hours,
          reason: parsed.data.reason,
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改假單失敗");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <h2 className="font-semibold">
            {record.status === "已拒絕" ? "重新送出請假申請" : "編輯請假申請"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          {record.status === "已拒絕" && record.review_note && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              拒絕理由：{record.review_note}
            </p>
          )}

          <Field>
            <FieldLabel>假別</FieldLabel>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LeaveType)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LEAVE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>

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
                step={1}
                value={hours}
                onChange={(e) =>
                  setHours(
                    e.target.value === ""
                      ? ""
                      : Math.round(Number(e.target.value)),
                  )
                }
                placeholder="輸入時數"
                required
              />
              <span className="shrink-0 text-sm text-muted-foreground">小時</span>
            </div>
          </Field>

          <Field>
            <FieldLabel>
              請假原因 <span className="text-destructive">*</span>
            </FieldLabel>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="請輸入請假原因"
              rows={3}
              required
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "送出中..."
                : record.status === "已拒絕"
                  ? "重新送出"
                  : "儲存變更"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
