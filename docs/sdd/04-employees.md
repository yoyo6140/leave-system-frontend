# 04 — 員工管理（Employees）

路由：`/employees`
權限：`admin`、`sup_admin`
原始碼：`src/app/employees/page.tsx`、`src/features/users/*`

管理公司所有帳號（員工 + 主管 + 總管理員）：新增、編輯基本資料、啟用／停用登入權限。**不提供刪除**，帳號只會被停用，請假紀錄永久保留（見 `docs/employee-deactivate.md`）。admin 跟 sup_admin 能管的範圍不一樣，見下方權限分界。

---

## 0. 權限分界（admin vs sup_admin）

| 動作 | sup_admin | admin |
| --- | --- | --- |
| 新增/編輯/啟停用 employee 帳號 | 可 | 可 |
| 新增/編輯/啟停用 admin、sup_admin 帳號 | 可（**不含自己**） | 不可，連自己的 admin 帳號也不行 |
| 指定角色（新增時選 employee/admin/sup_admin） | 可 | 不可，新增的一律是 employee |
| 修改角色、受雇日期 | 可（**不含自己**） | 不可（連自己的也不行） |
| 看到「主管列表」區塊 | 看到 admin + sup_admin 全部 | 只看到 admin（看不到 sup_admin 帳號） |

「不含自己」是這次新補上的規則：sup_admin 不能改自己的角色、不能切換自己的啟用狀態，對應 UI 是直接把控制項拿掉（不是鎖灰）；admin 本來就動不了任何 admin/sup_admin 帳號（含自己），所以 UI 上這兩種角色對自己那一列一律看不到操作按鈕。

## 1. 頁面目的

讓管理者建立新帳號、維護員工個人資料（供特休天數等計算使用）、在員工離職/請假時暫停其登入權限而不遺失歷史紀錄；sup_admin 另外可以管理 admin/sup_admin 帳號本身。

## 2. UI 結構

- 標題「員工管理」+ 目前帳號總數（`共 N 筆帳號`）。
- 右上「新增員工」按鈕（outline，`UserPlus` icon）→ 開 `AddDialog`。
- 搜尋列：
  - 左側搜尋框（姓名、帳號、身分證字號），debounce 1 秒後才送出查詢；有輸入時旁邊會出現「清除」按鈕。
  - 右側「顯示已停用帳號」checkbox（對應查詢參數 `include_inactive`）。
- 「員工」表格（`role === "employee"`）：姓名（停用者姓名旁附灰底「已停用」標籤）、性別、身分證字號（遮罩顯示，例如 `A12****789`，`maskIdNumber()`）、出生年月日、任職日期、操作欄。
  - 操作欄：編輯圖示按鈕（啟用中帳號都可編輯，不分 admin/sup_admin 皆可操作 employee）＋ 啟用/停用切換開關（`StatusToggle`）。
  - 分頁器在表格下方（上一頁/下一頁/第一頁/最後一頁 + 「第 X 頁，共 Y 頁（N 筆）」）。
- 「管理層帳號」區塊：admin 視角只列 `role === "admin"`；sup_admin 視角列 `role in (admin, sup_admin)`。列出姓名、角色徽章（`ROLE_LABEL`：總管理員／主管）。
  - 編輯按鈕：只有 `isSupAdmin` 才顯示。
  - 啟用/停用開關：只有 `isSupAdmin && !isSelf(row)` 才顯示——admin 完全看不到這排開關，sup_admin 看得到除了自己以外的開關。
- 新增 / 編輯皆為置中 Modal（`ModalShell`，`createPortal` 至 `document.body`）。

## 3. 資料流 / API

| Hook | API | 端點 | 備註 |
| --- | --- | --- | --- |
| `useUsersQuery(params)` | `userApi.getList` | `GET /users` | 參數：`search`、`page`、`limit`（固定 `PAGE_SIZE=12`）、`include_inactive` |
| `useCreateUser()` | `userApi.create` | `POST /user` | 成功後 invalidate `userKeys.all`（連帶 `overviewKeys.all`） |
| `useUpdateUser()` | `userApi.update` | `PUT /user/{id}` | 同上 |
| `useUpdateUserStatus()` | `userApi.updateStatus` | `PATCH /user/{id}/status` | body `{ is_active }`；取代舊版的刪除 API |

### 型別

```ts
interface ApiUser {
  id: number; username: string; name: string; role: string;
  email: string; gender: string; id_number: string;
  hire_date: string; birth_date: string; is_active: boolean;
}

// 帳號、密碼都由後端自動產生（A0001 起、預設密碼 6666666），表單不收這兩個欄位
interface UserCreateInput {
  name: string; role: string;
  email: string; gender: string; id_number: string;
  hire_date: string; birth_date: string;
}

interface UserUpdateInput {
  name: string; role: string; email: string;
  gender: string; id_number: string; hire_date: string; birth_date: string;
}
```

