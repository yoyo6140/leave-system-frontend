# 07 — 申請請假（Apply）

路由：`/apply`
權限：`admin` + `employee`
原始碼：`src/app/apply/page.tsx`、`src/features/leaves/*`（建立部分）、`src/features/quota/*`（額度檢查）

送出新的請假申請，初始狀態一律為「待審核」。

---

## 1. 頁面目的

讓使用者挑選假別、日期區間、時數、填寫原因後送出申請；送出前先用目前額度做前端提醒（而非完全依賴後端擋）。

## 2. UI 結構

- 標題「申請請假」+ 右上「查看假別餘額」連結（→ `/leave-balance`）。
- 員工資訊卡：員工編號、姓名、入職日期（只顯示，不可編輯）。
- 表單卡片：
  - **假別**：下拉選單，每個選項文字動態顯示剩餘額度，例如「特休（剩餘 72 小時 / 約 9 天）」；額度載入中則只顯示假別名稱。
  - **請假日期**：`DateRangePicker`（可選區間，起訖可相同）。
  - **請假時數**：數字輸入框（`min=1`，`max` 動態帶入該假別剩餘時數，若無上限則不設 `max`）+「小時」單位；下方提示文字：有輸入時數時顯示「約 X 天」，否則顯示該假別目前剩餘額度。
  - **請假原因**：多行文字框，選填。
  - 按鈕：「取消」（`router.back()`）、「送出」。

## 3. 資料流 / API

| Hook | API | 端點 | 用途 |
| --- | --- | --- | --- |
| `useMyQuotaQuery()` | `quotaApi.getMine` | `GET /leave-quota/me` | 算每個假別目前剩餘時數，用於下拉選單顯示與前端上限檢查 |
| `useCreateLeave()` | `leaveApi.create` | `POST /leaves` | 送出申請，body：`{ type, start_date, end_date, hours, reason }` |

- `remaining` 用 `useMemo` 從 `quota.quotas` 算出 `Record<LeaveType, number | null>`；某假別若在 `quotas` 中查無資料，預設視為 `0`（除非該類型本身 `total_hours === null` 代表無上限）。
- `start_date`/`end_date` 用 `date-fns format(date, "yyyy-MM-dd")` 轉換；若只選了起始日沒選結束日，`end_date` 會 fallback 成跟 `start_date` 一樣（單日請假）。

## 4. 驗證規則（送出前，前端擋）

1. 必須選到起始日期（`!startDate` → Alert「請選擇請假日期」）。
2. 時數必須 > 0（`!hours || hours <= 0` → Alert「請填寫請假時數」）。
3. 若該假別有上限（`remaining[type] !== null`）且申請時數 > 剩餘時數 → Alert「{假別} 剩餘時數不足（剩餘 X 小時，申請 Y 小時）」，不送出 API。
4. 以上全部通過才呼叫 `createLeave.mutateAsync(...)`。

> 注意：這是前端提醒，最終額度判斷仍以後端為準（後端也可能回 `QUOTA_EXCEEDED` 類錯誤，見 `docs/api-spec.md`）。

## 5. 互動行為

- 送出成功 → `SuccessDialog`「申請成功／請假申請已送出，等待主管審核。」，關閉後 `router.push("/records")`（跳去看自己剛送出的紀錄）。
- 送出失敗（API 丟錯）→ `AlertDialog`「無法送出」，訊息取 `err.message`，預設「新增假單失敗」。
- 假別下拉選單在額度查詢載入中會 disable，避免使用者選到還沒確認額度的選項。

## 6. 邊界情況

- 某假別無上限（`total_hours === null`）：下拉選項不顯示剩餘額度數字，時數輸入框也不設 `max`，前端驗證第 3 條自動跳過（`remaining[type] === null`）。
- 使用者只選了日期區間的起點（沒有終點）：視為單日請假，`end_date = start_date`。

## 7. 與其他頁面的關聯

- 送出成功後導向 `/records`（`08-records.md`），可立即看到剛建立、狀態為「待審核」的紀錄。
- 送出成功會 invalidate `leaveKeys.all`、`quotaKeys.all`、`overviewKeys.all`：`/leave-balance` 額度、`/overview` 統計、`/review`／`/employee-records` 清單都會反映新紀錄。
- 「查看假別餘額」連回 `/leave-balance`（`06-leave-balance.md`）。
