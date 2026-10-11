import { useQuery } from "@tanstack/react-query";
import { quotaApi } from "./api";
import { quotaKeys } from "./keys";

export type { LeaveQuotaData, QuotaItem } from "./types";

export function useMyQuotaQuery(asOf?: string) {
  return useQuery({
    queryKey: quotaKeys.me(asOf),
    queryFn: () => quotaApi.getMine(asOf),
  });
}
