"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  hoursToApproxDays,
  LEAVE_BADGE_ROUNDED,
  LEAVE_QUOTAS,
  LEAVE_STATUS_STYLE,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/leave";
import { type ApiLeaveRecord } from "@/features/leaves/hooks";
import { Button } from "../ui/button";

interface LeaveDetailDialogProps {
  record: ApiLeaveRecord | null;
  isAdmin?: boolean;
  userMap?: Record<number, string>;
  onClose: () => void;
  /** 額外的頁尾按鈕（例如審核管理的核准／拒絕），排在「關閉」左邊 */
  footerActions?: React.ReactNode;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="w-20 shrink-0 text-xs text-muted-foreground pt-0.5">
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function LeaveDetailDialog({
  record,
  isAdmin,
  userMap,
  onClose,
  footerActions,
}: LeaveDetailDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!record || !mounted) return null;

  const q = LEAVE_QUOTAS[record.type as LeaveType];
  const status = record.status as LeaveStatus;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <h2 className="font-semibold">請假詳情</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-2">
          <Row label="假別">
            <span
              className={cn(
                LEAVE_BADGE_ROUNDED,
                "px-2.5 py-0.5 text-xs font-medium",
                q?.bgColor,
                q?.textColor,
              )}
            >
              {record.type}
            </span>
          </Row>

          <Row label="狀態">
            <span
              className={cn(
                LEAVE_BADGE_ROUNDED,
                "px-2.5 py-0.5 text-xs font-medium",
                LEAVE_STATUS_STYLE[status],
              )}
            >
              {record.status}
            </span>
          </Row>

          {isAdmin && (
            <Row label="申請人">
              {userMap?.[record.user_id]
                ? userMap[record.user_id]
                : record._username
                  ? `@${record._username}`
                  : `#${record.user_id}`}
            </Row>
          )}

          <Row label="請假日期">
            <span className="tabular-nums">
              {record.start_date}
              {record.end_date !== record.start_date &&
                ` ～ ${record.end_date}`}
            </span>
          </Row>

          <Row label="請假時數">
            <span className="tabular-nums">
              {record.hours} 小時
              <span className="ml-1 text-xs text-muted-foreground">
                （約 {hoursToApproxDays(record.hours)} 天）
              </span>
            </span>
          </Row>

          <Row label="請假原因">
            {record.reason || <span className="text-muted-foreground">無</span>}
          </Row>

          <Row label="審核人">
            {record.reviewer || (
              <span className="text-muted-foreground">尚未審核</span>
            )}
          </Row>

          <Row label="申請時間">
            <span className="tabular-nums">
              {new Date(record.created_at).toLocaleString("zh-TW")}
            </span>
          </Row>

          {record.updated_at && (
            <Row label="更新時間">
              <span className="tabular-nums">
                {new Date(record.updated_at).toLocaleString("zh-TW")}
              </span>
            </Row>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 flex justify-end gap-2">
          {footerActions}
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
