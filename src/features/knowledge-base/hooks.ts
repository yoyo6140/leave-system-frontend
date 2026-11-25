import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kbApi } from "./api";
import { kbKeys } from "./keys";
import type {
  KbDocumentUpdateInput,
  KbDocumentsQueryParams,
} from "./types";

export type {
  ApiKbDocument,
  ApiKbDocumentDetail,
  KbDocumentCreateInput,
  KbDocumentListData,
  KbDocumentStatus,
  KbDocumentType,
  KbDocumentUpdateInput,
  KbDocumentsQueryParams,
} from "./types";

// 查詢知識庫文件列表；只要還有文件狀態是 processing，每 3 秒自動重新抓取，
// 直到全部變成 ready/failed 才停止輪詢
export function useKbDocumentsQuery(params: KbDocumentsQueryParams = {}) {
  return useQuery({
    queryKey: kbKeys.list(params),
    queryFn: () => kbApi.getList(params),
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.data.some(
        (doc) => doc.status === "processing",
      );
      return hasProcessing ? 3000 : false;
    },
  });
}

// 查詢單一文件的完整內容，編輯視窗開啟時用來預填 content；只有拿到 id 才會發請求
export function useKbDocumentDetail(id: string | undefined) {
  return useQuery({
    queryKey: kbKeys.detail(id ?? ""),
    queryFn: () => kbApi.getDetail(id as string),
    enabled: !!id,
  });
}

// 文件異動後，讓知識庫相關快取失效以重新抓取最新資料
function useInvalidateKbRelated() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: kbKeys.all });
}

// 新增文件的 mutation hook，成功後刷新列表
export function useCreateKbDocument() {
  const invalidate = useInvalidateKbRelated();
  return useMutation({
    mutationFn: kbApi.create,
    onSuccess: () => invalidate(),
  });
}

// 編輯文件的 mutation hook，成功後刷新列表
export function useUpdateKbDocument() {
  const invalidate = useInvalidateKbRelated();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: KbDocumentUpdateInput }) =>
      kbApi.update(id, input),
    onSuccess: () => invalidate(),
  });
}

// 刪除文件的 mutation hook，成功後刷新列表
export function useDeleteKbDocument() {
  const invalidate = useInvalidateKbRelated();
  return useMutation({
    mutationFn: kbApi.delete,
    onSuccess: () => invalidate(),
  });
}

// 重試失敗文件的 mutation hook，成功後刷新列表
export function useRetryKbDocument() {
  const invalidate = useInvalidateKbRelated();
  return useMutation({
    mutationFn: kbApi.retry,
    onSuccess: () => invalidate(),
  });
}
