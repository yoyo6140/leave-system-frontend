import { API_BASE_URL, API_ENDPOINTS } from "./constants";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<string> {
  // Gemini history must start with "user"; strip any leading model messages (e.g. UI greeting)
  const firstUserIdx = messages.findIndex((m) => m.role === "user");
  const payload = firstUserIdx > 0 ? messages.slice(firstUserIdx) : messages;

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.chat}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: payload }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { reply: string };
  return data.reply;
}
