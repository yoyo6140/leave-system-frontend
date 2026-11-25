import type { KbDocumentsQueryParams } from "./types";

export const kbKeys = {
  all: ["kb-documents"] as const,
  lists: () => [...kbKeys.all, "list"] as const,
  list: (params: KbDocumentsQueryParams) => [...kbKeys.lists(), params] as const,
  detail: (id: string) => [...kbKeys.all, "detail", id] as const,
};
