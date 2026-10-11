# 05 — 審核管理（Review）

路由：`/review`
權限：僅 `admin`
原始碼：`src/app/review/page.tsx`

管理者審核所有「待審核」狀態的請假申請：核准或拒絕。這是唯一能改變申請狀態為「已通過／已拒絕」的頁面。

---

## 1. 頁面目的

集中列出所有員工送出、尚未處理的請假申請，讓管理者逐筆查看詳情並決定核准或拒絕。Sidebar 上「審核管理」項目會顯示待審核筆數的紅色徽章（計算方式見 `00-summary.md` 的 Sidebar 說明：`leavesData.filter(status === "待審核").length`，`limit=200`）。

## 2. UI 結構

- 標題「審核管理」+「待審核 N 筆」。
- 空狀態：虛線卡片 + `Check` icon + 「目前沒有待審核的申請」。
- 列表：每筆待審核申請一張可點擊卡片（`hover:bg-accent/40`），內容：
  - 假別徽章
  - 申請人姓名 + 日期區間 + 時數
  - 申請時間（`created_at` 轉為本地日期）+ 原因（若有）
  - 右側 `ChevronRight` 提示可點擊
- 點擊卡片 → 開 `LeaveDetailDialog`（`isAdmin`），並帶入 `footerActions`：「拒絕」（outline）與「核准」（primary）兩個按鈕。
- 點「拒絕」/「核准」→ 各自跳 `ConfirmDialog` 二次確認，不會直接送出。
- 核准成功後關閉詳情彈窗並顯示 `SuccessDialog`「申請已核准」；拒絕成功只關閉彈窗，不特別顯示成功提示。

## 3. 資料流 / API

| Hook | API | 端點 | 參數 |
| --- | --- | --- | --- |
| `useLeavesQuery({ limit: 200 })` | `leaveApi.getList` | `GET /leaves` | 抓全公司紀錄（admin 預設），前端自行 `filter(status === "待審核")` |
| `useUsersQuery({ limit: 200 })` | `userApi.getList` | `GET /users` | 建立 `userMap: id → name` |
| `useUpdateLeaveStatus()` | `leaveApi.updateStatus` | `PATCH /leaves/{id}/status` | body `{ status, reviewer }` |

- `pending = records.filter(r => r.status === "待審核")`：目前前端一次抓 200 筆回來篩選，**非後端分頁查詢**，公司請假量很大時需注意 `limit` 是否足夠（已知限制，與 `04-employee-records.md` 相同）。
- `reviewer` 帶入目前登入 admin 的姓名（`currentUser?.name`，查不到則 fallback `"admin"`）。

## 4. 互動行為

1. 核准：`setApproveTarget(id)` → `ConfirmDialog`「確認核准？／核准後員工假期將生效，此操作無法復原。」→ 確認後呼叫 `useUpdateLeaveStatus` 帶 `status: "已通過"`。
2. 拒絕：`setRejectTarget(id)` → `ConfirmDialog`（`variant="destructive"`）「確認拒絕？／拒絕後將通知員工，此操作無法復原。」→ 確認後帶 `status: "已拒絕"`。
3. 兩者成功後都會關閉詳情彈窗（`setDetailRecord(null)`）；若 mutation 拋錯，`catch` 內刻意不處理（保留確認框開著，讓使用者看到底層錯誤或重試——目前沒有顯式錯誤提示 UI，屬已知可改善項）。

## 5. 邊界情況 / 已知限制

- 審核清單不是即時/分頁拉取，是一次抓 `limit=200` 後前端過濾；若待審核以外加上已處理的紀錄總數超過 200，可能漏掉一些「待審核」項目。
- 核准/拒絕失敗時沒有顯式的 `AlertDialog` 提示使用者（只是 `ConfirmDialog` 不會自動關閉），使用者體感上可能像是「卡住」。

## 6. 與其他頁面的關聯

- 核准/拒絕成功後，`useUpdateLeaveStatus` 會 invalidate `leaveKeys.all`、`quotaKeys.all`、`overviewKeys.all`：
  - `/overview` 的待審核數、本月已核准數會更新。
  - 申請人的 `/leave-balance` 假別餘額會重新計算（核准後才真正扣除額度；待審核狀態是否預扣額度由後端 `remaining_hours` 決定，前端只讀取結果）。
  - `/records`、`/employee-records` 的狀態徽章會同步更新。
- 詳情彈窗 `LeaveDetailDialog` 與 `/records`、`/employee-records` 共用同一元件，只是本頁額外傳入 `footerActions`。
