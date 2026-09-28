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
import { type ApiLeaveRecord } from "@/hooks/queries/use-leaves";

interface DataTableRowActionsProps {
  row: Row<ApiLeaveRecord>;
  onDelete: (id: string) => void;
  /** 不帶就不顯示「編輯」選項（例如員工請假紀錄頁） */
  onEdit?: (record: ApiLeaveRecord) => void;
}

export function DataTableRowActions({
  row,
  onDelete,
  onEdit,
}: DataTableRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 只有「待審核」的申請能編輯／取消，審核完成後就定案了
  const canCancel = row.original.status === "待審核";

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
              disabled={!canCancel}
            >
              <Edit className="size-3.5" />
              編輯
            </DropdownMenuItem>
          )}
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
