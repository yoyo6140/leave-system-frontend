export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatSource {
  document_id: string;
  title: string;
  chunk_index: number;
}

export interface ChatResult {
  reply: string;
  sources: ChatSource[];
}
