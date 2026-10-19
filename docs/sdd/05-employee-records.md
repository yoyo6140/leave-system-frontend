# 05 — 員工請假紀錄（Employee Records）

路由：`/employee-records`
權限：僅 `admin`
原始碼：`src/app/employee-records/page.tsx`

管理者檢視**全公司**所有員工的請假申請紀錄（唯讀），與 `/records`（個人紀錄、不分角色只看自己）是兩個獨立頁面，刻意不共用查詢邏輯。

---

## 1. 頁面目的

讓管理者依姓名/帳號/原因搜尋，查看任何員工、任何狀態的請假紀錄明細，但不在此頁進行任何修改（核准/拒絕在 `/review`；取消申請是申請人自己在 `/records` 做的事）。

## 2. UI 結構

- 標題「員工請假紀錄」+「共 N 筆全公司請假紀錄」。
- 空狀態（無任何紀錄且沒有搜尋字串）：虛線卡片「尚無任何員工的請假紀錄」。
- 否則顯示 `DataTable`（`src/components/records/data-table.tsx`），欄位（由 `createColumns(undefined, true)` 產生，`isAdmin=true` 多插入「申請人」欄，`onDelete` 未帶入所以**不顯示操作欄**）：
  - 申請人（姓名，查不到則顯示 `#user_id`）
  - 假別（徽章）
  - 開始日期 / 結束日期
  - 時數（含「約 X 天」）
  - 原因（截斷顯示，無則 `—`）
  - 狀態（徽章）
  - 申請日期
- 點擊任一列 → 開 `LeaveDetailDialog`（`isAdmin` 模式，但本頁不傳 `footerActions`，所以彈窗內不會出現核准/拒絕按鈕——純檢視）。
- 表格內建搜尋框（placeholder：「搜尋姓名、帳號或原因...」），伺服器端分頁（`serverPagination`，`PAGE_SIZE=12`）。

## 3. 資料流 / API

| Hook | API | 端點 | 參數 |
| --- | --- | --- | --- |
| `useLeavesQuery({ page, limit, search })` | `leaveApi.getList` | `GET /leaves` | 不帶 `mine`，admin 預設可查全公司；`search` 由後端比對申請人姓名/帳號 |
| `useUsersQuery({ limit: 200 })` | `userApi.getList` | `GET /users` | 一次抓多一點筆數，用來在前端建立 `userMap: id → name` |

- `records = leavesData.data.map(r => ({ ...r, _username: userMap[r.user_id] }))`，`_username` 是前端補上去給表格「申請人」欄用的顯示欄位。
- `loading = leavesLoading || usersLoading`，兩個查詢都完成才視為載入完畢。

## 4. 互動行為

- 搜尋框輸入 debounce 1 秒才真正送出查詢（`search` state 與 `searchInput` 分離），且會重置 `page = 1`。
- 分頁變化由 `DataTable` 的 `serverPagination.onPageChange` 回呼觸發，更新 `page` state 後重新查詢。
- 若目前頁碼超出新的總頁數（例如搜尋後資料變少），`useEffect` 自動把 `page` 調回 `pageCount`。

## 5. 邊界情況

- `userMap` 找不到對應使用者（例如帳號已被極端情況下清除，或資料不同步）時，表格顯示 `#{user_id}` 代替姓名。
- 本頁查詢固定 `limit: 200` 抓使用者清單；若公司員工數超過 200，`userMap` 會不完整，姓名顯示會退回 `#id`（目前未分頁抓取全部使用者，屬已知限制）。

## 6. 與其他頁面的關聯

- 與 `/records`（`09-records.md`）共用 `DataTable`、`createColumns`、`LeaveDetailDialog` 元件，但查詢參數不同（本頁不帶 `mine`，為全公司；`/records` 一律帶 `mine=true`）。
- 本頁不提供核准/拒絕，相關操作請見 `/review`（`06-review.md`）。
- 本頁不提供編輯/取消申請（那是申請人在 `/records` 的操作，且僅限自己的「待審核」紀錄）。
