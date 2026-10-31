"use client";

import { X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps {
  /** 伺服器端關鍵字搜尋（打 API 的 search 參數），不是前端欄位過濾 */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** 伺服器端狀態篩選（打 API 的 status 參數）；不帶這組 props 就不顯示下拉選單 */
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  statusOptions?: readonly string[];
}

// 表格上方的搜尋欄 + 狀態篩選下拉（都是打後端 API 的參數，非前端過濾），有值時顯示清除按鈕
export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "搜尋原因...",
  statusFilter = "",
  onStatusFilterChange,
  statusOptions = [],
}: DataTableToolbarProps) {
  const isFiltered = search.length > 0 || statusFilter.length > 0;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-1 items-center gap-2">
        {/* 搜尋（打後端 API，非前端過濾） */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm bg-white"
          />
        </div>

        {/* 狀態篩選（打後端 API，非前端過濾） */}
        {onStatusFilterChange && (
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-8 rounded-lg border border-input bg-white px-2 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
          >
            <option value="">全部狀態</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange?.("");
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
