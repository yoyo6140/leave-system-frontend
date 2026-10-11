# 00 — 大綱（Summary）

> 本文件為請假系統前端的總綱，說明系統目標、角色模型、架構慣例與跨頁共用規則。
> 各頁面的詳細規格見同目錄下 `01-login.md`、`02-overview.md`…依頁面編號遞增。

---

## 1. 系統目標

提供公司內部「請假申請 / 審核 / 額度查詢 / 員工帳號管理」的 Web 系統。
使用者分兩種角色，登入後依角色看到不同的功能與導覽選單，所有資料透過後端 API（FastAPI）存取，不再使用 localStorage 模擬資料。

## 2. 技術棧

| 項目        | 版本 / 說明                         |
| ----------- | ------------------------------------ |
| Framework   | Next.js 16（App Router）             |
| UI          | React 19                             |
| 樣式        | Tailwind CSS v4                      |
| 元件        | Radix UI / shadcn-ui                 |
| 資料請求    | axios（`apiClient`）+ TanStack Query |
| 表格        | TanStack Table                       |
| 圖示        | lucide-react                         |
| 語言        | TypeScript                           |
| 後端        | FastAPI（`NEXT_PUBLIC_API_URL`，預設指向 Render 上的部署）|

## 3. 角色模型

| 角色       | 說明                                             | 登入後首頁       |
| ---------- | ------------------------------------------------ | ---------------- |
| `admin`    | 管理者。可管理員工帳號、審核請假、查看全公司紀錄與總覽 | `/overview`       |
| `employee` | 員工。只能申請請假、查看自己的額度與紀錄           | `/leave-balance`  |

角色判斷與路由保護集中在 `AppLayout`（`src/components/AppLayout.tsx`）：

- 進入任何受保護頁面前，先呼叫 `restoreSession()` 取得目前使用者；沒有使用者則導回 `/login`。
- 頁面可傳入 `allowedRoles`；目前使用者角色不在清單中則導回該角色的首頁（`getHomePath(role)`）。
- `Sidebar`（`src/components/Sidebar.tsx`）依角色過濾顯示的導覽項目，員工不會看到 admin 專屬選單，即使手動輸入網址也會被 `AppLayout` 擋掉並導回。

## 4. 路由總覽

| # 編號 | 路由               | 角色               | 說明                             | 規格文件 |
| ------ | ------------------ | ------------------ | -------------------------------- | -------- |
| 01     | `/login`           | 未登入              | 登入（含忘記密碼、重設密碼）     | `01-login.md` |
| 01     | `/forgot-password`  | 未登入              | 申請密碼重設信                   | `01-login.md` |
| 01     | `/reset-password`   | 未登入              | 使用信件連結設定新密碼            | `01-login.md` |
| 02     | `/overview`         | admin               | 總覽：待審核統計、員工年請假時數 | `02-overview.md` |
| 03     | `/employees`        | admin               | 員工帳號管理（新增/編輯/啟停用） | `03-employees.md` |
| 04     | `/employee-records` | admin               | 全公司請假紀錄（唯讀）            | `04-employee-records.md` |
| 05     | `/review`           | admin               | 審核待審核的請假申請              | `05-review.md` |
| 06     | `/leave-balance`    | admin + employee    | 假別餘額（員工登入後首頁）        | `06-leave-balance.md` |
| 07     | `/apply`            | admin + employee    | 申請請假                         | `07-apply.md` |
| 08     | `/records`          | admin + employee    | 個人請假紀錄（只看自己）          | `08-records.md` |
| 09     | `/ai-analysis`      | admin               | AI 聊天助理（Gemini）             | `09-ai-analysis.md` |
| 10     | `/labor-law`        | admin + employee（無側邊欄入口） | 勞基法假別規則參考        | `10-labor-law.md` |
| —      | `/`                 | 任何已登入           | 依角色導向對應首頁                | 見本文件 §6 |

