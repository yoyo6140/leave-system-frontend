@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Next.js（App Router）+ TypeScript 的請假系統前端，單一部門內部使用。後端是另一個 repo（`leave-system-backend`，FastAPI，部署在 Render，自訂網域 `leaves-api.yoyodev.win`）。完整 API 規格以後端的
`doc/spec/leaves-system.md`（本 repo 的對應副本在 `docs/spec/leaves-system.md`，兩邊內容同步）為準，**不要**在這份文件重複寫一份 API payload——上一份這麼做的結果就是跟著改了一半、另一半沒更新，誤導了之後的開發。

## 常用指令

```bash
npm run dev       # http://localhost:3000
npm run build
npm run lint
npm run test       # vitest watch
npm run test:run   # vitest 單次執行
```

目前用的是 Next.js 16，跟訓練資料裡的版本可能有行為差異，改動前先看 `AGENTS.md` 指到的 `node_modules/next/dist/docs/`。

## 架構重點

- **角色**：`sup_admin`（總管理員）／`admin`（主管）／`employee`（員工）三種，顯示名稱在 `src/app/(protected)/(admin-only)/employees/page.tsx` 的 `ROLE_LABEL`。權限規則一律由後端檢查，前端只是依角色隱藏按鈕/欄位（完整表格見規格書第 2 節）。
- **認證**：登入 `POST /auth/login` 回應 body 帶 `{ data: { token } }`，前端存進 `localStorage`（key 見 `src/lib/auth.ts` 的 `TOKEN_KEY`），之後每個請求由 `src/lib/api-client.ts` 的 axios interceptor 自動夾帶 `Authorization: Bearer`。不是只靠 httpOnly cookie（跨網域時 iOS Safari 會擋 cookie，所以改用 Bearer）。
- **帳號**：帳號（`A0001` 起）跟初始密碼（`6666666`）都是後端自動產生，新增/編輯表單不收 `username`、`password` 欄位。身分證字號只檢查長度 10（`src/lib/validation.ts`），列表顯示要遮罩（`maskIdNumber()`）。
- **假別 `type`**：API 傳英文代碼（`annual`/`sick`/`personal`/`marriage`/`bereavement`/`official`/`other`），中文只用於顯示——用 `src/lib/leave.ts` 的 `LEAVE_TYPE_LABEL` 對照，不要直接把中文字串當 `type` 送給後端或拿來比較。
- **假單狀態 `status`**：中文值，五種：`待審核`／`已通過`／`已拒絕`／`已取消`／`已銷假`。退回、銷假時必填 `review_note`；`reviewer` 一律由後端從 JWT 帶入，前端不送這個欄位。
- **路由分組**：`src/app/(protected)/layout.tsx` 統一做登入驗證跟 Sidebar／Navbar 外殼；`(protected)/(admin-only)/` 底下是 admin／sup_admin 專用頁面（`overview`、`employees`、`employee-records`、`review`、`ai-analysis`、`knowledge-base`），其餘（`apply`、`records`、`leave-balance`、`change-password`）所有登入角色都能進。
- `(admin-only)/knowledge-base`：開發中，刻意不放進 Sidebar，只能直接輸入網址進入；目前是純前端畫面（新增/編輯/刪除知識項目），資料存在元件 state，重新整理會消失，之後才會接後端存進資料庫並切 chunk 給 AI 助理用。
- **資料層慣例**：每個 `features/<domain>/` 底下固定 `api.ts`（呼叫 `apiFetch`）/`hooks.ts`（TanStack Query）/`types.ts`/`keys.ts` 四件套，詳見 `docs/API-Connection-rule.md`。
- **審核/銷假的 UI 模式**：`components/ui/app-dialog.tsx` 的 `ConfirmDialog` 支援 `children`（塞理由輸入框）、`confirmDisabled`、`loading`（mutation 送出中顯示轉圈，避免使用者不確定有沒有按到）。

## 規格文件

`docs/spec/leaves-system.md` 是前後端共用的目標規格（跟後端 repo 的 `doc/spec/leaves-system.md` 同步），實作或修改功能前以它為準。`docs/sdd/` 底下是各頁面的設計筆記，但更新頻率不一定跟得上實作，遇到跟規格書或實際程式碼衝突時，規格書/程式碼優先。
