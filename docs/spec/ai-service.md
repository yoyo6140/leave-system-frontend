# 請假系統規格書（第二階段：AI 助理）
 
Oct 29, 2026 · @yoyo
 
> 第一階段核心功能見 `specs/leaves-system-spec.md`。本階段在第一階段上線後才開始，2-B 假單查詢會用到第一階段的權限與額度邏輯。
 
 
## 1. 目標與範圍
 
以自架於 Modal 的模型**完全取代**現有的 Gemini `/chat`，分兩個子階段上線：
 
| 子階段 | 功能 | 作法 |
| --- | --- | --- |
| 2-A 規章問答 | 回答勞基法、公司規章相關問題，並附上引用段落 | RAG：規章切段 → 向量化存 pgvector → 提問時檢索相關段落交給模型 |
| 2-B 假單查詢 | 查自己的可用時數、假單狀態 | tool calling：模型呼叫後端工具，工具直接使用第一階段的 service 函式 |
 
- 2-A 上線後即移除 Gemini 相關程式與 `GEMINI_API_KEY`
- 對話不留紀錄，只存在前端 state
- 用 system prompt 限制回答範圍在請假與規章相關問題
## 2. 權限
 
| 動作 | sup\_admin | admin | employee |
| --- | --- | --- | --- |
| 使用 AI 助理 | 可 | 可 | 可 |
| 管理規章文件（上傳、修改、刪除、重試） | 可 | 可 | 不可 |
| 假單查詢工具的資料範圍 | 所有人 | 所有人 | 僅自己 |
 
- 工具一律以目前登入者身分執行，不接受模型傳入 `user_id`；查詢範圍與核心規格書第 2 節相同
- `/ai-analysis` 頁面改為所有角色都看得到
## 3. 架構
 
```
前端 ──► 後端 FastAPI ──► Modal（leave-system-inference）
             │               ├─ embedding 模型（multilingual-e5-large-instruct）
             │               └─ 對話模型（Gemma 4，vLLM，OpenAI 相容 API）
             └─► PostgreSQL + pgvector（kb_documents、kb_chunks）
```
 
**模型選擇**
 
基於資安考量，不使用 Qwen 系列模型（含 Qwen3-Embedding）。
 
| 用途 | 模型 | 授權 | GPU | 說明 |
| --- | --- | --- | --- | --- |
| 對話（2-A、2-B 共用） | Gemma 4 E4B → 視測試結果升級 Gemma 4 12B | Apache 2.0 | E4B：L4；12B：L40S（BF16）或 L4（FP8） | Google 開發；原生 function calling、結構化 JSON、system 指令；一個模型同時處理規章問答與工具呼叫 |
| 對話候選（僅 2-A） | Gemma-3-TAIDE-12b-Chat-2602 | TAIDE 授權 + Gemma 使用條款（gated） | L40S | 國科會繁中模型；若繁中品質明顯優於 Gemma 4，2-A 改用 TAIDE，2-B 維持 Gemma 4 |
| Embedding | intfloat/multilingual-e5-large-instruct | MIT | T4 或 L4 | Microsoft 開發；1024 維、支援 100 種語言；備選 Google EmbeddingGemma |
 
- 模型只從官方 Hugging Face 組織下載（`google/`、`intfloat/`、`taide/`），並固定 revision（commit hash），避免載入被替換的權重
- gated 模型（TAIDE）需在 Hugging Face 同意授權，`HF_TOKEN` 存為 Modal Secret
- Gemma 系列在 vLLM 一律使用 `--dtype bfloat16`；對話歷史需 user／assistant 嚴格交替，前端的 `role: "model"` 由後端轉為 `"assistant"`
- 2-B 啟用 tool calling 時，vLLM 需加上 `--enable-auto-tool-choice` 與對應的 `--tool-call-parser`（依 vLLM 對 Gemma 4 的支援設定）
- system prompt 必須要求「使用繁體中文（台灣用語）回答，只根據提供的規章段落回答」
**部署與設定**
 
- 推論服務放在獨立 repo `leave-system-inference`，無狀態、沒有資料庫；向量的讀寫都由後端負責
- 後端新增 `app/ai/`：`client.py`（模型呼叫介面）、`ingest.py`（切段與向量化）、`retrieval.py`（pgvector 檢索）、`tools.py`（2-B 工具）
- 後端只依賴環境變數：`EMBEDDING_BASE_URL`、`EMBEDDING_API_KEY`、`LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`
- 驗證：自行產生 API key 存為 Modal Secret，endpoint 檢查 key；後端以環境變數保存同一組 key，不存資料庫、不給前端
- Modal 分 dev（`modal serve`）／prod（`modal deploy`）兩個環境與兩組 key
- 冷啟動：Modal 縮到 0 台時第一次請求較慢，前端顯示「助理啟動中」；開發期間不設常駐以免持續計費
- CI：`leave-system-inference` 的 pipeline 以 `MODAL_TOKEN_ID`、`MODAL_TOKEN_SECRET` 執行 `modal deploy`
## 4. 資料表
 
