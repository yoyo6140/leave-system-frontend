"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type ApiLeaveRecord, getLeaves, deleteLeave } from "@/api/useLeaves";
import { DataTable } from "@/components/records/data-table";
import { createColumns } from "@/components/records/columns";
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog";

// 個人請假紀錄：不分角色，一律只顯示登入者自己的申請。
// 用 mine=true 交給後端強制篩選（即使是 admin 也只回傳自己的），
// 與 admin 專用的「員工請假紀錄」/employee-records 查詢分開。
export default function RecordsPage() {
  const [records, setRecords] = useState<ApiLeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null);

  // 搜尋框即時輸入 / 實際拿去打 API 的關鍵字（debounce 300ms 再送）
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getLeaves({ limit: 100, mine: true, search });
    if (result.ok) setRecords(result.data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteLeave(id);
      await load();
    },
    [load],
  );

  const columns = useMemo(() => createColumns(handleDelete, false), [handleDelete]);

  return (
    <AppLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">個別請假紀錄</h1>
          <Button asChild size="sm" variant="outline">
            <Link href="/apply">新增申請</Link>
          </Button>
        </div>

        {loading ? (
          <Card
            padding="default"
            className="animate-pulse text-center text-sm text-muted-foreground"
          >
            載入中…
          </Card>
        ) : records.length === 0 && !searchInput ? (
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
          />
        )}
      </div>
      <LeaveDetailDialog
        record={detailRecord}
        isAdmin={false}
        onClose={() => setDetailRecord(null)}
      />
    </AppLayout>
  );
}
