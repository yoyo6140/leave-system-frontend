"use client";

import { type Table } from "@tanstack/react-table";
import { X, Search, SlidersHorizontal, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LEAVE_TYPES } from "@/lib/leave";

const STATUSES = ["待審核", "已通過", "已拒絕"] as const;

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter;

  const typeFilter = table.getColumn("type")?.getFilterValue() as
    string[] | undefined;
  const statusFilter = table.getColumn("status")?.getFilterValue() as
    string[] | undefined;

  return (
    <div className="flex items-center justify-between gap-3">
      {/* 搜尋 */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="搜尋原因..."
            value={
              (table.getColumn("reason")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("reason")?.setFilterValue(e.target.value)
            }
            className="pl-8 h-8 text-sm"
          />
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
          >
            清除
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
