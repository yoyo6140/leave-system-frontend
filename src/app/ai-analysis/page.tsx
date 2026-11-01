"use client";

import AiChat from "@/components/ai-analysis/ai-chat";

// AI 分析頁：放置 AI 聊天元件，讓管理者用自然語言查詢請假相關問題
export default function AiAnalysisPage() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold">AI 分析</h1>
        <p className="text-sm text-muted-foreground">
          與 AI 助理對話，查詢請假相關問題
        </p>
      </div>
      <AiChat />
    </div>
  );
}
