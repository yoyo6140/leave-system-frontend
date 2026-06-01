"use client"

import { type ColumnDef } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { hoursToApproxDays, LEAVE_BADGE_ROUNDED, LEAVE_QUOTAS, LEAVE_STATUS_STYLE, type LeaveRecord, type LeaveStatus } from "@/lib/leave"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export function createColumns(
  onDelete: (id: string) => void,
  isAdmin = false
): ColumnDef<LeaveRecord>[] {
  const cols: ColumnDef<LeaveRecord>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
          aria-label="全選"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          aria-label="選取列"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="假別" />,
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        const q = LEAVE_QUOTAS[type as keyof typeof LEAVE_QUOTAS]
        return (
          <span className={cn(LEAVE_BADGE_ROUNDED, "px-2.5 py-0.5 text-xs font-medium", q?.bgColor, q?.textColor)}>
            {type}
          </span>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="開始日期" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("startDate")}</span>,
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="結束日期" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("endDate")}</span>,
    },
    {
      accessorKey: "hours",
      header: ({ column }) => <DataTableColumnHeader column={column} title="時數" />,
      cell: ({ row }) => {
        const h = row.getValue("hours") as number
        return (
          <span className="tabular-nums">
            {h} 小時
            <span className="ml-1 text-xs text-muted-foreground">（約 {hoursToApproxDays(h)} 天）</span>
          </span>
        )
      },
    },
    {
      accessorKey: "reason",
      header: ({ column }) => <DataTableColumnHeader column={column} title="原因" />,
      cell: ({ row }) => (
        <span className="max-w-[160px] truncate block text-muted-foreground">
          {row.getValue("reason") || "—"}
        </span>
      ),
      filterFn: "includesString",
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="狀態" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <span className={cn(LEAVE_BADGE_ROUNDED, "px-2.5 py-0.5 text-xs font-medium", LEAVE_STATUS_STYLE[status as LeaveStatus])}>
            {status}
          </span>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="申請日期" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleDateString("zh-TW")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <DataTableRowActions row={row} onDelete={onDelete} />,
      enableHiding: false,
    },
  ]

  // 申請人欄位只在 admin 視角插入
  if (isAdmin) {
    cols.splice(1, 0, {
      accessorKey: "username",
      header: ({ column }) => <DataTableColumnHeader column={column} title="申請人" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">@{row.getValue("username")}</span>
      ),
    })
  }

  return cols
}