> Sidebar 實際導覽順序（`src/components/Sidebar.tsx` 的 `ALL_NAV`）：總覽 → 員工管理 → 員工請假紀錄 → 審核管理 → 假別餘額 → 申請請假 → 個別請假紀錄 → AI 分析。本系列規格文件依此順序編號（`/labor-law` 不在選單中，排在最後）。

## 5. 前端架構慣例（`src/features/*`）

每個業務功能放在 `src/features/<name>/`，依職責拆成最多四個檔案：

| 檔案        | 職責                               |
| ----------- | ---------------------------------- |
| `types.ts`  | 資料形狀（request/response 型別）   |
| `api.ts`    | 呼叫後端 API（包 `apiFetch`/`apiClient`）|
| `keys.ts`   | TanStack Query 的 queryKey 命名空間 |
| `hooks.ts`  | 包成 `useQuery` / `useMutation` 給頁面用 |

現有 feature 模組：`auth`、`users`、`leaves`、`quota`、`overview`、`chat`。
頁面（`src/app/**/page.tsx`）只負責畫面與互動，資料邏輯一律透過對應 feature 的 hooks 取得，不直接呼叫 `apiClient`。

## 6. 認證與 Session

- 登入成功後，後端同時：寫入 httpOnly cookie（`withCredentials: true`）、回傳 `data.token`（前端存入 `localStorage: leave_system_token`，供 `Authorization: Bearer` header 使用）。
- 前端另外用 `localStorage: leave_system_auth` 快取使用者基本資料（`User`），避免每次切頁都要重新打 `/auth/me`；但仍會在每次進入 `AppLayout` 時以 `restoreSession()` 重新驗證並覆寫快取。
- `apiClient`（`src/lib/api-client.ts`）的 response interceptor：收到 401 且該次請求不是 `/auth/login`，清除 `leave_system_auth` 並整頁導向 `/login`。
- 根路徑 `/`（`src/app/page.tsx`）與 `/login` 都會呼叫 `restoreSession()`，若已登入直接導向 `getHomePath(role)`，避免已登入使用者停留在登入頁。
- 登出（Sidebar 的「登出」按鈕）：呼叫 `POST /auth/logout` → 清除本地快取（`clearCurrentUser()`）→ `queryClient.clear()`（避免下一位使用者看到前一位的快取資料）→ 導向 `/login`。

## 7. API 慣例

- Base URL：`NEXT_PUBLIC_API_URL`（預設 `https://leave-system-backend-ozw0.onrender.com`）。
- 統一回應格式（除 `/chat` 例外）：

  ```json
  { "success": true, "data": { ... } }
  { "success": false, "error": { "code": "string", "message": "string" } }
  ```

- 端點集中定義於 `src/lib/api-endpoints.ts`（`API_ENDPOINTS`），嚴禁在頁面或 feature 內手刻路徑字串。
- 兩種請求封裝：
  - `apiFetch<T>()`（`src/lib/api-client.ts`）：回傳完整 `ApiResponse<T>`，呼叫端自行判斷 `success`，用於大多數 CRUD。
  - `apiClient`（axios instance）：用於 `auth`、`chat` 等需要直接處理 axios 錯誤或非標準回應（`/chat` 回傳 `{ reply }`）的場景。
- 分頁清單一致格式：`{ total, page, limit, data: T[] }`。
- 列表查詢的搜尋框一律是「打後端 API」而非前端過濾，且統一 debounce 1 秒再送出請求，避免每次按鍵都打 API。

## 8. 共用資料模型

### User（前端正規化後，`src/lib/auth.ts` 的 `User`）

| 欄位         | 型別                      | 說明 |
| ------------ | ------------------------- | ---- |
| `id`         | `number`                  | 使用者 ID |
| `username`   | `string`                  | 登入帳號 |
| `name`       | `string`                  | 姓名 |
| `role`       | `"admin" \| "employee"`   | 角色 |
| `gender`     | `"男" \| "女"`            | 性別（不另設生理假，需自行用其他假別申請）|
| `idNumber`   | `string`                  | 身分證字號 |
| `hireDate`   | `string`（`YYYY-MM-DD`）  | 到職日，特休額度依此起算 |
| `birthDate`  | `string`（`YYYY-MM-DD`）  | 出生日期 |

