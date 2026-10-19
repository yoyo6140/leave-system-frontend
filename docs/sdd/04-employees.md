# 04 — 員工管理（Employees）

路由：`/employees`
權限：僅 `admin`
原始碼：`src/app/employees/page.tsx`、`src/features/users/*`

管理公司所有帳號（員工 + 其他主管）：新增、編輯基本資料、啟用／停用登入權限。**不提供刪除**，帳號只會被停用，請假紀錄永久保留（見 `docs/employee-deactivate.md`）。

---

## 1. 頁面目的

讓管理者建立新員工帳號、維護員工個人資料（供特休天數等計算使用）、在員工離職/請假時暫停其登入權限而不遺失歷史紀錄。

## 2. UI 結構

- 標題「員工管理」+ 目前帳號總數（`共 N 筆帳號`）。
- 右上「新增員工」按鈕（outline，`UserPlus` icon）→ 開 `AddDialog`。
- 搜尋列：
  - 左側搜尋框（姓名、帳號、身分證字號），debounce 1 秒後才送出查詢；有輸入時旁邊會出現「清除」按鈕。
  - 右側「顯示已停用帳號」checkbox（對應查詢參數 `include_inactive`）。
- 「員工」表格（排除角色為 `admin` 的帳號）：姓名（停用者姓名旁附灰底「已停用」標籤）、性別、身分證字號、出生年月日、任職日期、操作欄。
  - 操作欄：編輯圖示按鈕（僅啟用中帳號顯示）＋ 啟用/停用切換開關（`StatusToggle`）。
  - 自己本人的帳號：切換開關 disable，無法自行停用。
  - 分頁器在表格下方（上一頁/下一頁/第一頁/最後一頁 + 「第 X 頁，共 Y 頁（N 筆）」）。
- 「其他主管」區塊：若清單中有 `role === "admin"` 的帳號（人數 > 0 才顯示），列出姓名、角色徽章「主管」、啟用/停用開關；同樣不可停用自己。
- 新增 / 編輯皆為置中 Modal（`ModalShell`，`createPortal` 至 `document.body`）。

## 3. 資料流 / API

| Hook | API | 端點 | 備註 |
| --- | --- | --- | --- |
| `useUsersQuery(params)` | `userApi.getList` | `GET /users` | 參數：`search`、`page`、`limit`（固定 `PAGE_SIZE=12`）、`include_inactive` |
| `useCreateUser()` | `userApi.create` | `POST /user` | 成功後 invalidate `userKeys.all` |
| `useUpdateUser()` | `userApi.update` | `PUT /user/{id}` | 同上 |
| `useUpdateUserStatus()` | `userApi.updateStatus` | `PATCH /user/{id}/status` | body `{ is_active }`；取代舊版的刪除 API |

### 型別

```ts
interface ApiUser {
  id: number; username: string; name: string; role: string;
  email: string; gender: string; id_number: string;
  hire_date: string; birth_date: string; is_active: boolean;
}

interface UserCreateInput {
  username: string; password: string; name: string; role: string;
  email: string; gender: string; id_number: string;
  hire_date: string; birth_date: string;
}

interface UserUpdateInput {
  username: string; name: string; role: string; email: string;
  gender: string; id_number: string; hire_date: string; birth_date: string;
}
```

列表回應：`{ total, page, limit, data: ApiUser[] }`。

## 4. 表單欄位

### 新增（`AddDialog`）

| 欄位 | 必填 | 限制 |
| --- | --- | --- |
| 帳號 username | ✓ | 純文字 |
| 密碼 password | ✓ | 6～12 字元 |
| 姓名 name | ✓ | — |
| 信箱 email | ✓ | `type=email`，後端驗證唯一值 |
| 性別 gender | ✓ | 下拉「男／女」 |
| 身分證字號 id_number | ✓ | 10 字元，格式 `^[A-Z][12]\d{8}$`（前端 regex 驗證，大小寫皆接受）|
| 出生年月日 birth_date | ✓ | `type=date` |
| 任職日期 hire_date | ✓ | `type=date`，用於特休天數起算 |

新增永遠建立 `role: "employee"`（表單未提供角色選擇）。

### 編輯（`EditDialog`）

- 帳號（username）鎖定不可改。
- 可改：姓名、信箱、性別、身分證字號（自動轉大寫）、出生年月日、任職日期。
- `role` 直接沿用原資料送出，編輯頁面不提供角色切換。

## 5. 互動與驗證規則

- 新增送出前前端二次驗證（即使 `Input` 已有 `required`/`minLength`）：
  - 密碼長度須 6～12，否則彈 `AlertDialog`「密碼須為 6～12 個字元」並不送出 API。
  - 身分證字號格式不符 → 彈 `AlertDialog`「身分證字號格式不正確（例：A123456789）」。
- 啟用/停用：點擊切換開關不會立刻送出，而是先開 `ConfirmDialog`：
  - 停用（`variant="destructive"`）：「停用後「{name}」將無法登入，請假紀錄會保留，之後可以重新啟用。」
  - 啟用（`variant="default"`）：「啟用後「{name}」將可再次使用原本的帳號密碼登入。」
  - 確認後呼叫 `useUpdateUserStatus`，成功顯示對應 `SuccessDialog`。
- 自己本人（`currentUser.id === row.id`）：開關強制 disable，點擊也不會開確認框（在 `onRequestToggle` 內提早 return）。
- 停用後若目前頁碼超出新的總頁數，`useEffect` 自動把 `page` 調回最後一頁，避免顯示空白頁。

## 6. 錯誤處理

- 查詢清單失敗（`isError`）：顯示 `AlertDialog`，訊息取 `error.message`，預設「查詢員工列表失敗」。
- 新增/編輯/切換狀態任一 mutation 失敗：顯示 `AlertDialog`，訊息取 `err.message`，各自有預設文案（「新增員工失敗」/「更新員工失敗」/「更新帳號狀態失敗」）。
- 常見後端錯誤碼（依 `docs/employee-deactivate.md`）：`CANNOT_DEACTIVATE_SELF`（400，admin 不可停用自己）、`USER_NOT_FOUND`（404）、`USER_ALREADY_EXISTS` / 409（帳號、信箱、身分證字號重複，含已停用帳號佔用的情況）。

## 7. 與其他頁面的關聯

- 員工姓名顯示於 `/overview`（年請假時數排行）、`/review`、`/employee-records`（透過 `useUsersQuery` 建立 `userMap: id → name`）。
- 停用帳號後：該使用者既有登入 token 立即失效，之後任何需登入的 API 回 401，前端統一導回 `/login`（見 `01-summary.md` §6）。
- 總覽頁 `employee_count` 只計入啟用中的員工，與本頁「顯示已停用帳號」勾選與否無關（那只是前端查詢參數，不影響總覽統計）；新增帳號、切換啟用/停用都會一併失效 `overviewKeys.all`，`/overview` 的人數會同步更新（見 `12-validation-and-data-layer.md` §3.4）。
