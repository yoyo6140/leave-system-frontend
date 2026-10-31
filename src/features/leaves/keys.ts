import type { LeavesQueryParams } from "./types";

export const leaveKeys = {
  all: ["leaves"] as const,
  lists: () => [...leaveKeys.all, "list"] as const,
  list: (params: LeavesQueryParams) => [...leaveKeys.lists(), params] as const,
  statusLogs: (id: string) => [...leaveKeys.all, "status-logs", id] as const,
};
