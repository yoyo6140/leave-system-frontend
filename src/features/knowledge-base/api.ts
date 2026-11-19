import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiFetch } from "@/lib/api-client";
import type {
  ApiKbDocument,
  KbDocumentCreateInput,
  KbDocumentListData,
  KbDocumentUpdateInput,
  KbDocumentsQueryParams,
} from "./types";

export const kbApi = {
  // 查詢知識庫文件列表，支援分頁
  getList: async (
    params: KbDocumentsQueryParams = {},
  ): Promise<KbDocumentListData> => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const url = qs.size
      ? `${API_ENDPOINTS.kb.list}?${qs}`
      : API_ENDPOINTS.kb.list;
    const res = await apiFetch<KbDocumentListData>(url);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "查詢知識庫文件失敗");
  },

  // 新增文件：直接貼上文字內容，後端會依 type 自動切段、向量化
  create: async (input: KbDocumentCreateInput): Promise<ApiKbDocument> => {
    const res = await apiFetch<ApiKbDocument>(API_ENDPOINTS.kb.create, {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "新增文件失敗");
  },

  // 修改文件：title/content/type 皆可選填，content 或 type 有變動才重新向量化
  update: async (
    id: string,
    input: KbDocumentUpdateInput,
  ): Promise<ApiKbDocument> => {
    const res = await apiFetch<ApiKbDocument>(API_ENDPOINTS.kb.update(id), {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "修改文件失敗");
  },

  // 刪除文件，連同底下所有段落一起刪除
  delete: async (id: string): Promise<void> => {
    const res = await apiFetch<{ message: string }>(
      API_ENDPOINTS.kb.delete(id),
      { method: "DELETE" },
    );
    if (!res.success) throw new Error(res.error?.message ?? "刪除文件失敗");
  },

  // 重新向量化失敗的文件，只能對 status 為 failed 的文件使用
  retry: async (id: string): Promise<ApiKbDocument> => {
    const res = await apiFetch<ApiKbDocument>(API_ENDPOINTS.kb.retry(id), {
      method: "POST",
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message ?? "重新向量化失敗");
  },
};
