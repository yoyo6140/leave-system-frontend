# 請假系統 Leave System Frontend

基於 Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui 開發的請假管理系統前端，串接後端 repo `leave-system-backend`（FastAPI，部署於 Render）的真實 API。

## 技術棧

| 項目      | 版本 / 說明              |
| --------- | ------------------------ |
| Framework | Next.js 16（App Router） |
| UI        | React 19                 |
| 樣式      | Tailwind CSS v4          |
| 元件      | Radix UI / shadcn/ui     |
| 資料請求  | TanStack Query + axios   |
| 表格      | TanStack Table           |
| 驗證      | Zod                      |
| 測試      | Vitest                   |
| 圖示      | lucide-react             |
| 語言      | TypeScript               |

## 功能概覽

系統有三種角色：`sup_admin`（總管理員）／`admin`（主管）／`employee`（員工），側邊欄依角色顯示不同選項，無權限頁面會自動導回對應首頁。完整權限規則見 [`docs/spec/leaves-system.md`](docs/spec/leaves-system.md) 第 2 節。

| 路由               | 說明                                       | 可用角色                  |
| ------------------ | ------------------------------------------ | ------------------------- |
| `/overview`        | 團隊總覽：待審核數、本月核准數、每月請假次數長條圖 | admin、sup_admin          |
| `/employees`       | 員工／管理層帳號管理（新增、編輯、啟用停用） | admin、sup_admin          |
| `/employee-records`| 全公司請假紀錄，可直接核准/拒絕/銷假       | admin、sup_admin          |
| `/review`          | 審核待審核的請假申請（核准／拒絕）         | admin、sup_admin          |
| `/ai-analysis`     | AI 客服助理（串接 Gemini 後端）            | admin、sup_admin          |
| `/leave-balance`   | 假別餘額（員工/主管登入後首頁）            | admin、employee           |
| `/apply`           | 申請請假                                   | admin、employee           |
| `/records`         | 個人請假紀錄                               | admin、employee           |
| `/change-password` | 修改自己的密碼                             | 所有角色                  |

> `/knowledge-base`（admin、sup_admin）**開發中**，刻意不放進上面的導覽，只能直接輸入網址進入。

## 測試帳號

登入頁（`/login`）點擊即可自動填入，密碼皆為後端的預設密碼：

| 帳號    | 密碼       | 角色         |
| ------- | ---------- | ------------ |
| `A0006` | `88888888` | 管理員       |
| `A0001` | `6666666`  | 員工（陳志明）|

帳號一律由後端自動編號產生（`A0001` 起），新增帳號時前端不會收 `username`／`password` 欄位。

## 環境變數

建立 `.env.local`（選用，預設直接打正式後端）：

```env
# 後端 API base URL，預設 https://leaves-api.yoyodev.win
NEXT_PUBLIC_API_URL=http://localhost:8000
```

沒有額外的聊天 API 網址設定，`/chat` 走的是同一個 `NEXT_PUBLIC_API_URL`。

## 開始使用

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)，未登入會導向 `/login`。

其他指令：

```bash
npm run build      # 正式建置
npm run start      # 啟動正式伺服器
npm run lint        # ESLint 檢查
npm run test        # Vitest watch 模式
npm run test:run    # Vitest 單次執行
```

## 專案結構

```
src/
├── app/
│   ├── login/                     # 登入
│   ├── reset-password/            # 忘記密碼重設
│   └── (protected)/               # 登入後頁面，統一驗證 + Sidebar/Navbar 外殼
│       ├── apply/                 # 申請請假
│       ├── records/               # 個人請假紀錄
│       ├── leave-balance/         # 假別餘額
│       ├── change-password/       # 修改密碼
│       └── (admin-only)/          # admin / sup_admin 專用
│           ├── overview/
│           ├── employees/
│           ├── employee-records/
│           ├── review/
│           ├── ai-analysis/
│           └── knowledge-base/    # 開發中，不在側邊欄
├── features/                      # 依領域分層：api.ts / hooks.ts / types.ts / keys.ts
│   ├── auth/ leaves/ users/ quota/ overview/
├── components/
│   ├── records/                   # 請假紀錄表格、詳情彈窗、編輯彈窗
│   ├── ui/                        # shadcn UI 元件
│   ├── Sidebar.tsx
│   └── Navbar.tsx
└── lib/
    ├── api-client.ts              # axios 實例、Authorization header、401 處理
    ├── api-endpoints.ts           # 所有後端路徑常數
    ├── auth.ts                    # 登入、登出、目前使用者
    ├── leave.ts                   # 假別代碼、中文對照、樣式常數
    └── validation.ts              # 共用 zod 規則（密碼、身分證字號遮罩等）
```

## 設計備註

- 主色：`#4195C3`
- 假別 / 狀態標籤圓角：`8px`（`LEAVE_BADGE_ROUNDED`）
- 主要按鈕使用 primary 藍色；次要操作使用 outline 藍框
