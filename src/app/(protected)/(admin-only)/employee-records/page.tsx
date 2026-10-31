"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, SuccessDialog } from "@/components/ui/app-dialog";
import {
  type ApiLeaveRecord,
  useLeavesQuery,
  useUpdateLeaveStatus,
} from "@/features/leaves/hooks";
import { useUsersQuery } from "@/features/users/hooks";
import { DataTable } from "@/components/records/data-table";
import { createColumns } from "@/components/records/columns";
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog";
import { LEAVE_STATUSES } from "@/lib/leave";

const PAGE_SIZE = 12;

// 員工請假紀錄：admin、sup_admin 專用，檢視全公司所有員工的請假申請
// 不提供編輯/取消（別人的紀錄不在此頁動），但「待審核」可直接核准/拒絕、「已通過」可銷假
export default function EmployeeRecordsPage() {
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null);
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeNote, setRevokeNote] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const updateStatus = useUpdateLeaveStatus();

  // 搜尋框即時輸入 / 實際拿去打 API 的關鍵字（debounce 1 秒再送）
  // admin 查全公司時，後端 search 會一併比對申請人姓名／帳號
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  const { data: leavesData, isLoading: leavesLoading } = useLeavesQuery({
    page,
    limit: PAGE_SIZE,
    search,
    status: statusFilter || undefined,
  });
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({
    limit: 200,
  });
  const loading = leavesLoading || usersLoading;

  const total = leavesData?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (!leavesLoading && page > pageCount) setPage(pageCount);
  }, [leavesLoading, page, pageCount]);

  const userMap = useMemo(() => {
    if (!usersData) return {} as Record<number, string>;
    return Object.fromEntries(usersData.data.map((u) => [u.id, u.name]));
  }, [usersData]);

  const records = useMemo(() => {
    const rows = leavesData?.data ?? [];
    return rows.map((r) => ({ ...r, _username: userMap[r.user_id] }));
  }, [leavesData, userMap]);

  // 唯讀列表，不提供取消／刪除操作（別人的紀錄不在此頁動）
  const columns = useMemo(() => createColumns(undefined, true), []);

  // 確認核准：將「待審核」的假單改為「已通過」（審核人由後端從登入者帶入）
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

  // 確認拒絕：將「待審核」的假單改為「已拒絕」，退回理由為必填
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

  // 確認銷假：將「已通過」的假單改為「已銷假」，銷假理由為必填
  async function handleRevokeConfirm() {
    if (!revokeTarget || !revokeNote.trim()) return;
    try {
      await updateStatus.mutateAsync({
        id: revokeTarget,
        input: {
          status: "已銷假",
          review_note: revokeNote.trim(),
        },
      });
      setRevokeTarget(null);
      setRevokeNote("");
      setDetailRecord(null);
      setSuccessMsg("已完成銷假");
    } catch {
      // mutation throws; keep dialog open
    }
  }

  return (
    <>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">員工請假紀錄</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            共 {total} 筆全公司請假紀錄
          </p>
        </div>

        {!loading && records.length === 0 && !searchInput && !statusFilter ? (
          <Card
            variant="dashed"
            padding="none"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">
              尚無任何員工的請假紀錄
            </p>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            onRowClick={setDetailRecord}
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="搜尋姓名、帳號或原因..."
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            statusOptions={LEAVE_STATUSES}
            loading={loading}
            pageSize={PAGE_SIZE}
            serverPagination={{
              page,
              total,
              onPageChange: setPage,
            }}
          />
        )}
      </div>
      <LeaveDetailDialog
        record={detailRecord}
        isAdmin
        userMap={userMap}
        onClose={() => setDetailRecord(null)}
        footerActions={
          detailRecord?.status === "待審核" ? (
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
              <Button
                size="sm"
                onClick={() => setApproveTarget(detailRecord.id)}
              >
                <Check className="size-3.5" />
                核准
              </Button>
            </>
          ) : (
            detailRecord?.status === "已通過" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRevokeNote("");
                  setRevokeTarget(detailRecord.id);
                }}
              >
                <RotateCcw className="size-3.5" />
                銷假
              </Button>
            )
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
      <ConfirmDialog
        open={!!revokeTarget}
        title="確認銷假？"
        message="銷假後假期將取消生效，此操作無法復原。請填寫銷假理由："
        confirmLabel="確認銷假"
        variant="destructive"
        confirmDisabled={!revokeNote.trim()}
        loading={updateStatus.isPending}
        onConfirm={handleRevokeConfirm}
        onCancel={() => {
          setRevokeTarget(null);
          setRevokeNote("");
        }}
      >
        <textarea
          value={revokeNote}
          onChange={(e) => setRevokeNote(e.target.value)}
          placeholder="請輸入銷假理由"
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
        />
      </ConfirmDialog>
    </>
  );
}
