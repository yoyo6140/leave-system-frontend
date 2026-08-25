"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser, restoreSession, type User } from "@/lib/auth";
import { type ApiLeaveRecord, getLeaves, deleteLeave } from "@/api/useLeaves";
import { DataTable } from "@/components/records/data-table";
import { createColumns } from "@/components/records/columns";
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog";

// 個人請假紀錄：不分角色，一律只顯示登入者自己的申請
// （員工管理全公司紀錄請至「員工請假紀錄」/employee-records，僅 admin 可見）
export default function RecordsPage() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [records, setRecords] = useState<ApiLeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null);

  // 確保拿到含 id 的最新使用者資料，才能篩出「自己的」紀錄
  useEffect(() => {
    let cancelled = false;
    restoreSession().then((fresh) => {
      if (!cancelled && fresh) setUser(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const userId = user?.id;

  const load = useCallback(async () => {
    if (userId == null) return;
    setLoading(true);
    const result = await getLeaves({ limit: 100 });
    if (!result.ok) {
      setLoading(false);
      return;
    }
    setRecords(result.data.data.filter((r) => r.user_id === userId));
    setLoading(false);
  }, [userId]);

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
          <h1 className="text-xl font-semibold">請假紀錄</h1>
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
        ) : records.length === 0 ? (
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
