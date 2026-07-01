# AI 對話功能串接說明

## 概觀

AI 對話功能讓管理員可以透過聊天介面向 Gemini 詢問請假相關問題。  
後端以 `POST /chat` 提供 API，前端使用 `src/api/useChat.ts` 呼叫，畫面由 `src/components/ai-analysis/ai-chat.tsx` 渲染。

---

## 後端 API（`POST /chat`）

### 環境設定

在後端 `.env` 加入 Gemini API Key：

```env
GEMINI_API_KEY=你的金鑰
```

取得金鑰：[https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)

> **免費版可用模型（截至 2026 年 5 月）**
>
> - `gemini-2.5-flash`：10 RPM，每日 ~250–1500 次請求
> - `gemini-2.5-flash-lite`：15–30 RPM，每日限制較寬鬆
>
> 目前後端使用 `gemini-2.5-flash`（定義於 `app/routers/chat.py`）。

---

### Request

```
POST /chat
Content-Type: application/json
Cookie: <httpOnly JWT>（需登入）
```

```json
{
  "messages": [
    { "role": "user", "content": "特休假幾天？" },
    { "role": "model", "content": "依勞基法第 38 條規定…" },
    { "role": "user", "content": "那病假呢？" }
  ]
}
```

| 欄位       | 說明                       |
| ---------- | -------------------------- |
| `messages` | 完整對話歷史，陣列不可為空 |
| `role`     | `"user"` 或 `"model"`      |
| `content`  | 訊息內容                   |

**限制：**

- 最後一則訊息必須是 `role: "user"`
- 需登入（httpOnly cookie），未登入回傳 401

---

### Response

**成功 200**

```json
{ "reply": "AI 回覆內容" }
```

> 注意：`/chat` 回傳格式為 `{ reply }` 而非系統統一的 `{ success, data }`。

**錯誤**

| 狀態碼 | 原因                                                |
| ------ | --------------------------------------------------- |
| 401    | 未登入                                              |
| 422    | messages 為空 / 最後一則不是 user                   |
| 500    | Gemini API 呼叫失敗（含模型名稱錯誤、API Key 無效） |
| 503    | `GEMINI_API_KEY` 未設定                             |

---

### 後端邏輯說明（`app/routers/chat.py`）

```
1. 讀取 GEMINI_API_KEY → 未設定回 503
2. 驗證 messages 不為空、最後一則為 user → 不符回 422
3. 將 messages[:-1] 轉為 Gemini history 格式
4. messages[-1].content 作為本次輸入
5. model.start_chat(history=history).send_message(user_input)
6. 回傳 { reply: response.text }
```

Gemini 的 `start_chat(history=...)` 接受過去的對話作為上下文，  
最後一則訊息則透過 `send_message()` 送入，這樣 Gemini 才能保持多輪對話記憶。

---

## 前端串接（`src/api/useChat.ts`）

```ts
import { API_BASE_URL, API_ENDPOINTS } from "./constants";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<string> {
  // Gemini history 必須從 user 開頭，濾掉前端 UI 歡迎語（role: "model"）
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
```

**為什麼要過濾開頭的 model 訊息？**

前端初始化時會顯示一則歡迎語（`role: "model"`），但這不是 Gemini 真正產生的回覆。  
若直接把它放進 history 傳給後端，Gemini 會因為 history 第一則不是 `user` 而拋出錯誤。  
因此在送出前先用 `findIndex` 找到第一則 user 訊息，從那裡開始切片。

---

## 串接確認流程

### 1. 後端啟動確認

```bash
curl http://localhost:8000/
# 預期回傳：{"success":true,"data":"請假系統 API 運行中"}
```

### 2. 未登入時的保護確認

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
# 預期回傳：{"success":false,"error":{"code":"HTTP_ERROR","message":"未登入"}}
```

回傳 `未登入` 代表：

- 後端正在運行 ✓
- `/chat` 路由已正確掛載 ✓
- JWT 認證中介層正常運作 ✓

### 3. 登入後的完整測試

在瀏覽器登入系統後，開啟開發者工具 Network 分頁，  
到「AI 分析」頁面輸入任何問題並送出，確認：

| 檢查項目            | 預期結果                                |
| ------------------- | --------------------------------------- |
| Request URL         | `POST http://localhost:8000/chat`       |
| Request 帶有 Cookie | ✓（httpOnly JWT 自動附上）              |
| Request Body        | `{ "messages": [...] }` 最後一則為 user |
| Response Status     | 200                                     |
| Response Body       | `{ "reply": "..." }`                    |

---

## 常見錯誤排查

| 錯誤訊息                        | 原因                                   | 解法                                                       |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| `503 GEMINI_API_KEY 未設定`     | `.env` 缺少 Key                        | 加入 `GEMINI_API_KEY=...` 後重啟後端                       |
| `404 models/xxx is not found`   | 模型名稱已棄用                         | 改用 `gemini-2.5-flash`                                    |
| `429 limit: 0`                  | 免費配額耗盡或 Key 所屬 Project 無配額 | 至 aistudio.google.com 建新 Project 取得新 Key             |
| `500 Invalid argument`          | history 第一則為 `model`               | 前端 `useChat.ts` 已處理，確認 `firstUserIdx` 過濾邏輯正確 |
| `422 最後一則訊息必須來自 user` | 送出時最後一則是 model                 | 確認 `sendMessage()` 是在 user 訊息加入後才呼叫            |
