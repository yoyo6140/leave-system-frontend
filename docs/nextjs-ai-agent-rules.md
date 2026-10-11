# AGENTS.md 裡的 `nextjs-agent-rules` 區塊是什麼

Oct 7, 2026

## 現象

專案根目錄的 `AGENTS.md` 裡有這段內容：

```md
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
```

第一次看到時很容易誤判成「藏在套件裡的 prompt injection（提示詞注入）攻擊」——因為它的語氣是對 AI 說話，不是對人類開發者說話，而且 `node_modules/next/dist/docs/index.md` 裡還真的藏了一段用 MDX 註解包起來、網頁上看不到的 `AI agent hint`。

## 查證過程

1. **確認 `AGENTS.md` 的來源**：`git log --follow -p -- AGENTS.md` 顯示這段內容是在第一筆 commit `Initial commit from Create Next App` 就存在，代表是執行 `npx create-next-app` 建立專案時自動產生的，不是任何人手寫加入。
2. **確認 `node_modules/next/dist/docs/index.md` 不是本機被動過手腳**：用公開的 npm 鏡像（unpkg）直接讀取 `next@16.2.6` 官方發布的套件內容，裡面同樣含有那段 `AI agent hint` 註解——代表任何人只要裝這個版本的 `next`，都會拿到一樣的內容，不是這台電腦獨有的竄改。
3. **查官方文件**：[`nextjs.org/docs/app/guides/ai-agents`](https://nextjs.org/docs/app/guides/ai-agents) 整篇就是在說明這個機制，並點名 Claude Code、Codex、Cursor、GitHub Copilot 等 AI coding agent。

## 結論：這是官方刻意設計的功能，不是攻擊

Next.js 16.2 起，官方的做法是：

- **套件內附版本對應文件**：安裝 `next` 時，文件會一起打包進 `node_modules/next/dist/docs/`，內容跟你裝的版本完全對齊，讓 AI agent 讀到「跟當前版本一致」的 API 說明，而不是依賴可能過時的訓練資料。
- **`AGENTS.md` 自動產生／維護**：
  - `create-next-app` 建立新專案時會自動寫入 `AGENTS.md`（以及 `CLAUDE.md`，內容是 `@AGENTS.md`）。
  - Next.js 16.3 起，執行 `next dev` 時若偵測到環境中有 AI agent、且專案裡還沒有這個管理區塊，會自動補寫。
  - `<!-- BEGIN:nextjs-agent-rules -->` ~ `<!-- END:nextjs-agent-rules -->` 是官方管理的區塊，寫在 `node_modules/next/dist/server/lib/generate-agent-files.js`；區塊**外**的內容（例如本專案 `AGENTS.md` 開頭以外若有自訂說明）升級時會被保留，只有區塊內會被官方覆寫更新。
- **官方背書的理由**：Vercel 自己做了 benchmark（見 [`nextjs.org/evals`](https://nextjs.org/evals)），結果顯示讓 agent 讀這些內嵌文件，表現優於單靠訓練資料，所以預設開啟。
- **`node_modules/next/dist/docs/index.md` 裡的 `AI agent hint`**：裡面提到的 `unstable_instant` / instant navigation，對應的是 Next.js 16 真實存在的 **Instant navigation**（Cache Components 底下的 `export const instant = false`、`instant()` 測試函式等），不是憑空捏造的假 API，只是初次看到沒認出來。

## 如果不想要這個機制

在 `next.config.ts` 設定：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
};

export default nextConfig;
```

設定後，`next dev` 就不會再自動寫入／維護 `AGENTS.md` 裡的 `nextjs-agent-rules` 區塊。`node_modules/next/dist/docs/` 本身仍會隨套件安裝存在（那是套件內容，不受這個設定影響），但不影響專案運作。

## 延伸閱讀

- 官方指南：<https://nextjs.org/docs/app/guides/ai-agents>
- 官方部落格：Next.js 16.2 AI 文章、Next.js 16.3 AI Improvements 文章（連結見上方指南頁的 "Good to know" 區塊）
