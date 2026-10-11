# 01 — 登入（登入 / 忘記密碼 / 重設密碼）

路由：`/login`、`/forgot-password`、`/reset-password`
權限：僅限**未登入**使用者的流程（已登入會被導走，見下方「進入規則」）。
原始碼：`src/app/login/page.tsx`、`src/app/forgot-password/page.tsx`、`src/app/reset-password/page.tsx`、`src/features/auth/*`、`src/lib/auth.ts`

這三頁屬於同一組「認證流程」，依使用者操作順序串接：登入 →（忘記密碼）→ 寄信 →（信件連結）→ 重設密碼 → 回登入。

---

## 1. 頁面目的

讓使用者用帳號密碼登入系統；忘記密碼時可憑信箱收重設連結，自行設定新密碼後重新登入。不走 OAuth，單純帳密 + email 重設流程。

## 2. 進入規則

- `/login`、根路徑 `/`（`src/app/page.tsx`）在 mount 時都會呼叫 `restoreSession()`：
  - 已登入 → `router.replace(getHomePath(user.role))`，不會讓已登入者停留在登入頁。
  - 未登入 → 停留在 `/login`（或由 `/` 導向 `/login`）。
- `/forgot-password`、`/reset-password` 不檢查登入狀態，任何人都能開啟（`/reset-password` 需要 URL 帶 `token` 才能真正送出）。

## 3. UI 結構

### 3.1 `/login`

- 置中卡片（`Card padding="xl"`），上方 Logo + 標題「請假系統」。
- 表單欄位：帳號（`Input`，純文字）、密碼（`Input type=password`，右側有眼睛圖示可切換顯示/隱藏）。
- 錯誤訊息區塊：紅底（`bg-destructive/10`），顯示在表單內、送出按鈕上方。
- 送出按鈕：loading 時文字變「登入中...」並 disable。
- 「忘記密碼？」連結 → `/forgot-password`。
- 黃底提示框：說明後端部署在 Render 免費方案，閒置後首次登入可能要等 10～30 秒。
- 測試帳號快速填入區：點擊卡片即自動填入帳密並清空錯誤訊息（目前寫死兩組：`admin` / `chen_zhiming`，密碼分別為 `admin1234` / `pass1234`，僅前端展示用，與實際測試帳密是否一致需另行確認）。

### 3.2 `/forgot-password`

- 同款置中卡片，標題「忘記密碼」。
- 未送出時：單一信箱欄位 + 「送出重設連結」按鈕 + 「返回登入」連結。
- 送出成功後（`sent === true`）：改顯示綠底提示「若此信箱已註冊，您將收到密碼重設信件，請確認信箱（含垃圾郵件）」+「返回登入」按鈕（`variant="outline"`）。

### 3.3 `/reset-password`

- 同款置中卡片，標題「重設密碼」。
- 讀取 URL query `token`；若無 token，進頁即顯示錯誤「無效的重設連結，請重新申請。」且欄位 disable、送出按鈕 disable。
- 欄位：新密碼（可切換顯示/隱藏）、確認新密碼，皆限制 6～12 字元。
- 成功後：顯示綠底提示「密碼已成功重設，3 秒後將自動跳轉至登入頁」，同時 `setTimeout` 3 秒後 `router.push("/login")`，並提供「立即登入」按鈕可提早跳轉。
- 本頁因使用 `useSearchParams()`，表單部分包在 `<Suspense>` 中。

## 4. 資料流 / API

| 動作 | 函式 | 端點 | 備註 |
| --- | --- | --- | --- |
| 登入 | `login()`（`src/lib/auth.ts`）→ `Login()`（`features/auth/api.ts`）| `POST /auth/login` | 成功後再呼叫 `apiGetMe()`（`GET /auth/me`）取使用者完整資料 |
| 檢查現有 session / 取回使用者 | `restoreSession()` | `GET /auth/me` | 失敗（包含 401）則視為未登入並清快取 |
| 登出 | `Logout()` | `POST /auth/logout` | 失敗也忽略（`try { } catch {}`），不阻擋登出流程 |
| 忘記密碼 | `forgotPassword(email)` | `POST /auth/forgot-password` | body `{ email }` |
| 重設密碼 | `resetPassword(token, newPassword)` | `POST /auth/reset-password` | body `{ token, new_password }` |

### 登入流程細節（`login()`）

1. 呼叫 `/auth/login`；若 `success=false`：
   - `error.code === "ACCOUNT_DISABLED"` → 顯示該帳號已停用的訊息（見 `docs/employee-deactivate.md`，帳號密碼正確但帳號被停用時回 403）。
   - 其他失敗 → 顯示 `error.message`，預設文案「帳號或密碼錯誤」。
2. 成功則將 `data.token` 存入 `localStorage: leave_system_token`（供 axios interceptor 加上 `Authorization: Bearer`；後端同時也用 httpOnly cookie，兩者併行）。
3. 呼叫 `/auth/me` 取得完整使用者資料並正規化（`mapApiUser`）、寫入 `localStorage: leave_system_auth`。
4. 若 `/auth/me` 失敗（回 `null`），即使登入 API 成功也視為登入失敗，顯示「登入成功但無法取得使用者資訊，請稍後再試」。
5. 頁面拿到 `success:true` 後 `router.push(getHomePath(result.user.role))`。

## 5. 前端驗證規則

- 密碼長度：登入、重設密碼皆要求 6～12 字元（`minLength`/`maxLength` + JS 判斷），不符合直接擋在前端不送出 API。
- 重設密碼：新密碼與確認密碼必須相符，否則顯示「兩次輸入的密碼不相符」。
- 帳號、信箱為必填（`required`），信箱欄位用 `type="email"` 做基本格式檢查。
- 無 token 時 `/reset-password` 的送出按鈕與輸入框全部 disable，避免無效請求。

## 6. 錯誤處理

- 登入 API 呼叫本身失敗（網路錯誤 / 後端未啟動）：`catch` 顯示「無法連線至伺服器，請確認後端是否已啟動」。
- `forgotPassword` / `resetPassword` 走 `AuthBody` 格式，失敗時顯示 `error.message`，預設「發生錯誤」；網路例外顯示「網路錯誤」。
- 忘記密碼不論信箱是否存在，後端都回 200 + 固定文案（避免帳號列舉），前端因此一律視為「已送出」顯示同一句提示。

## 7. 與其他頁面的關聯

- 登入成功導向：`admin → /overview`、`employee → /leave-balance`（`getHomePath()`，見 `00-summary.md` §3）。
- 任何受保護頁面偵測到未登入（`AppLayout` 檢查失敗，或 axios 401 interceptor）都會導回 `/login`。
- 登出（`Sidebar`）導回 `/login`。
