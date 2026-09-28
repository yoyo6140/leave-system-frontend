"use client";

import { useEffect, useMemo, useState } from "react";

import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import {
  type ApiLeaveRecord,
  useLeavesQuery,
} from "@/hooks/queries/use-leaves";
import { useUsersQuery } from "@/hooks/queries/use-users";
import { DataTable } from "@/components/records/data-table";
import { createColumns } from "@/components/records/columns";
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog";

// 員工請假紀錄：admin 專用，檢視全公司所有員工的請假申請
export default function EmployeeRecordsPage() {
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null);

  // 搜尋框即時輸入 / 實際拿去打 API 的關鍵字（debounce 1 秒再送）
  // admin 查全公司時，後端 search 會一併比對申請人姓名／帳號
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: leavesData, isLoading: leavesLoading } = useLeavesQuery({
    limit: 200,
    search,
  });
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({
    limit: 200,
  });
  const loading = leavesLoading || usersLoading;

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

  return (
    <AppLayout allowedRoles={["admin"]}>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">員工請假紀錄</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            共 {records.length} 筆全公司請假紀錄
          </p>
        </div>

        {!loading && records.length === 0 && !searchInput ? (
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
            loading={loading}
          />
        )}
      </div>
      <LeaveDetailDialog
        record={detailRecord}
        isAdmin
        userMap={userMap}
        onClose={() => setDetailRecord(null)}
      />
    </AppLayout>
  );
}