列表回應：`{ total, page, limit, data: ApiUser[] }`。

## 4. 表單欄位

### 新增（`AddDialog`）

| 欄位 | 必填 | 限制 |
| --- | --- | --- |
| 姓名 name | ✓ | — |
| 信箱 email | ✓ | `type=email`，後端驗證唯一值 |
| 性別 gender | ✓ | 下拉「男／女」 |
| 身分證字號 id_number | ✓ | 只檢查長度 10（`idNumberSchema`），不檢查格式；後端另外擋重複（`ID_NUMBER_EXISTS`） |
| 出生年月日 birth_date | ✓ | `type=date` |
| 任職日期 hire_date | ✓ | `type=date`，用於特休天數起算 |
| 角色 role | 僅 sup_admin 的表單才有這欄 | `RoleSelect`：員工／主管／總管理員；admin 開的 `AddDialog` 不顯示這欄，一律建立 `role: "employee"` |

帳號（`A0001` 起）跟預設密碼（`6666666`）由後端自動產生，表單完全不收這兩個欄位。

### 編輯（`EditDialog`）

- 帳號（username）鎖定不可改。
- 可改：姓名、信箱、性別、身分證字號（自動轉大寫）、出生年月日。
- 角色、任職日期：
  - `canEditRoleAndHireDate = isSupAdmin && !isSelf(editTarget)`——只有 sup_admin 編輯「別人」的帳號時才能改。
  - 不能改的情況下，這兩欄仍然顯示但鎖灰（`disabled`），`FieldLabel` 會依原因加註「（不可修改自己）」或「（僅 sup_admin 可修改）」，不是直接把欄位藏起來。
  - 鎖住時送出的 payload 照原值帶（`canEditRoleAndHireDate ? value : user.value`），不會把鎖住欄位的本地 state 誤送出去。

## 5. 互動與驗證規則

- 新增送出前前端二次驗證（即使 `Input` 已有 `required`/`minLength`）：
  - 身分證字號長度不是 10 → 彈 `AlertDialog`「身分證字號須為 10 個字元」。
- 啟用/停用：點擊切換開關不會立刻送出，而是先開 `ConfirmDialog`：
  - 停用（`variant="destructive"`）：「停用後「{name}」將無法登入，請假紀錄會保留，之後可以重新啟用。」
  - 啟用（`variant="default"`）：「啟用後「{name}」將可再次使用原本的帳號密碼登入。」
  - 確認後呼叫 `useUpdateUserStatus`，成功顯示對應 `SuccessDialog`。
- 自己本人（`isSelf(row)`）：員工列表（不會出現自己，因為自己是 admin/sup_admin 身分）跟管理層列表的開關都不會顯示（詳見 §0、§2）。
- 停用後若目前頁碼超出新的總頁數，`useEffect` 自動把 `page` 調回最後一頁，避免顯示空白頁。

## 6. 錯誤處理

- 查詢清單失敗（`isError`）：顯示 `AlertDialog`，訊息取 `error.message`，預設「查詢員工列表失敗」。
- 新增/編輯/切換狀態任一 mutation 失敗：顯示 `AlertDialog`，訊息取 `err.message`，各自有預設文案（「新增員工失敗」/「更新員工失敗」/「更新帳號狀態失敗」）。
- 常見後端錯誤碼：
  - `CANNOT_DEACTIVATE_SELF`（400）：不可停用自己。
  - `CANNOT_CHANGE_OWN_ROLE`（400）：sup_admin 不可修改自己的角色（JWT 只帶 user id、角色即時查 DB，改掉自己的角色下一請求就生效，怕唯一的 sup_admin 把自己鎖死）。
  - `FORBIDDEN`（403）：admin 嘗試管理 admin/sup_admin 帳號、或嘗試改角色/受雇日期。
  - `EMAIL_EXISTS` / `ID_NUMBER_EXISTS`（409）：信箱或身分證字號重複（含已停用帳號佔用的情況）。
  - `USER_NOT_FOUND`（404）。

## 7. 與其他頁面的關聯

- 員工姓名顯示於 `/review`、`/employee-records`（透過 `useUsersQuery` 建立 `userMap: id → name`，也用來把假單的 `changed_by` user id 轉成姓名顯示在異動紀錄）。
- 停用帳號後：該使用者既有登入 token 立即失效，之後任何需登入的 API 回 401，前端統一導回 `/login`（見 `01-summary.md` §6）。
- 總覽頁 `employee_count` 只計入啟用中的員工，與本頁「顯示已停用帳號」勾選與否無關（那只是前端查詢參數，不影響總覽統計）；新增帳號、切換啟用/停用都會一併失效 `overviewKeys.all`，`/overview` 的人數會同步更新（見 `12-validation-and-data-layer.md` §3.4）。