| 表 | 欄位 | 說明 |
| --- | --- | --- |
| `kb_documents` | `id` UUID PK、`title`、`source`、`status`（`processing`／`ready`／`failed`）、`error_message`、`uploaded_by` FK、`created_at`、`updated_at` | 規章文件 |
| `kb_chunks` | `id` UUID PK、`document_id` FK、`chunk_index`、`content`、`embedding vector(1024)`、`embedding_model` | 段落與向量；1024 維對應 multilingual-e5-large-instruct |
 
- 需在 PostgreSQL 啟用 `CREATE EXTENSION vector`（本機 Docker 改用 `pgvector/pgvector` image）
- 上傳或修改規章後以 FastAPI BackgroundTasks 自動切段、向量化；失敗時 `status` 為 `failed`
- `embedding_model` 用於換模型時找出需要重新向量化的段落；換成維度不同的模型（例如 EmbeddingGemma）時，`embedding` 欄位要一併 migration
- multilingual-e5 系列需加前綴：規章段落用 `passage: `，使用者問題用 `query: `（instruct 版的查詢端改用模型卡指定的指令格式）
## 5. API
 
| 方法 | 路徑 | 說明 | 狀態 |
| --- | --- | --- | --- |
| POST | `/chat` | AI 對話，所有角色可用 | 變更：改接 Modal、開放所有角色 |
| GET | `/kb/documents` | 規章列表 | 新增 |
| POST | `/kb/documents` | 上傳規章，回傳時 `status` 為 `processing` | 新增 |
| PUT | `/kb/documents/{id}` | 修改規章，重新向量化 | 新增 |
| DELETE | `/kb/documents/{id}` | 刪除規章與其段落 | 新增 |
| POST | `/kb/documents/{id}/retry` | 重新向量化失敗的文件 | 新增 |
 
**`/chat` 格式**（維持非統一格式）
 
- Request：`{ messages: [{ role: "user" | "model", content }] }`，維持現有前端格式，後端轉成模型需要的格式
- Response：`{ reply, sources: [{ document_id, title, chunk_index }] }`，`sources` 為新增
- 2-B 的工具呼叫在後端完成，前端只會收到最後的 `reply`
## 6. 開發步驟
 
| 順序 | 做什麼 | 完成的判斷標準 |
| --- | --- | --- |
| 1 | 建 `leave-system-inference` repo，部署 multilingual-e5-large-instruct 並加 key 驗證 | curl 帶 key 拿得到 1024 維向量，不帶 key 被拒 |
| 2 | 後端 migration：pgvector、`kb_documents`、`kb_chunks` | 本機與 Render 的資料庫都能建立 |
| 3 | 規章上傳 API 與自動向量化 | 上傳後 `kb_chunks` 有資料，`status` 變 `ready` |
| 4 | 檢索：問題 → 向量 → 找前 k 段 | 不接模型，直接檢查段落是否正確 |
| 5 | 準備 20～30 題測試問題 | 大部分題目的正確段落在前 5 名 |
| 6 | 部署 Gemma 4 E4B（vLLM，L4） | 以 `openai` 套件指定 `base_url` 可對話 |
| 6.5 | 以測試問題比較 Gemma 4 E4B、Gemma 4 12B、Gemma-3-TAIDE-12B 的繁中回答品質 | 決定 2-A 使用的模型與 GPU，回填本文件 |
| 7 | 後端 `/chat` 改接 Modal，附 `sources` | 回答附引用段落；移除 Gemini |
| 8 | 前端：所有角色可進入、顯示引用來源、冷啟動提示；規章管理頁；改寫 `docs/ai-chat.md`、`docs/sdd/10-ai-analysis.md`（含 Bearer JWT） | 2-A 完成 |
| 9 | 2-B：定義工具（查可用時數、查假單），vLLM 開啟 tool calling | 「我特休還剩多少」回答正確 |
| 10 | 2-B：工具呼叫迴圈設最多輪數 | 不會無限呼叫 |
 
## 7. 測試案例
 
| 分類 | 案例 | 預期結果 |
| --- | --- | --- |
| 驗證 | Modal endpoint 不帶 key | 401 |
| 向量化 | 上傳規章 | `status` 由 `processing` 變 `ready` |
| 向量化 | embedding 服務失敗 | `status` 為 `failed`，可重試 |
| 檢索 | 「到職滿 2 年特休幾天」 | 引用特休年資表段落，答 10 天 |
| 範圍 | 問與請假無關的問題 | 婉拒回答 |
| 語言 | 所有測試問題的回答 | 繁體中文、台灣用語，不含簡體字 |
| 權限 | employee 上傳規章 | 403 |
| 權限 | 員工問「A0002 請了幾天假」 | 查不到他人資料 |
| 工具 | 員工問「我特休還剩多少」 | 與 `/leave-quota/me` 結果一致 |
 
## 8. 不在第二階段範圍
 
- AI 對話紀錄保存
- 由 AI 代替使用者送出、取消假單（工具只能查詢）
- 與其他專案共用推論服務