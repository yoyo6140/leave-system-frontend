# 05 — 員工請假紀錄（Employee Records）

路由：`/employee-records`
權限：`admin`、`sup_admin`
原始碼：`src/app/(protected)/(admin-only)/employee-records/page.tsx`

管理者檢視**全公司**所有員工的請假申請紀錄，與 `/records`（個人紀錄、不分角色只看自己）是兩個獨立頁面，刻意不共用查詢邏輯。本頁不提供編輯/取消（別人的紀錄不能動），但「待審核」可以直接核准/拒絕、「已通過」可以銷假——不是純檢視頁。

---

## 1. 頁面目的

讓管理者依姓名/帳號/原因搜尋、依狀態篩選，查看任何員工、任何狀態的請假紀錄明細，並且可以直接在詳情彈窗裡完成審核（核准/拒絕待審核假單、銷假已通過假單），不需要另外跳去 `/review`。

## 2. UI 結構

- 標題「員工請假紀錄」+「共 N 筆全公司請假紀錄」。
- 空狀態（無任何紀錄、沒有搜尋字串、也沒有狀態篩選）：虛線卡片「尚無任何員工的請假紀錄」。
- 否則顯示 `DataTable`（`src/components/records/data-table.tsx`），欄位（由 `createColumns(undefined, true)` 產生，`isAdmin=true` 多插入「申請人」欄，`onDelete` 未帶入所以**不顯示列內的編輯/取消操作欄**）：
  - 申請人（姓名，查不到則顯示 `#user_id`）
  - 假別（徽章）
  - 開始日期 / 結束日期
  - 時數（含「約 X 天」）
  - 原因（截斷顯示，無則 `—`）
  - 狀態（徽章）
  - 申請日期
- 點擊任一列 → 開 `LeaveDetailDialog`（`isAdmin` 模式，兩欄版面：左邊是假單詳情，右邊是異動紀錄時間軸）。`footerActions` 依狀態顯示不同操作：
  - 狀態 = 待審核：「拒絕」「核准」兩個按鈕。
  - 狀態 = 已通過：「銷假」按鈕。
  - 其他狀態：不顯示任何操作按鈕。
- 表格內建搜尋框（placeholder：「搜尋姓名、帳號或原因...」）+ 狀態篩選下拉（`statusOptions={LEAVE_STATUSES}`），都是打後端 API 的伺服器端篩選，不是前端過濾；伺服器端分頁（`serverPagination`，`PAGE_SIZE=12`）。

## 3. 資料流 / API

| Hook | API | 端點 | 參數 |
| --- | --- | --- | --- |
| `useLeavesQuery({ page, limit, search, status })` | `leaveApi.getList` | `GET /leaves` | 不帶 `mine`，admin/sup_admin 預設可查全公司；`search` 由後端比對申請人姓名/帳號；`status` 對應狀態篩選下拉 |
| `useUsersQuery({ limit: 200 })` | `userApi.getList` | `GET /users` | 一次抓多一點筆數，用來在前端建立 `userMap: id → name`（也給 `LeaveDetailDialog` 的異動紀錄面板轉 `changed_by` 用） |
| `useUpdateLeaveStatus()` | `leaveApi.updateStatus` | `PATCH /leaves/{id}/status` | 核准/拒絕/銷假都走這支，body `{ status, review_note }` |

- `records = leavesData.data.map(r => ({ ...r, _username: userMap[r.user_id] }))`，`_username` 是前端補上去給表格「申請人」欄用的顯示欄位。
- `loading = leavesLoading || usersLoading`，兩個查詢都完成才視為載入完畢。

## 4. 互動行為

- 搜尋框輸入 debounce 1 秒才真正送出查詢（`search` state 與 `searchInput` 分離），且會重置 `page = 1`。狀態篩選下拉是立即觸發（不 debounce），同樣重置 `page = 1`。
- 分頁變化由 `DataTable` 的 `serverPagination.onPageChange` 回呼觸發，更新 `page` state 後重新查詢。
- 若目前頁碼超出新的總頁數（例如搜尋/篩選後資料變少），`useEffect` 自動把 `page` 調回 `pageCount`。
- 核准：點「核准」直接開 `ConfirmDialog`（無須理由），確認後呼叫 `useUpdateLeaveStatus({status:"已通過"})`，loading 中按鈕會顯示轉圈圖示並鎖住。
- 拒絕／銷假：點按鈕先清空理由欄位再開 `ConfirmDialog`，裡面有必填的 `textarea`（理由沒填不能按確認，`confirmDisabled={!note.trim()}`），確認後呼叫 `useUpdateLeaveStatus({status, review_note})`。
- 三個動作成功後都會關閉詳情彈窗，核准/銷假額外彈 `SuccessDialog`。

## 5. 邊界情況

- `userMap` 找不到對應使用者（例如帳號已被極端情況下清除，或資料不同步）時，表格顯示 `#{user_id}` 代替姓名；異動紀錄面板則優先判斷是不是申請人本人（顯示「申請人本人」），否則才退回 `#id`。
- 本頁查詢固定 `limit: 200` 抓使用者清單；若公司員工數超過 200，`userMap` 會不完整，姓名顯示會退回 `#id`（目前未分頁抓取全部使用者，屬已知限制）。
- 狀態轉換不合法（例如已經被別人核准過的假單又被點核准）：後端用條件式 UPDATE 擋下，回「狀態已變更，請重新整理」，前端顯示為一般錯誤（`AlertDialog`）。

## 6. 與其他頁面的關聯

- 與 `/records`（`09-records.md`）共用 `DataTable`、`createColumns`、`LeaveDetailDialog` 元件，但查詢參數不同（本頁不帶 `mine`，為全公司；`/records` 一律帶 `mine=true`）。
- 核准/拒絕的操作邏輯跟 `/review`（`06-review.md`）幾乎一樣（同一支 `useUpdateLeaveStatus`），差別是 `/review` 只列待審核清單、本頁可以看任何狀態並額外支援銷假。
- 本頁不提供編輯/取消申請（那是申請人在 `/records` 的操作，且僅限自己的「待審核」或「已拒絕」紀錄）。