後端原始欄位為 snake_case（`id_number`/`hire_date`/`birth_date`），並多帶 `email`、`is_active`；前端 `mapApiUser()` 做轉換。

### LeaveType / 假別樣式（`src/lib/leave.ts`）

`特休 / 病假 / 事假 / 婚假 / 喪假 / 公假 / 其他`，每種假別固定一組 `bgColor/textColor/barColor` 供標籤與餘額卡use；徽章圓角統一 `rounded-[8px]`（`LEAVE_BADGE_ROUNDED`）。

### LeaveStatus

`待審核 / 已通過 / 已拒絕 / 已取消`，對應樣式常數 `LEAVE_STATUS_STYLE`。取消申請不是刪除，而是把狀態改成「已取消」（軟刪除，紀錄永久保留）。

### 時數換算

請假以小時為單位，一天 = 8 小時；`hoursToApproxDays(hours) = round(hours/8, 1)`，畫面上大多同時顯示「X 小時（約 Y 天）」。

## 9. 設計規範

- 主色：`#4195C3`（Tailwind `primary`）。
- 卡片／容器大量使用 `rounded-2xl` + `shadow-sm` + `border-border`。
- 假別 / 狀態標籤：`rounded-[8px]`，淺底色 + 深色文字（如 `bg-blue-50 text-blue-600`）。
- 主要操作用 `Button`（primary 藍底）；次要操作用 `variant="outline"`。
- 確認性破壞操作（停用帳號、拒絕申請、取消申請）一律先跳 `ConfirmDialog`（`variant="destructive"`），不會點擊後直接送出。
- 成功提示用 `SuccessDialog`；一般錯誤用 `AlertDialog`；兩者都是跳窗而非 toast。
- Layout：桌面版左側固定 `Sidebar`（寬 `w-56`）+ 上方 `Navbar`；平板/手機版 Sidebar 改為右側抽屜，由 `Navbar` 的漢堡按鈕觸發。

## 10. 跨頁共用元件

| 元件 | 位置 | 用途 |
| --- | --- | --- |
| `AppLayout` | `src/components/AppLayout.tsx` | 登入檢查、角色守門、Sidebar+Navbar 外框 |
| `Sidebar` / `Navbar` | `src/components/*.tsx` | 導覽、登出、目前使用者資訊 |
| `DataTable` / `createColumns` | `src/components/records/*` | 請假紀錄表格（`/records`、`/employee-records` 共用） |
| `LeaveDetailDialog` | `src/components/records/leave-detail-dialog.tsx` | 請假單詳情彈窗（`/review`、`/records`、`/employee-records` 共用） |
| `EditLeaveDialog` | `src/components/records/edit-leave-dialog.tsx` | 編輯「待審核」請假單 |
| `SuccessDialog` / `AlertDialog` / `ConfirmDialog` | `src/components/ui/app-dialog.tsx` | 統一的成功/錯誤/確認跳窗 |
| `AiChat` | `src/components/ai-analysis/ai-chat.tsx` | AI 聊天介面 |

## 11. 本系列文件如何閱讀

每個頁面規格文件（01～10）皆包含：路由與權限、頁面目的、UI 結構、資料流（用到哪些 hooks / API）、互動與驗證規則、邊界情況與錯誤處理、與其他頁面的關聯。內容以目前程式碼實作為準（而非 `docs/api-spec.md` 中偏理想化的草案）；若兩者衝突，以本系列與原始碼為準，`docs/api-spec.md`、`docs/employee-deactivate.md`、`docs/ai-chat.md` 僅作後端串接歷史脈絡參考。
