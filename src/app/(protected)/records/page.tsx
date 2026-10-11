"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type ApiLeaveRecord,
  useLeavesQuery,
  useDeleteLeave,
} from "@/features/leaves/hooks";
import { DataTable } from "@/components/records/data-table";
import { createColumns } from "@/components/records/columns";
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog";
import { EditLeaveDialog } from "@/components/records/edit-leave-dialog";

// 個人請假紀錄：不分角色，一律只顯示登入者自己的申請。
// 用 mine=true 交給後端強制篩選（即使是 admin 也只回傳自己的），
// 與 admin 專用的「員工請假紀錄」/employee-records 查詢分開。
export default function RecordsPage() {
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null);
  const [editRecord, setEditRecord] = useState<ApiLeaveRecord | null>(null);

  // 搜尋框即時輸入 / 實際拿去打 API 的關鍵字（debounce 1 秒再送）
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading: loading, refetch } = useLeavesQuery({
    limit: 100,
    mine: true,
    search,
  });
  const records = data?.data ?? [];
  const deleteLeave = useDeleteLeave();

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteLeave.mutateAsync(id);
    },
    [deleteLeave],
  );

  const columns = useMemo(
    () => createColumns(handleDelete, false, setEditRecord),
    [handleDelete],
  );

  return (
    <>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">個別請假紀錄</h1>
          <Button asChild size="sm" variant="outline">
            <Link href="/apply">新增申請</Link>
          </Button>
        </div>

        {!loading && records.length === 0 && !searchInput ? (
          <Card
            variant="dashed"
            padding="none"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">
              尚無請假紀錄
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/apply">立即申請</Link>
            </Button>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            onRowClick={setDetailRecord}
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="搜尋原因..."
            loading={loading}
          />
        )}
      </div>
      <LeaveDetailDialog
        record={detailRecord}
        isAdmin={false}
        onClose={() => setDetailRecord(null)}
      />
      <EditLeaveDialog
        record={editRecord}
        onClose={() => setEditRecord(null)}
        onSaved={() => {
          void refetch();
        }}
      />
    </>
  );
}
