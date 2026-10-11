import { useMutation } from "@tanstack/react-query";
import { chatApi } from "./api";

export type { ChatMessage } from "./types";

export function useSendChatMessage() {
  return useMutation({
    mutationFn: chatApi.send,
  });
}
