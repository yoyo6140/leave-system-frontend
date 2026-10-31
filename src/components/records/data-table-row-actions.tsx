"use client";

import { useState } from "react";
import { type Row } from "@tanstack/react-table";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/app-dialog";
import { type ApiLeaveRecord } from "@/features/leaves/hooks";

interface DataTableRowActionsProps {
  row: Row<ApiLeaveRecord>;
  onDelete: (id: string) => void;
  /** 不帶就不顯示「編輯」選項（例如員工請假紀錄頁） */
  onEdit?: (record: ApiLeaveRecord) => void;
}

// 每一列的操作選單（編輯／取消申請），僅「待審核」「已拒絕」狀態可操作，取消前會跳確認對話框
export function DataTableRowActions({
  row,
  onDelete,
  onEdit,
}: DataTableRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 「待審核」「已拒絕」的申請都能編輯／取消（編輯「已拒絕」的會自動重送回待審核），審核通過後就定案了
  const canModify =
    row.original.status === "待審核" || row.original.status === "已拒絕";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">開啟選單</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem
              onClick={() => onEdit(row.original)}
              disabled={!canModify}
            >
              <Edit className="size-3.5" />
              編輯
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={!canModify}
          >
            <Trash2 className="size-3.5" />
            取消申請
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        title="確認取消申請？"
        message="取消後此紀錄狀態會變成「已取消」，無法復原成待審核。"
        confirmLabel="確認取消"
        variant="destructive"
        onConfirm={() => {
          onDelete(row.original.id);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
