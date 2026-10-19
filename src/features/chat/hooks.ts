import { useMutation } from "@tanstack/react-query";
import { chatApi } from "./api";

export type { ChatMessage } from "./types";

// React Query mutation：送出聊天訊息給 AI 並取得回覆
export function useSendChatMessage() {
  return useMutation({
    mutationFn: chatApi.send,
  });
}
