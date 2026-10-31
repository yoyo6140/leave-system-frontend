"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SuccessDialog, ConfirmDialog } from "@/components/ui/app-dialog";
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog";
import { cn } from "@/lib/utils";
import {
  LEAVE_BADGE_ROUNDED,
  LEAVE_QUOTAS,
  LEAVE_TYPE_LABEL,
  type LeaveType,
} from "@/lib/leave";
import {
  type ApiLeaveRecord,
  useLeavesQuery,
  useUpdateLeaveStatus,
} from "@/features/leaves/hooks";
import { useUsersQuery } from "@/features/users/hooks";

// 審核管理頁：列出所有待審核的請假申請，點擊可開詳情並核准/拒絕
export default function ReviewPage() {
  const [successMsg, setSuccessMsg] = useState("");
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null);
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: leavesData, isLoading: leavesLoading } = useLeavesQuery({
    limit: 200,
  });
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({
    limit: 200,
  });
  const updateStatus = useUpdateLeaveStatus();
  const loading = leavesLoading || usersLoading;

  const records = leavesData?.data ?? [];
  const userMap = useMemo(() => {
    if (!usersData) return {} as Record<number, string>;
    return Object.fromEntries(usersData.data.map((u) => [u.id, u.name]));
  }, [usersData]);

  const pending = records.filter((r) => r.status === "待審核");

  // 確認核准：更新假單狀態為「已通過」（審核人由後端從登入者帶入）
  async function handleApproveConfirm() {
    if (!approveTarget) return;
    try {
      await updateStatus.mutateAsync({
        id: approveTarget,
        input: {
          status: "已通過",
        },
      });
      setApproveTarget(null);
      setDetailRecord(null);
      setSuccessMsg("申請已核准");
    } catch {
      // mutation throws; keep dialog open
    }
  }

  // 確認拒絕：更新假單狀態為「已拒絕」，退回理由為必填
  async function handleRejectConfirm() {
    if (!rejectTarget || !rejectNote.trim()) return;
    try {
      await updateStatus.mutateAsync({
        id: rejectTarget,
        input: {
          status: "已拒絕",
          review_note: rejectNote.trim(),
        },
      });
      setRejectTarget(null);
      setRejectNote("");
      setDetailRecord(null);
    } catch {
      // mutation throws; keep dialog open
    }
  }

  return (
    <>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">審核管理</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            待審核 {pending.length} 筆
          </p>
        </div>

        {loading ? (
          <Card
            padding="default"
            className="animate-pulse text-center text-sm text-muted-foreground"
          >
            載入中…
          </Card>
        ) : pending.length === 0 ? (
          <Card
            variant="dashed"
            padding="none"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Check className="mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              目前沒有待審核的申請
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((record) => {
              const q = LEAVE_QUOTAS[record.type as keyof typeof LEAVE_QUOTAS];
              const name = userMap[record.user_id] ?? `#${record.user_id}`;
              return (
                <Card
                  key={record.id}
                  padding="default"
                  className="cursor-pointer transition-colors hover:bg-accent/40"
                  onClick={() => setDetailRecord(record)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={cn(
                          "shrink-0 px-2.5 py-0.5 text-xs font-medium",
                          LEAVE_BADGE_ROUNDED,
                          q?.bgColor,
                          q?.textColor,
                        )}
                      >
                        {LEAVE_TYPE_LABEL[record.type as LeaveType]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          <span className="mr-2 text-xs text-muted-foreground">
                            {name}
                          </span>
                          {record.start_date} ～ {record.end_date}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {record.hours} 小時
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          申請時間：
                          {new Date(record.created_at).toLocaleDateString(
                            "zh-TW",
                          )}
                          {record.reason && (
                            <span className="ml-2">・{record.reason}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <LeaveDetailDialog
        record={detailRecord}
        isAdmin
        userMap={userMap}
        onClose={() => setDetailRecord(null)}
        footerActions={
          detailRecord && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRejectNote("");
                  setRejectTarget(detailRecord.id);
                }}
              >
                <X className="size-3.5" />
                拒絕
              </Button>
              <Button size="sm" onClick={() => setApproveTarget(detailRecord.id)}>
                <Check className="size-3.5" />
                核准
              </Button>
            </>
          )
        }
      />

      <SuccessDialog
        open={!!successMsg}
        title="成功"
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
      <ConfirmDialog
        open={!!approveTarget}
        title="確認核准？"
        message="核准後員工假期將生效，此操作無法復原。"
        confirmLabel="確認核准"
        loading={updateStatus.isPending}
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveTarget(null)}
      />
      <ConfirmDialog
        open={!!rejectTarget}
        title="確認拒絕？"
        message="拒絕後將通知員工，此操作無法復原。請填寫拒絕理由："
        confirmLabel="確認拒絕"
        variant="destructive"
        confirmDisabled={!rejectNote.trim()}
        loading={updateStatus.isPending}
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          setRejectTarget(null);
          setRejectNote("");
        }}
      >
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="請輸入拒絕理由"
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
        />
      </ConfirmDialog>
    </>
  );
}
