# 03 — 總覽（Overview）

路由：`/overview`
權限：`admin`、`sup_admin`（路徑在 `lib/routes.ts` 的 `ADMIN_ONLY_PATHS` 裡，員工訪問會被 `AppShell` 導回 `/leave-balance`）
原始碼：`src/app/overview/page.tsx`、`src/features/overview/*`

管理者登入後的首頁（`getHomePath("admin"|"sup_admin") === "/overview"`），用於快速掌握目前待辦事項與團隊概況。

---

## 1. 頁面目的

一眼看到：有多少申請待審核、本月已核准多少筆、公司總人數，以及選定年度每個月的請假次數（看出哪個月是請假尖峰），不提供任何審核操作，純展示 + 一個導覽捷徑（前往審核）。

## 2. UI 結構

- 標題「總覽」。
- 上方三張統計卡（`grid sm:grid-cols-3`）：
  1. 待審核申請（筆數，amber 色）
  2. 本月已核准（筆數，blue 色）
  3. 員工人數（人數，預設色）
  - 載入中以 `"—"` 佔位，不顯示 0 造成誤解。
- **待審核申請**：標題旁有「前往審核」按鈕（連到 `/review`）。
  - 空狀態：虛線卡片 + 文案「目前沒有待審核的申請」。
  - 有資料：最多顯示前 5 筆，每筆卡片顯示申請人姓名、假別徽章（依 `LEAVE_QUOTAS` 配色）、時數。
  - 若 `pending_count > 5`：底部顯示「還有 N 筆，前往查看」連到 `/review`。
- **每月請假統計**：標題旁是年度下拉選單（近 6 年，預設今年）。
  - 有資料時，若最高次數月份 > 0，上方會顯示一行「請假尖峰月份：X 月（Y 次請假）」。
  - 長條圖：12 根柱子固定排 1～12 月，柱子上方顯示該月次數、下方顯示月份；尖峰月份的柱子顏色較深（`bg-blue-600`），其他月份較淺（`bg-blue-200`）。柱子高度是用當月次數 / 全年最大值換算的像素高度，不是用百分比，避免依賴 flex 容器高度的隱性行為。

> 舊版曾有「員工年請假總時數」排行榜區塊（`top_leave_hours`），因為後端那支查詢沒篩期間，到職久的員工會把歷年累計全部算進去、數字失真，已拿掉並換成上面這個每月統計長條圖（決議過程見 `docs/spec/leaves-system.md` 第 10 節 v4 註記）。

## 3. 資料流 / API

| Hook | 查詢鍵 | API | 說明 |
| --- | --- | --- | --- |
| `useOverviewQuery()`（`features/overview/hooks.ts`） | `overviewKeys.all` | `GET /overview` | 待審核數、本月核准數、員工數、待審核清單 |
| `useOverviewMonthlyQuery(year)`（`features/overview/hooks.ts`） | `overviewKeys.monthly(year)` | `GET /overview/leave-count-monthly?year=` | 指定年度 1~12 月的請假次數，獨立 API，可依年度篩選，跟上面那支不綁在一起 |

### 回應資料結構

```ts
interface PendingLeaveItem {
  id: string;
  user_id: number;
  user_name: string;
  type: string;
  hours: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface OverviewData {
  pending_count: number;
  approved_this_month: number;  // 用 reviewed_at（審核時間）篩，不是 created_at（申請時間）
  employee_count: number;       // 只計算啟用中的員工（is_active=true）
  pending_list: PendingLeaveItem[];
}

interface MonthlyLeaveStat {
  month: number;   // 1~12
  count: number;   // 當月「已通過」假單次數，依 start_date 歸屬月份
}

interface MonthlyLeaveStatsData {
  year: number;
  months: MonthlyLeaveStat[];  // 固定 12 筆
}
```

- `employee_count` 依後端規格只計入啟用中的帳號（見 `docs/employee-deactivate.md` §6）。
- 本頁待審清單只做「顯示」，不提供審核操作；要核准/拒絕需點進 `/review` 或 `/employee-records`。

## 4. 互動行為

- 無任何表單輸入，只有年度下拉選單（`<select>`，切換會重新打 `useOverviewMonthlyQuery(year)`）跟一個導覽捷徑（「前往審核」）。
- 載入狀態：統計卡、待審清單、每月統計各自獨立處理 `loading`（卡片顯示脈動效果的占位卡 `animate-pulse`）。

## 5. 邊界情況

- `data` 為 `undefined`（尚未載入或查詢出錯）時，各區塊一律當作「無資料」處理，不會噴錯誤畫面。
- 待審清單固定只顯示前 5 筆，即使 `pending_list` 回傳超過 5 筆也不會在本頁全部列出，需導去 `/review` 看完整清單。
- 全年每月次數都是 0 時，不顯示「請假尖峰月份」提示文字，長條圖的柱子一律是最小高度的細線。

## 6. 與其他頁面的關聯

- 「前往審核」→ `/review`（`06-review.md`）。
- 本頁的 `/overview` 資料會在任何審核動作（`/review`、`/employee-records` 的核准/拒絕/銷假）、請假 CRUD（`/apply`、`/records` 取消）發生後失效重抓——因為 `features/leaves/hooks.ts` 的 mutation 成功時會一併 `invalidateQueries(overviewKeys.all)`，而 `overviewKeys.monthly(year)` 的 queryKey 是 `overviewKeys.all` 的子集，也會一併被連帶失效。
