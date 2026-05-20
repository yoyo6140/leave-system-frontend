# 請假系統 Leave System Frontend

基於 Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui 開發的請假管理系統前端。

## 技術棧

- **Framework**: Next.js 16.2.6 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI / shadcn/ui
- **Icons**: lucide-react
- **Language**: TypeScript

## 功能

### 已實作
- **登入頁面** (`/login`) — 帳號密碼驗證，認證狀態存於 localStorage
- **導覽列** — 頂部固定導覽列，含頁面連結與登出功能
- **首頁儀表板** (`/`) — 快捷入口卡片，需登入後才可進入

### 待開發
- 申請請假頁面 (`/apply`)
- 請假紀錄頁面 (`/records`)
- 後端 API 串接

## 測試帳號

| 帳號 | 密碼 |
|------|------|
| admin | admin |

## 專案結構

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx      # 登入頁
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # 首頁儀表板
│   └── globals.css
├── components/
│   ├── ui/
│   │   └── button.tsx     # shadcn Button
│   └── Navbar.tsx         # 導覽列
└── lib/
    ├── utils.ts           # cn 工具函式
    └── auth.ts            # 登入/登出/認證工具
```

## 開始使用

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)，會自動導向登入頁面。
