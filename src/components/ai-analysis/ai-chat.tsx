"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sendChatMessage, type ChatMessage } from "@/api/useChat";

type Message = {
  id: number;
  role: "user" | "model";
  content: string;
  isError?: boolean;
};

function BotAvatar() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
      <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#4195C3" />
        <circle cx="9" cy="11" r="1.5" fill="white" />
        <circle cx="15" cy="11" r="1.5" fill="white" />
        <path
          d="M8.5 15.5 Q12 18 15.5 15.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <rect
          x="10"
          y="3"
          width="4"
          height="2"
          rx="1"
          fill="#4195C3"
          stroke="white"
          strokeWidth="1"
        />
        <line x1="12" y1="5" x2="12" y2="6" stroke="white" strokeWidth="1" />
      </svg>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "model",
      content: "您好！我是 AI 客服助理，請問有什麼我可以幫您的嗎？",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const history: ChatMessage[] = updated.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await sendChatMessage(history);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "model", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "model",
          content: "抱歉，目前服務發生問題，請稍後再試。",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
          </span>
          <div>
            <div className="text-sm font-semibold">AI 客服助理</div>
            <div className="text-xs text-muted-foreground">線上服務中</div>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          by Gemini
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            {msg.role === "model" && <BotAvatar />}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.isError
                    ? "border border-destructive/20 bg-destructive/10 text-destructive"
                    : "bg-muted text-foreground",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <BotAvatar />
            <div className="rounded-2xl bg-muted px-4 py-2.5">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <Input
          ref={inputRef}
          className="flex-1"
          placeholder="請輸入您的問題..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0"
          onClick={() => void sendMessage()}
          disabled={loading || !input.trim()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
