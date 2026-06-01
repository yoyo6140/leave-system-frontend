"use client"

import AppLayout from "@/components/AppLayout"
import AiChat from "@/components/ai-analysis/ai-chat"

export default function AiAnalysisPage() {
  return (
    <AppLayout allowedRoles={["admin"]}>
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-xl font-semibold">AI 分析</h1>
          <p className="text-sm text-muted-foreground">與 AI 助理對話，查詢請假相關問題</p>
        </div>
        <AiChat />
      </div>
    </AppLayout>
  )
}
