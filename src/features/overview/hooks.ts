import { useQuery } from "@tanstack/react-query";
import { overviewApi } from "./api";
import { overviewKeys } from "./keys";

export type {
  MonthlyLeaveStat,
  MonthlyLeaveStatsData,
  OverviewData,
  PendingLeaveItem,
} from "./types";

// 查詢管理者總覽頁所需資料的 React Query hook
export function useOverviewQuery() {
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: overviewApi.get,
  });
}

// 查詢指定年度每月請假統計的 React Query hook
export function useOverviewMonthlyQuery(year: number) {
  return useQuery({
    queryKey: overviewKeys.monthly(year),
    queryFn: () => overviewApi.getMonthly(year),
  });
}
