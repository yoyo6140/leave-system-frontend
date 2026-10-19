# 09 — 個別請假紀錄（Records）

路由：`/records`
權限：`admin` + `employee`（**不分角色，一律只看自己**）
原始碼：`src/app/records/page.tsx`、`src/components/records/*`

每個登入者（無論 admin 或 employee）查看並管理「自己」送出過的請假申請：可查看詳情、編輯待審核的申請、取消待審核的申請。

---

## 1. 頁面目的

讓使用者追蹤自己每一筆請假申請的狀態，並在審核結果出來前有機會修改或取消。與 `/employee-records`（admin 專用，查全公司）刻意分開：本頁查詢固定帶 `mine=true`，交給後端強制只回傳自己的資料，即使是 admin 登入也一樣。

## 2. UI 結構

- 標題「個別請假紀錄」+ 右上「新增申請」按鈕（→ `/apply`）。
- 空狀態（無紀錄且無搜尋字串）：虛線卡片「尚無請假紀錄」+「立即申請」按鈕。
- 否則顯示 `DataTable`（`createColumns(handleDelete, false, setEditRecord)`，非 admin 模式不顯示「申請人」欄；因為有帶 `onDelete`，所以會顯示「操作」欄）：
  - 假別 / 開始日期 / 結束日期 / 時數（約幾天） / 原因 / 狀態 / 申請日期 / **操作**。
  - 操作欄為下拉選單（`MoreHorizontal`）：「編輯」「取消申請」，兩者**僅在狀態為「待審核」時可點擊**（`canCancel = status === "待審核"`，否則選項 disabled）。
- 點擊整列 → 開 `LeaveDetailDialog`（非 admin 模式，不帶 `footerActions`，純檢視）。
- 點「編輯」→ 開 `EditLeaveDialog`（可改假別、日期區間、時數、原因）。
- 點「取消申請」→ `ConfirmDialog`（destructive）「確認取消申請？／取消後此紀錄狀態會變成「已取消」，無法復原成待審核。」

## 3. 資料流 / API

| Hook | API | 端點 | 參數 |
| --- | --- | --- | --- |
| `useLeavesQuery({ limit: 100, mine: true, search })` | `leaveApi.getList` | `GET /leaves?mine=true` | 固定帶 `mine=true`；`limit=100`（非伺服器分頁，一次抓較多筆） |
| `useDeleteLeave()` | `leaveApi.delete` | `DELETE /leaves/{id}` | 語意是「取消申請」＝軟刪除，狀態改為「已取消」，紀錄保留 |
| `EditLeaveDialog` 內部用 `useUpdateLeave()` | `leaveApi.update` | `PUT /leaves/{id}` | body `{ type, start_date, end_date, hours, reason }` |

- 搜尋框（placeholder「搜尋原因...」）debounce 1 秒才送出。
- 本頁的 `DataTable` **沒有**傳 `serverPagination`（與 `/employee-records` 不同），表格分頁在前端做（`loading` 狀態下靠 `limit: 100` 一次抓足）。

## 4. 編輯規則（`EditLeaveDialog`）

- 僅能編輯目前狀態為「待審核」的紀錄（下拉選單「編輯」在非待審核時 disabled，理論上不會開到非待審核的編輯框）。
- 開啟時以該筆紀錄現值初始化表單（假別、日期區間、時數、原因）。
- 驗證：必須選到日期（否則「請選擇請假日期」）、時數必須 > 0（否則「請填寫請假時數」）。
- 注意：編輯表單**沒有**像 `/apply` 一樣做剩餘額度上限檢查（`Input` 沒設 `max`），完全交由後端把關額度是否足夠。
- 儲存成功 → 關閉 Modal 並呼叫 `onSaved()`（`refetch()` 重新拉清單）。

## 5. 取消規則

- 只有「待審核」狀態可取消；一旦被核准或拒絕就不能再取消或編輯（UI 層面 disabled）。
- 取消 = `DELETE /leaves/{id}`，語意上是把狀態改成「已取消」（軟刪除），**不是真的刪除資料**，歷史紀錄仍查得到。
- 取消後無法復原回「待審核」。

## 6. 邊界情況

- `useLeavesQuery` 這裡沒有處理查詢失敗的顯式錯誤提示（不像 `/employees` 有 `isError` → `AlertDialog`），失敗時畫面上只會停留在 loading 或顯示空清單，屬已知可改善項。
- `EditLeaveDialog` 編輯時沒有重新檢查當前額度是否因其他已核准申請而變少，可能送出後被後端拒絕（額度不足），需靠後端回應的錯誤訊息呈現（`error.message` 顯示在表單內的紅底提示）。

## 7. 與其他頁面的關聯

- 「新增申請」→ `/apply`（`08-apply.md`）。
- 編輯/取消成功都會 invalidate `leaveKeys.all`、`quotaKeys.all`、`overviewKeys.all`：`/leave-balance` 額度、`/overview` 統計會同步更新。
- 與 `/employee-records`（`05-employee-records.md`）共用 `DataTable`／`createColumns`／`LeaveDetailDialog`，但查詢範圍（僅自己 vs 全公司）與是否可編輯/取消完全不同，是兩個獨立頁面，不要混用查詢邏輯。
