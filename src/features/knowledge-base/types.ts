export type KbDocumentType = "rule" | "raw" | "letter";
export type KbDocumentStatus = "processing" | "ready" | "failed";

export interface ApiKbDocument {
  id: string;
  title: string;
  source: string;
  type: KbDocumentType;
  status: KbDocumentStatus;
  error_message: string | null;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
}

export interface KbDocumentListData {
  total: number;
  page: number;
  limit: number;
  data: ApiKbDocument[];
}

export interface KbDocumentCreateInput {
  title: string;
  content: string;
  type: KbDocumentType;
}

export interface KbDocumentUpdateInput {
  title?: string;
  content?: string;
  type?: KbDocumentType;
}

export type KbDocumentsQueryParams = {
  page?: number;
  limit?: number;
};
