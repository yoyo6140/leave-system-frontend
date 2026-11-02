# 06 — 審核管理（Review）

路由：`/review`
權限：`admin`、`sup_admin`
原始碼：`src/app/review/page.tsx`

管理者審核所有「待審核」狀態的請假申請：核准或拒絕。`/employee-records` 也能做一樣的核准/拒絕（外加銷假），差別是本頁只列待審核清單，`/employee-records` 可以看任何狀態。

---

## 1. 頁面目的

集中列出所有員工送出、尚未處理的請假申請，讓管理者逐筆查看詳情並決定核准或拒絕。Sidebar 上「審核管理」項目會顯示待審核筆數的紅色徽章（計算方式見 `01-summary.md` 的 Sidebar 說明：`leavesData.filter(status === "待審核").length`，`limit=200`）。

## 2. UI 結構

- 標題「審核管理」+「待審核 N 筆」。
- 空狀態：虛線卡片 + `Check` icon + 「目前沒有待審核的申請」。
- 列表：每筆待審核申請一張可點擊卡片（`hover:bg-accent/40`），內容：
  - 假別徽章（`LEAVE_TYPE_LABEL` 轉中文顯示，不是直接顯示英文代碼）
  - 申請人姓名 + 日期區間 + 時數
  - 申請時間（`created_at` 轉為本地日期）+ 原因（若有）
  - 右側 `ChevronRight` 提示可點擊
- 點擊卡片 → 開 `LeaveDetailDialog`（`isAdmin`，兩欄版面，右側是異動紀錄時間軸），並帶入 `footerActions`：「拒絕」（outline）與「核准」（primary）兩個按鈕。
- 點「核准」→ `ConfirmDialog` 二次確認，不需要填理由。
- 點「拒絕」→ `ConfirmDialog`（`variant="destructive"`），裡面多一個必填的理由 `textarea`（`confirmDisabled={!rejectNote.trim()}`），沒填理由不能按確認。
- 兩個 `ConfirmDialog` 都帶 `loading={updateStatus.isPending}`：送出中按鈕會顯示轉圈圖示並鎖住（取消按鈕也鎖住），讓使用者清楚知道已經按到、避免連點送出兩次。
- 核准成功後關閉詳情彈窗並顯示 `SuccessDialog`「申請已核准」；拒絕成功只關閉彈窗，不特別顯示成功提示。

## 3. 資料流 / API

| Hook | API | 端點 | 參數 |
| --- | --- | --- | --- |
| `useLeavesQuery({ limit: 200 })` | `leaveApi.getList` | `GET /leaves` | 抓全公司紀錄（admin/sup_admin 預設），前端自行 `filter(status === "待審核")` |
| `useUsersQuery({ limit: 200 })` | `userApi.getList` | `GET /users` | 建立 `userMap: id → name` |
| `useUpdateLeaveStatus()` | `leaveApi.updateStatus` | `PATCH /leaves/{id}/status` | body `{ status, review_note }`；**不送 `reviewer`**，審核人一律由後端從 JWT 帶入 |

- `pending = records.filter(r => r.status === "待審核")`：目前前端一次抓 200 筆回來篩選，**非後端分頁查詢**，公司請假量很大時需注意 `limit` 是否足夠（已知限制，與 `05-employee-records.md` 相同）。

## 4. 互動行為

1. 核准：`setApproveTarget(id)` → `ConfirmDialog`「確認核准？／核准後員工假期將生效，此操作無法復原。」→ 確認後呼叫 `useUpdateLeaveStatus` 帶 `{ status: "已通過" }`（不含 `review_note`，核准不需要理由）。
2. 拒絕：點按鈕先清空 `rejectNote` 再 `setRejectTarget(id)` → `ConfirmDialog`（`variant="destructive"`）「確認拒絕？／拒絕後將通知員工，此操作無法復原。請填寫拒絕理由：」→ 確認後帶 `{ status: "已拒絕", review_note: rejectNote.trim() }`。
3. 兩者成功後都會關閉詳情彈窗（`setDetailRecord(null)`）；若 mutation 拋錯，`catch` 內刻意不處理（保留確認框開著，讓使用者看到底層錯誤或重試——目前沒有顯式錯誤提示 UI，屬已知可改善項；但至少 `loading` 狀態會在失敗後解除，不會一直卡在轉圈）。

## 5. 邊界情況 / 已知限制

- 審核清單不是即時/分頁拉取，是一次抓 `limit=200` 後前端過濾；若待審核以外加上已處理的紀錄總數超過 200，可能漏掉一些「待審核」項目。
- 核准/拒絕失敗時沒有顯式的 `AlertDialog` 提示使用者（只是 `ConfirmDialog` 不會自動關閉），使用者體感上可能像是「卡住」——不過送出中會有轉圈動畫，至少能確認「有按到」。

## 6. 與其他頁面的關聯

- 核准/拒絕成功後，`useUpdateLeaveStatus` 會 invalidate `leaveKeys.all`、`quotaKeys.all`、`overviewKeys.all`：
  - `/overview` 的待審核數會更新；本月已核准數是用 `reviewed_at`（審核時間）篩，所以核准成功後也會立即反映在當月。
  - 申請人的 `/leave-balance` 假別餘額會重新計算（核准後才真正扣除額度；待審核狀態是否預扣額度由後端 `remaining_hours` 決定，前端只讀取結果）。
  - `/records`、`/employee-records` 的狀態徽章會同步更新。
- 詳情彈窗 `LeaveDetailDialog` 與 `/records`、`/employee-records` 共用同一元件，只是本頁額外傳入 `footerActions`。
