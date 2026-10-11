# 06 — 假別餘額（Leave Balance）

路由：`/leave-balance`
權限：`admin` + `employee`（員工登入後首頁，`getHomePath("employee")`）
原始碼：`src/app/leave-balance/page.tsx`、`src/features/quota/*`

顯示登入者本人目前各假別的剩餘時數／天數，是員工最常用的頁面之一。

---

## 1. 頁面目的

讓使用者（不分角色，但內容只會是「自己」的額度）快速知道各假別還剩多少小時可以請，以及特休是依什麼基準計算（到職年資）。

## 2. UI 結構

- 標題「假別餘額」+ 右上「申請請假」按鈕（outline，連到 `/apply`）。
- 基本資訊卡：員工編號（username）、姓名、統計週年度（`yearStart ～ yearEnd`）。
  - 若有特休的 `note`（年資計算基準說明），額外在卡片底部顯示一行：「特休計算基準：{note}（依勞基法第 38 條）」。
- 假別卡片網格（`sm:grid-cols-2 lg:grid-cols-4`），載入中顯示 7 張骨架卡（`animate-pulse`）。
  - 每張卡：假別徽章 + 總額度（`共 N 小時` 或「無上限」）、剩餘小時數（大字）、約等於幾天、已使用小時數。
  - 若 `remaining === null`（代表該假別無固定額度，如公假/其他）：改顯示 `note` 說明文字（無則顯示「依實際需要申請」）。

## 3. 資料流 / API

| Hook | API | 端點 | 說明 |
| --- | --- | --- | --- |
| `useMyQuotaQuery(asOf?)` | `quotaApi.getMine` | `GET /leave-quota/me`（可選 query `as_of`） | 只能查自己，無法指定其他使用者 |

### 回應結構

```ts
interface QuotaItem {
  type: string;
  total_days: number | null;
  total_hours: number | null;
  used_hours: number;
  remaining_hours: number | null;  // null = 無上限
  note: string | null;
}

interface LeaveQuotaData {
  user_id: number; username: string; name: string;
  as_of: string; year_start: string; year_end: string;
  quotas: QuotaItem[];
}
```

- 頁面把 `quotas` 轉成 `DisplayQuota[]`（`buildDisplay()`），補上畫面用的 `bgColor`/`textColor`（取自 `LEAVE_QUOTAS[type]`，查無樣式則 fallback 灰色）。
- 「年資計算基準」文字來自 `quotas.find(q => q.type === "特休").note`。

## 4. 互動行為

- 本頁無任何輸入或操作，純展示；唯一互動是導向 `/apply` 的按鈕。
- 載入狀態以骨架卡呈現，不會讓畫面空白跳動。

## 5. 邊界情況

- 若某假別 `remaining_hours === null`（無上限類型，如公假、其他），不顯示剩餘時數/天數，只顯示 `note` 說明。
- 若查不到特休項目，年資基準提示整段不顯示（`seniority` 為空字串時判斷為 falsy）。
- `yearStart`/`yearEnd` 缺失時，統計週年度顯示 `—`。

## 6. 與其他頁面的關聯

- 「申請請假」按鈕 → `/apply`（`07-apply.md`），該頁同樣使用 `useMyQuotaQuery()` 算剩餘額度上限。
- 任何請假 CRUD（送出申請、取消申請、審核核准/拒絕）都會 invalidate `quotaKeys.all`，本頁資料會在這些動作後自動重新整理（前提是元件仍 mounted 或重新進入頁面觸發 refetch）。
