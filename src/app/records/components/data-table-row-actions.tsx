"use client"

import { type Row } from "@tanstack/react-table"
import { MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type LeaveRecordRow } from "../data/schema"

interface DataTableRowActionsProps {
  row: Row<LeaveRecordRow>
  onDelete: (id: string) => void
}

export function DataTableRowActions({ row, onDelete }: DataTableRowActionsProps) {
  return (
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
          onClick={() => onDelete(row.original.id)}
          disabled={row.original.status !== "待審核"}
        >
          <Trash2 className="size-3.5" />
          取消申請
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
