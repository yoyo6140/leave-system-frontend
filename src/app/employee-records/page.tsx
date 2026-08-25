"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { type ApiLeaveRecord, getLeaves, deleteLeave } from "@/api/useLeaves";
import { getUsers } from "@/api/useUsers";
import { DataTable } from "@/components/records/data-table";
import { createColumns } from "@/components/records/columns";
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog";

// 員工請假紀錄：admin 專用，檢視全公司所有員工的請假申請
export default function EmployeeRecordsPage() {
  const [records, setRecords] = useState<ApiLeaveRecord[]>([]);
  const [userMap, setUserMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [leavesResult, usersResult] = await Promise.all([
      getLeaves({ limit: 200 }),
      getUsers({ limit: 200 }),
    ]);

    if (!leavesResult.ok) {
      setLoading(false);
      return;
    }

    let rows = leavesResult.data.data;
    if (usersResult.ok) {
      const nameMap = Object.fromEntries(
        usersResult.data.data.map((u) => [u.id, u.name]),
      );
      rows = rows.map((r) => ({ ...r, _username: nameMap[r.user_id] }));
      setUserMap(nameMap);
    }

    setRecords(rows);
    setLoading(false);
  }, []);

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

  const columns = useMemo(
    () => createColumns(handleDelete, true),
    [handleDelete],
  );

  return (
    <AppLayout allowedRoles={["admin"]}>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">員工請假紀錄</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            共 {records.length} 筆全公司請假紀錄
          </p>
        </div>

        {loading ? (
          <Card
            padding="default"
            className="animate-pulse text-center text-sm text-muted-foreground"
          >
            載入中…
          </Card>
        ) : records.length === 0 ? (
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
