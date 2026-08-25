"use client";

import { X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps {
  /** 伺服器端關鍵字搜尋（打 API 的 search 參數），不是前端欄位過濾 */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "搜尋原因...",
}: DataTableToolbarProps) {
  const isFiltered = search.length > 0;

  return (
    <div className="flex items-center justify-between gap-3">
      {/* 搜尋（打後端 API，非前端過濾） */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm bg-white"
          />
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={() => onSearchChange("")}
          >
            清除
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
