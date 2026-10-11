import { useQuery } from "@tanstack/react-query";
import { overviewApi } from "./api";
import { overviewKeys } from "./keys";

export type { OverviewData, PendingLeaveItem, TopLeaveHoursItem } from "./types";

export function useOverviewQuery() {
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: overviewApi.get,
  });
}
