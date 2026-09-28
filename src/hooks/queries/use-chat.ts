"use client";

import { useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/hooks/constants";
import { apiClient } from "@/hooks/client";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  // Gemini history must start with "user"; strip any leading model messages (e.g. UI greeting)
  const firstUserIdx = messages.findIndex((m) => m.role === "user");
  const payload = firstUserIdx > 0 ? messages.slice(firstUserIdx) : messages;

  const res = await apiClient.post<{ reply: string }>(API_ENDPOINTS.chat, {
    messages: payload,
  });
  return res.data.reply;
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: sendChatMessage,
  });
}
