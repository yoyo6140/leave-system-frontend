"use client"

import { type Table } from "@tanstack/react-table"
import { X, Search, SlidersHorizontal, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LEAVE_TYPES } from "@/lib/leave"

const STATUSES = ["待審核", "已通過", "已拒絕"] as const

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    table.getState().globalFilter

  const typeFilter = table.getColumn("type")?.getFilterValue() as string[] | undefined
  const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined

  return (
    <div className="flex items-center justify-between gap-3">
      {/* 搜尋 */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="搜尋原因..."
            value={(table.getColumn("reason")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("reason")?.setFilterValue(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* 假別篩選 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <SlidersHorizontal className="size-3.5" />
              假別
              {typeFilter?.length ? (
                <Badge className="ml-1 px-1.5 py-0 text-xs">{typeFilter.length}</Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuLabel className="text-xs">篩選假別</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LEAVE_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={typeFilter?.includes(type) ?? false}
                onCheckedChange={(checked) => {
                  const current = typeFilter ?? []
                  table.getColumn("type")?.setFilterValue(
                    checked ? [...current, type] : current.filter((v) => v !== type)
                  )
                }}
                className="text-sm"
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 狀態篩選 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <SlidersHorizontal className="size-3.5" />
              狀態
              {statusFilter?.length ? (
                <Badge className="ml-1 px-1.5 py-0 text-xs">{statusFilter.length}</Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            <DropdownMenuLabel className="text-xs">篩選狀態</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter?.includes(status) ?? false}
                onCheckedChange={(checked) => {
                  const current = statusFilter ?? []
                  table.getColumn("status")?.setFilterValue(
                    checked ? [...current, status] : current.filter((v) => v !== status)
                  )
                }}
                className="text-sm"
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter("")
            }}
          >
            清除
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* 欄位顯示 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Eye className="size-3.5" />
            欄位
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuLabel className="text-xs">顯示欄位</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(val) => col.toggleVisibility(val)}
                className="text-sm"
              >
                {col.id === "type" ? "假別"
                  : col.id === "startDate" ? "開始"
                  : col.id === "endDate" ? "結束"
                  : col.id === "hours" ? "時數"
                  : col.id === "reason" ? "原因"
                  : col.id === "status" ? "狀態"
                  : col.id === "createdAt" ? "申請日期"
                  : col.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
