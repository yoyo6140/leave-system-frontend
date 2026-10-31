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
  LEAVE_TYPE_LABEL,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/leave";
import {
  type ApiLeaveRecord,
  type LeaveStatusLog,
  useLeaveStatusLogsQuery,
} from "@/features/leaves/hooks";
import { Button } from "../ui/button";

interface LeaveDetailDialogProps {
  record: ApiLeaveRecord | null;
  isAdmin?: boolean;
  userMap?: Record<number, string>;
  onClose: () => void;
  /** 額外的頁尾按鈕（例如審核管理的核准／拒絕），排在「關閉」左邊 */
  footerActions?: React.ReactNode;
}

// 異動紀錄的 action -> 中文顯示（舊資料可能沒有 action，由 from_status 推斷）
const ACTION_LABEL: Record<string, string> = {
  create: "建立申請",
  update: "編輯",
  resubmit: "重新送出",
  approve: "核准",
  reject: "退回",
  cancel: "取消",
  revoke: "銷假",
};

function describeAction(log: LeaveStatusLog): string {
  if (log.action && ACTION_LABEL[log.action]) return ACTION_LABEL[log.action];
  if (!log.from_status) return "建立申請";
  return `${log.from_status} → ${log.to_status}`;
}

// 異動紀錄面板：單筆假單的狀態變更歷史（建立、編輯、審核、取消、銷假）
function StatusLogPanel({
  recordId,
  applicantId,
  userMap,
}: {
  recordId: string;
  applicantId: number;
  userMap?: Record<number, string>;
}) {
  const { data: logs, isLoading } = useLeaveStatusLogsQuery(recordId);

  function nameOf(userId: number): string {
    if (userMap?.[userId]) return userMap[userId];
    if (userId === applicantId) return "申請人本人";
    return `#${userId}`;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">異動紀錄</h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : !logs || logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無異動紀錄</p>
      ) : (
        <ol className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
          {logs.map((log) => (
            <li key={log.id} className="border-l-2 border-border pl-3 text-sm">
              <p className="font-medium">{describeAction(log)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {new Date(log.changed_at).toLocaleString("zh-TW")}・
                {nameOf(log.changed_by)}
              </p>
              {log.note && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  理由：{log.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// 詳情對話框裡「標籤 + 內容」的單行顯示元件
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

// 顯示單筆請假紀錄完整詳情的彈出對話框（唯讀），可傳入額外頁尾按鈕做審核操作
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
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-4 lg:grid-cols-2">
          <div>
            <Row label="假別">
              <span
                className={cn(
                  LEAVE_BADGE_ROUNDED,
                  "px-2.5 py-0.5 text-xs font-medium",
                  q?.bgColor,
                  q?.textColor,
                )}
              >
                {LEAVE_TYPE_LABEL[record.type as LeaveType]}
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
              {record.reason || (
                <span className="text-muted-foreground">無</span>
              )}
            </Row>

            <Row label="審核人">
              {record.reviewer || (
                <span className="text-muted-foreground">尚未審核</span>
              )}
            </Row>

            {record.review_note && (
              <Row label="審核備註">{record.review_note}</Row>
            )}

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

          <div className="border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <StatusLogPanel
              recordId={record.id}
              applicantId={record.user_id}
              userMap={userMap}
            />
          </div>
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
