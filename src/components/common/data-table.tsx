"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

const DEFAULT_PAGE_SIZE = 12;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  /** 伺服器端關鍵字搜尋（呼叫端已經用 API 的 search 參數篩過 data） */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** 伺服器端狀態篩選（呼叫端已經用 API 的 status 參數篩過 data）；不帶就不顯示下拉選單 */
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  statusOptions?: readonly string[];
  /** 資料重新載入中；只換表格內容，搜尋框繼續掛著、不會被卸載掉焦點 */
  loading?: boolean;
  /** 每頁筆數，預設 12 */
  pageSize?: number;
  /**
   * 伺服器分頁：data 已是當頁資料。
   * page 為 1-based；未傳則使用前端表格分頁。
   */
  serverPagination?: {
    page: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

// 通用資料表格：整合搜尋列、排序、欄位顯示與分頁（支援前端分頁或伺服器端分頁兩種模式）
export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  search,
  onSearchChange,
  searchPlaceholder,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  loading = false,
  pageSize = DEFAULT_PAGE_SIZE,
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pageIndex, setPageIndex] = React.useState(0);

  const isServer = !!serverPagination;
  const serverPageIndex = serverPagination
    ? Math.max(serverPagination.page - 1, 0)
    : pageIndex;
  const serverPageCount = serverPagination
    ? Math.max(1, Math.ceil(serverPagination.total / pageSize))
    : undefined;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: isServer ? serverPageIndex : pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const prev = {
        pageIndex: isServer ? serverPageIndex : pageIndex,
        pageSize,
      };
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isServer) {
        serverPagination.onPageChange(next.pageIndex + 1);
      } else {
        setPageIndex(next.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(isServer
      ? {
          manualPagination: true,
          pageCount: serverPageCount,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
        }),
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        statusOptions={statusOptions}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <span className="animate-pulse">載入中…</span>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick?.(row.original)}
                    className={onRowClick ? "cursor-pointer" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={
                          cell.column.id === "select" ||
                          cell.column.id === "actions"
                            ? (e) => e.stopPropagation()
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    沒有符合條件的紀錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination
        table={table}
        totalRows={serverPagination?.total}
      />
    </div>
  );
}
