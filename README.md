# 請假系統 Leave System Frontend

基於 Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui 開發的請假管理系統前端。目前以 localStorage 模擬資料，後續可串接後端 API。

## 技術棧

| 項目      | 版本 / 說明              |
| --------- | ------------------------ |
| Framework | Next.js 16（App Router） |
| UI        | React 19                 |
| 樣式      | Tailwind CSS v4          |
| 元件      | Radix UI / shadcn/ui     |
| 表格      | TanStack Table           |
| 圖示      | lucide-react             |
| 語言      | TypeScript               |

## 功能概覽

### 管理員（admin）

| 路由             | 說明                                 |
| ---------------- | ------------------------------------ |
| `/overview`      | 團隊總覽、待審核申請、員工年請假時數 |
| `/leave-balance` | 假別餘額                             |
| `/review`        | 審核請假申請（核准 / 拒絕）          |
| `/employees`     | 員工帳號管理（新增、編輯、刪除）     |
| `/apply`         | 申請請假                             |
| `/records`       | 全部請假紀錄                         |
| `/ai-analysis`   | AI 客服助理（串接 Gemini 後端）      |

### 員工（employee）

| 路由             | 說明                   |
| ---------------- | ---------------------- |
| `/leave-balance` | 假別餘額（登入後首頁） |
| `/apply`         | 申請請假               |
| `/records`       | 個人請假紀錄           |

> 側邊欄依角色顯示不同選項；無權限頁面會自動導回對應首頁。

## 測試帳號

| 帳號       | 密碼     | 角色   | 登入後導向       |
| ---------- | -------- | ------ | ---------------- |
| `admin`    | `111111` | 管理員 | `/overview`      |
| `employee` | `111111` | 員工   | `/leave-balance` |

帳號資料存於瀏覽器 `localStorage`（key: `leave_system_users`）。若登入異常，可清除該 key 後重新整理以還原預設帳號。

## 環境變數

建立 `.env.local`（選用）：

```env
# 後端 API（預設 http://localhost:8000）
NEXT_PUBLIC_API_URL=http://localhost:8000

# AI 聊天 API（預設 http://localhost:8000/chat）
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/chat
```

## 開始使用

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)，未登入會導向 `/login`。

其他指令：

```bash
npm run build   # 正式建置
npm run start   # 啟動正式伺服器
npm run lint    # ESLint 檢查
```

## 專案結構

```
src/
├── app/
│   ├── overview/          # 總覽（admin）
│   ├── leave-balance/     # 假別餘額
│   ├── review/            # 審核管理（admin）
│   ├── employees/         # 員工管理（admin）
│   ├── apply/             # 申請請假
│   ├── records/           # 請假紀錄
│   ├── ai-analysis/       # AI 分析（admin）
│   ├── labor-law/         # 勞基法參考
│   ├── login/             # 登入
│   ├── layout.tsx
│   ├── page.tsx           # 依角色導向首頁
│   └── globals.css
├── components/
│   ├── ai-analysis/       # AI 聊天元件
│   ├── records/           # 請假紀錄表格元件
│   ├── ui/                # shadcn UI 元件
│   ├── AppLayout.tsx      # 主版面（Sidebar + Navbar）
│   ├── Sidebar.tsx
│   └── Navbar.tsx
├── api/
│   └── useOverview.ts     # 總覽 mock 資料
└── lib/
    ├── auth.ts            # 登入、角色、員工管理
    └── leave.ts           # 請假紀錄、假別額度
```

## 資料儲存（開發階段）

| localStorage Key     | 內容           |
| -------------------- | -------------- |
| `leave_system_auth`  | 目前登入使用者 |
| `leave_system_users` | 使用者帳號列表 |
| `leave_records`      | 請假申請紀錄   |

API 串接規格可參考 [`docs/api-spec.md`](docs/api-spec.md)。

## 設計備註

- 主色：`#4195C3`
- 假別 / 狀態標籤圓角：`8px`（`LEAVE_BADGE_ROUNDED`）
- 主要按鈕使用 primary 藍色；次要操作使用 outline 藍框
