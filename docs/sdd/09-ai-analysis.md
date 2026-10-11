# 09 — AI 分析（AI Analysis）

路由：`/ai-analysis`
權限：僅 `admin`
原始碼：`src/app/ai-analysis/page.tsx`、`src/components/ai-analysis/ai-chat.tsx`、`src/features/chat/*`

與 Gemini 驅動的 AI 客服助理對話，詢問請假相關問題（例如假別規則、時數換算）。

---

## 1. 頁面目的

提供管理者一個聊天介面，可即時詢問請假/假別相關問題，由後端轉接 Gemini API 回答，不需要管理者自行查勞基法條文。

## 2. UI 結構

- 標題「AI 分析」+ 說明文字「與 AI 助理對話，查詢請假相關問題」。
- 聊天卡片（`max-w-3xl`，高度 `calc(100vh-10rem)`）：
  - 頂部狀態列：綠色呼吸動畫圓點 + 「AI 客服助理／線上服務中」+ 右側「by Gemini」徽章。
  - 訊息串：使用者訊息靠右（primary 底色），AI 訊息靠左並附 `BotAvatar`（自繪 SVG 機器人頭像）；AI 回覆錯誤時訊息改用紅色提示底色（`isError`）。
  - 等待回覆時顯示三個跳動圓點（`TypingDots`）取代訊息內容。
  - 底部輸入列：單行 `Input` + 送出按鈕（`Send` icon）；`loading` 或輸入為空時送出按鈕 disable。
- 初始訊息固定為一句歡迎語（`role: "model"`，純前端寫死，不是 Gemini 產生）。

## 3. 資料流 / API

| Hook | API | 端點 | 備註 |
| --- | --- | --- | --- |
| `useSendChatMessage()` | `chatApi.send` | `POST /chat` | 回應格式是 `{ reply: string }`，**不是**系統統一的 `{ success, data }` 格式 |

### 送出邏輯（`chatApi.send` / `sendMessage()`）

1. 把目前完整對話歷史（含剛輸入的使用者訊息）送給後端：`{ messages: [{ role, content }, ...] }`。
2. Gemini 的 history 必須從 `user` 開頭；因為第一則訊息是前端寫死的歡迎語（`role: "model"`），送出前用 `findIndex` 找到第一個 `role === "user"` 的訊息，從那裡開始切片，過濾掉開頭的歡迎語。
3. 需登入（httpOnly cookie 自動帶上）；未登入回 401。
4. 最後一則訊息必須是 `user`，否則後端回 422。

## 4. 互動行為

- `Enter` 鍵或點擊送出按鈕皆可送出訊息；送出中禁止再次送出或編輯輸入框。
- 每次訊息列表變動或 loading 狀態改變都會自動滾動到底部（`scrollIntoView({ behavior: "smooth" })`）。
- 送出完成（成功或失敗）後，若不在 loading 狀態會自動把焦點收回輸入框，方便連續發問。

## 5. 錯誤處理

- `sendChat.mutateAsync()` 拋錯（網路錯誤、401、422、500、503 等）統一在前端顯示同一句「抱歉，目前服務發生問題，請稍後再試。」（以 `isError` 樣式標示），不會把後端原始錯誤訊息呈現給使用者。
- 後端常見錯誤情境（供排查參考，見 `docs/ai-chat.md`）：
  - 503：後端 `GEMINI_API_KEY` 未設定。
  - 422：`messages` 為空或最後一則不是 `user`。
  - 500：Gemini API 呼叫失敗（模型名稱錯誤、金鑰失效等）。
  - 401：未登入。

## 6. 與其他頁面的關聯

- 獨立頁面，不依賴其他 feature 的資料；對話內容僅存在於當前頁面的 React state，重新整理或離開頁面後不保留歷史紀錄。
- 僅 admin 能在 Sidebar 看到「AI 分析」入口；員工無法使用本功能。
