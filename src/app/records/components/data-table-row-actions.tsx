"use client"

import { useState } from "react"
import { type Row } from "@tanstack/react-table"
import { MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/app-dialog"
import { type LeaveRecordRow } from "../data/schema"

interface DataTableRowActionsProps {
  row: Row<LeaveRecordRow>
  onDelete: (id: string) => void
}

export function DataTableRowActions({ row, onDelete }: DataTableRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const canCancel = row.original.status === "待審核"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">開啟選單</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={!canCancel}
          >
            <Trash2 className="size-3.5" />
            取消申請
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        title="確認取消申請？"
        message="取消後此筆紀錄將刪除，無法復原。"
        confirmLabel="確認取消"
        variant="destructive"
        onConfirm={() => { onDelete(row.original.id); setConfirmOpen(false) }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
