import { useQuery } from "@tanstack/react-query";
import { quotaApi } from "./api";
import { quotaKeys } from "./keys";

export type { LeaveQuotaData, QuotaItem } from "./types";

// 查詢自己假別餘額的 React Query hook
export function useMyQuotaQuery(asOf?: string) {
  return useQuery({
    queryKey: quotaKeys.me(asOf),
    queryFn: () => quotaApi.getMine(asOf),
  });
}
