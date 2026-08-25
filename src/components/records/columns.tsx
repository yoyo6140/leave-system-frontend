"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import {
  hoursToApproxDays,
  LEAVE_BADGE_ROUNDED,
  LEAVE_QUOTAS,
  LEAVE_STATUS_STYLE,
  type LeaveStatus,
} from "@/lib/leave";
import { type ApiLeaveRecord } from "@/api/useLeaves";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export function createColumns(
  /** 不帶 onDelete（例如員工請假紀錄頁）就不顯示「操作」欄位 */
  onDelete?: (id: string) => void,
  isAdmin = false,
  /** 不帶就不顯示「編輯」選項 */
  onEdit?: (record: ApiLeaveRecord) => void,
): ColumnDef<ApiLeaveRecord>[] {
  const cols: ColumnDef<ApiLeaveRecord>[] = [
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="假別" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const q = LEAVE_QUOTAS[type as keyof typeof LEAVE_QUOTAS];
        return (
          <span
            className={cn(
              LEAVE_BADGE_ROUNDED,
              "px-2.5 py-0.5 text-xs font-medium",
              q?.bgColor,
              q?.textColor,
            )}
          >
            {type}
          </span>
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="開始日期" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.getValue("start_date")}</span>
      ),
    },
    {
      accessorKey: "end_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="結束日期" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.getValue("end_date")}</span>
      ),
    },
    {
      accessorKey: "hours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="時數" />
      ),
      cell: ({ row }) => {
        const h = row.getValue("hours") as number;
        return (
          <span className="tabular-nums">
            {h} 小時
            <span className="ml-1 text-xs text-muted-foreground">
              （約 {hoursToApproxDays(h)} 天）
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="原因" />
      ),
      cell: ({ row }) => (
        <span className="max-w-[160px] truncate block text-muted-foreground">
          {row.getValue("reason") || "—"}
        </span>
      ),
      filterFn: "includesString",
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="狀態" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={cn(
              LEAVE_BADGE_ROUNDED,
              "px-2.5 py-0.5 text-xs font-medium",
              LEAVE_STATUS_STYLE[status as LeaveStatus],
            )}
          >
            {status}
          </span>
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="申請日期" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {new Date(row.getValue("created_at")).toLocaleDateString("zh-TW")}
        </span>
      ),
    },
  ];

  if (onDelete) {
    cols.push({
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions row={row} onDelete={onDelete} onEdit={onEdit} />
      ),
      enableHiding: false,
    });
  }

  if (isAdmin) {
    cols.splice(1, 0, {
      accessorKey: "_username",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="申請人" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("_username") as string | undefined;
        return (
          <span className="text-sm font-medium">
            {name ?? `#${row.original.user_id}`}
          </span>
        );
      },
    });
  }

  return cols;
}
