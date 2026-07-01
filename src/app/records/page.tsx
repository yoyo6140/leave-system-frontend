"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { type ApiLeaveRecord, getLeaves, deleteLeave } from "@/api/useLeaves"
import { getUsers } from "@/api/useUsers"
import { DataTable } from "@/components/records/data-table"
import { createColumns } from "@/components/records/columns"
import { LeaveDetailDialog } from "@/components/records/leave-detail-dialog"

export default function RecordsPage() {
  const user    = getCurrentUser()
  const isAdmin = user?.role === "admin"

  const [records,      setRecords]      = useState<ApiLeaveRecord[]>([])
  const [loading,      setLoading]      = useState(true)
  const [detailRecord, setDetailRecord] = useState<ApiLeaveRecord | null>(null)
  const [userMap,      setUserMap]      = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getLeaves({ limit: 100 })
    if (!result.ok) { setLoading(false); return }

    let rows = result.data.data

    if (isAdmin) {
      const usersResult = await getUsers({ limit: 200 })
      if (usersResult.ok) {
        const map = Object.fromEntries(usersResult.data.data.map((u) => [u.id, u.username]))
        const nameMap = Object.fromEntries(usersResult.data.data.map((u) => [u.id, u.name]))
        rows = rows.map((r) => ({ ...r, _username: map[r.user_id] }))
        setUserMap(nameMap)
      }
    }

    setRecords(rows)
    setLoading(false)
  }, [isAdmin])

  useEffect(() => { load() }, [load])

  const handleDelete = useCallback(async (id: string) => {
    await deleteLeave(id)
    await load()
  }, [load])

  const columns = useMemo(() => createColumns(handleDelete, isAdmin), [handleDelete, isAdmin])

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
          <Card padding="default" className="animate-pulse text-center text-sm text-muted-foreground">載入中…</Card>
        ) : records.length === 0 ? (
          <Card variant="dashed" padding="none" className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-muted-foreground">尚無請假紀錄</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/apply">立即申請</Link>
            </Button>
          </Card>
        ) : (
          <DataTable columns={columns} data={records} onRowClick={setDetailRecord} />
        )}
      </div>
      <LeaveDetailDialog
        record={detailRecord}
        isAdmin={isAdmin}
        userMap={userMap}
        onClose={() => setDetailRecord(null)}
      />
    </AppLayout>
  )
}
