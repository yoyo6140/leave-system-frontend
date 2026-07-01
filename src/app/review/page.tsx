"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SuccessDialog, ConfirmDialog } from "@/components/ui/app-dialog";
import { cn } from "@/lib/utils";
import { LEAVE_BADGE_ROUNDED, LEAVE_QUOTAS } from "@/lib/leave";
import { getCurrentUser } from "@/lib/auth";
import {
  type ApiLeaveRecord,
  getLeaves,
  updateLeaveStatus,
} from "@/api/useLeaves";
import { getUsers } from "@/api/useUsers";

export default function ReviewPage() {
  const currentUser = getCurrentUser();

  const [records, setRecords] = useState<ApiLeaveRecord[]>([]);
  const [userMap, setUserMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [leavesResult, usersResult] = await Promise.all([
      getLeaves({ limit: 200 }),
      getUsers({ limit: 200 }),
    ]);
    if (leavesResult.ok) setRecords(leavesResult.data.data);
    if (usersResult.ok) {
      const map = Object.fromEntries(
        usersResult.data.data.map((u) => [u.id, u.name]),
      );
      setUserMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = records.filter((r) => r.status === "待審核");
  const approved = records.filter((r) => r.status === "已通過").length;
  const rejected = records.filter((r) => r.status === "已拒絕").length;

  async function handleApproveConfirm() {
    if (!approveTarget) return;
    const result = await updateLeaveStatus(approveTarget, {
      status: "已通過",
      reviewer: currentUser?.name ?? "admin",
    });
    if (result.ok) {
      setApproveTarget(null);
      setSuccessMsg("申請已核准");
      await load();
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    const result = await updateLeaveStatus(rejectTarget, {
      status: "已拒絕",
      reviewer: currentUser?.name ?? "admin",
    });
    if (result.ok) {
      setRejectTarget(null);
      await load();
    }
  }

  return (
    <AppLayout allowedRoles={["admin"]}>
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
                <Card key={record.id} padding="default">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={cn(
                          "shrink-0 px-2.5 py-0.5 text-xs font-medium",
                          LEAVE_BADGE_ROUNDED,
                          q?.bgColor,
                          q?.textColor,
                        )}
                      >
                        {record.type}
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

                    <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                      <Button
                        size="sm"
                        onClick={() => setApproveTarget(record.id)}
                      >
                        <Check className="size-3.5" />
                        核准
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectTarget(record.id)}
                      >
                        <X className="size-3.5" />
                        拒絕
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

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
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveTarget(null)}
      />
      <ConfirmDialog
        open={!!rejectTarget}
        title="確認拒絕？"
        message="拒絕後將通知員工，此操作無法復原。"
        confirmLabel="確認拒絕"
        variant="destructive"
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />
    </AppLayout>
  );
}
