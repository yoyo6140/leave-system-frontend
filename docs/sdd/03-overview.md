# 03 — 總覽（Overview）

路由：`/overview`
權限：僅 `admin`（頁面放在 `(protected)/(admin-only)/` 路由群組下，員工訪問會被該 layout 導回 `/leave-balance`）
原始碼：`src/app/overview/page.tsx`、`src/features/overview/*`

管理者登入後的首頁（`getHomePath("admin") === "/overview"`），用於快速掌握目前待辦事項與團隊概況。

---

## 1. 頁面目的

一眼看到：有多少申請待審核、本月已核准多少筆、公司總人數、待審清單前幾筆，以及員工年請假總時數排行，並提供捷徑前往「審核管理」「員工管理」。

## 2. UI 結構

- 標題「總覽」。
- 上方三張統計卡（`grid sm:grid-cols-3`）：
  1. 待審核申請（筆數，amber 色）
  2. 本月已核准（筆數，blue 色）
  3. 員工人數（人數，預設色）
  - 載入中以 `"—"` 佔位，不顯示 0 造成誤解。
- 下方左右兩欄（`lg:grid-cols-2`）：
  - **待審核申請**：標題旁有「前往審核」按鈕（連到 `/review`）。
    - 空狀態：虛線卡片 + 文案「目前沒有待審核的申請」。
    - 有資料：最多顯示前 5 筆，每筆卡片顯示申請人姓名、假別徽章（依 `LEAVE_QUOTAS` 配色）、時數。
    - 若 `pending_count > 5`：底部顯示「還有 N 筆，前往查看」連到 `/review`。
  - **員工年請假總時數**：標題旁有「員工管理」按鈕（連到 `/employees`）。
    - 空狀態：虛線卡片 + 文案「尚無員工年請假資料」。
    - 有資料：列出每位員工姓名 + 當年度請假總時數。

## 3. 資料流 / API

| Hook | 查詢鍵 | API | 說明 |
| --- | --- | --- | --- |
| `useOverviewQuery()`（`features/overview/hooks.ts`） | `overviewKeys.all` | `GET /overview` | 單一端點回傳本頁全部所需資料 |

### 回應資料結構（`OverviewData`）

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

interface TopLeaveHoursItem {
  user_id: number;
  name: string;
  hours: number;
}

interface OverviewData {
  pending_count: number;
  approved_this_month: number;
  employee_count: number;      // 只計算啟用中的員工（is_active=true）
  pending_list: PendingLeaveItem[];
  top_leave_hours: TopLeaveHoursItem[];
}
```

- `employee_count` 依後端規格只計入啟用中的帳號（見 `docs/employee-deactivate.md` §6）。
- 本頁待審清單只做「顯示」，不提供審核操作；要核准/拒絕需點進 `/review`。

## 4. 互動行為

- 無任何表單輸入，純展示 + 兩個導覽捷徑（「前往審核」「員工管理」）。
- 載入狀態：三張統計卡與兩個清單區塊各自獨立處理 `loading`（卡片顯示脈動效果的占位卡 `animate-pulse`）。

## 5. 邊界情況

- `data` 為 `undefined`（尚未載入或查詢出錯）時，各區塊一律當作「無資料」處理，不會噴錯誤畫面。
- 待審清單固定只顯示前 5 筆，即使 `pending_list` 回傳超過 5 筆也不會在本頁全部列出，需導去 `/review` 看完整清單。

## 6. 與其他頁面的關聯

- 「前往審核」→ `/review`（`06-review.md`）。
- 「員工管理」→ `/employees`（`04-employees.md`）。
- 本頁資料會在任何審核動作（`/review` 核准/拒絕）、請假 CRUD（`/apply`、`/records` 取消、`/employee-records`）發生後失效重抓——因為 `features/leaves/hooks.ts` 的 mutation 成功時會一併 `invalidateQueries(overviewKeys.all)`。
