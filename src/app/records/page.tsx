"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getRecords, LeaveRecord } from "@/lib/leave"
import { DataTable } from "./components/data-table"
import { createColumns } from "./components/columns"

const STORAGE_KEY = "leave_records"

export default function RecordsPage() {
  const [records, setRecords] = useState<LeaveRecord[]>([])

  useEffect(() => {
    setRecords(getRecords())
  }, [])

  const handleDelete = useCallback((id: string) => {
    const updated = records.filter((r) => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setRecords(updated)
  }, [records])

  const columns = useMemo(() => createColumns(handleDelete), [handleDelete])

  return (
    <AppLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">請假紀錄</h1>
          <Button asChild size="sm">
            <Link href="/apply">新增申請</Link>
          </Button>
        </div>

        {records.length === 0 ? (
          <Card variant="dashed" padding="none" className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-muted-foreground">尚無請假紀錄</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/apply">立即申請</Link>
            </Button>
          </Card>
        ) : (
          <DataTable columns={columns} data={records} />
        )}
      </div>
    </AppLayout>
  )
}
