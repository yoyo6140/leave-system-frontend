import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiClient } from "@/lib/api-client";
import type { ChatMessage } from "./types";

export const chatApi = {
  send: async (messages: ChatMessage[]): Promise<string> => {
    // Gemini history must start with "user"; strip any leading model messages (e.g. UI greeting)
    const firstUserIdx = messages.findIndex((m) => m.role === "user");
    const payload = firstUserIdx > 0 ? messages.slice(firstUserIdx) : messages;

    const res = await apiClient.post<{ reply: string }>(API_ENDPOINTS.chat, {
      messages: payload,
    });
    return res.data.reply;
  },
};
