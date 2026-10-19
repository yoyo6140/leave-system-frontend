import { useQuery } from "@tanstack/react-query";
import { overviewApi } from "./api";
import { overviewKeys } from "./keys";

export type { OverviewData, PendingLeaveItem, TopLeaveHoursItem } from "./types";

// 查詢管理者總覽頁所需資料的 React Query hook
export function useOverviewQuery() {
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: overviewApi.get,
  });
}
