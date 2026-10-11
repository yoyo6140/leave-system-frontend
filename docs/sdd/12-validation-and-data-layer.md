# 12 — 驗證層與資料層架構（Zod + TanStack Query）

> 本文件不對應單一頁面，而是補充 `01-summary.md` 的架構說明，專門說明兩個貫穿全站的底層：
> 表單驗證（Zod）與遠端資料存取/快取（TanStack Query）。閱讀各頁面規格（01～10）時，若看到
> 「zod schema」「invalidate」「queryKey」等字眼，細節以本文件為準。

---

## 1. 為什麼要有這份文件

在導入 Zod 之前，密碼長度（6～12 字元）、身分證字號格式（`^[A-Z][12]\d{8}$`）、必填欄位等規則，分散手刻在 `login`、`forgot-password`、`reset-password`、`employees`（新增/編輯）、`apply`、`EditLeaveDialog` 共六處表單裡，容易改一處漏改另一處。TanStack Query 則從專案一開始就是資料層的核心，但規則（queryKey 命名、何時 invalidate）散落在各 feature 的 `keys.ts`/`hooks.ts`，沒有集中說明過。本文件把兩者的慣例收斂成一份參考。

## 2. Zod 驗證層

### 2.1 檔案配置

| 檔案 | 內容 |
| --- | --- |
| `src/lib/validation.ts` | 跨 feature 共用的原子規則：`passwordSchema`、`emailSchema`、`idNumberSchema`（必填）、`idNumberOptionalSchema`（選填）|
| `src/features/auth/schema.ts` | `loginSchema`、`forgotPasswordSchema`、`resetPasswordSchema` |
| `src/features/users/schema.ts` | `userCreateSchema`、`userUpdateSchema` |
| `src/features/leaves/schema.ts` | `leaveFormSchema`、`createLeaveFormSchema(maxHours)` |

延續既有 `features/<name>/{types,api,keys,hooks}.ts` 的拆檔慣例，驗證規則放在同一個 feature 底下的 `schema.ts`，與該 feature 的 `types.ts`（資料形狀）互補：`types.ts` 描述 API 收送的 TS 型別，`schema.ts` 描述表單送出前要通過的規則，兩者欄位應盡量同名（snake_case 對齊後端）。

### 2.2 共用原子規則（`src/lib/validation.ts`）

```ts
export const passwordSchema = z.string().min(6, "...").max(12, "...");
export const emailSchema = z.string().email("請輸入有效的電子郵件");
export const idNumberSchema = z.string().min(1, ...).transform(toUpperCase).refine(格式);
export const idNumberOptionalSchema = z.string().transform(toUpperCase).refine(空字串或符合格式);
```

- `idNumberSchema`（必填版）用在新增員工；`idNumberOptionalSchema`（選填版）用在編輯員工（EditDialog 欄位沒有標 `*`，允許留空）。兩者都會把輸入值轉大寫（`.transform`），取代過去在元件內手動 `.toUpperCase()`。
- 之所以拆成必填/選填兩個 schema，而不是用同一個再加 `.optional()`：`idNumberSchema` 的 `.refine` 檢查是「非空字串才驗證格式」，與「欄位本身可不可以不填」是兩個獨立問題，拆開比疊加 `.optional().refine()` 好讀。

### 2.3 各 feature 的 schema 與對應表單

| Schema | 使用頁面/元件 | 對應欄位 |
| --- | --- | --- |
| `loginSchema` | `src/app/login/page.tsx` | `username`、`password` |
| `forgotPasswordSchema` | `src/app/forgot-password/page.tsx` | `email` |
| `resetPasswordSchema` | `src/app/reset-password/page.tsx` | `newPassword`、`confirmPassword`（`.refine` 檢查兩者相符，`path: ["confirmPassword"]`）|
| `userCreateSchema` | `src/app/employees/page.tsx` → `handleAdd()` | `UserCreateInput` 全部欄位 |
| `userUpdateSchema` | `src/app/employees/page.tsx` → `handleEditSave()` | `UserUpdateInput` 全部欄位 |
| `leaveFormSchema` | `src/components/records/edit-leave-dialog.tsx` | 假別、日期、時數、原因（編輯「待審核」申請，無額度上限檢查）|
| `createLeaveFormSchema(maxHours)` | `src/app/apply/page.tsx` → `handleSubmit()` | 同上，另外依目前假別剩餘時數動態檢查上限 |

### 2.4 使用模式：`safeParse` + 既有的 Dialog 錯誤呈現

所有頁面統一用 `schema.safeParse(data)`，**不**用 `parse()`（避免 throw，手動處理錯誤比 try/catch 清楚），失敗時取第一個錯誤訊息顯示：

```ts
const parsed = someSchema.safeParse(formData);
if (!parsed.success) {
  setError(parsed.error.issues[0]?.message ?? "輸入資料有誤"); // 或 setAlertMsg(...)
  return;
}
// 之後都用 parsed.data（已經過 transform，例如身分證字號已轉大寫）
await mutateAsync(parsed.data);
```

- 錯誤呈現沿用各頁面原有機制，**沒有改變 UI 模式**：`login`/`forgot-password`/`reset-password`/`EditLeaveDialog` 用表單內的紅底行內錯誤（`setError`）；`employees`/`apply` 用全域 `AlertDialog`（`setAlertMsg`）。Zod 只是取代「誰來判斷輸入合不合法」，不改變「錯誤要顯示在哪裡」。
- 送出時一律用 `parsed.data` 而非原始 state，因為 schema 的 `.transform()`（例如身分證字號轉大寫）、`z.coerce.number()`（時數從字串/數字混合型別轉成真正的 `number`）已經處理過型別與正規化。

### 2.5 動態規則怎麼處理：`createLeaveFormSchema(maxHours)`

假別剩餘時數上限會隨登入者、假別即時變化（來自 `/leave-quota/me`），不能寫死在靜態 schema 裡。做法是用一個 factory function，把 `maxHours` 當參數包進 `.superRefine()`：

```ts
export function createLeaveFormSchema(maxHours: number | null) {
  return leaveFormSchema.superRefine((data, ctx) => {
    if (maxHours !== null && data.hours > maxHours) {
      ctx.addIssue({
        code: "custom",
        message: `${data.type} 剩餘時數不足（剩餘 ${maxHours} 小時，申請 ${data.hours} 小時）`,
        path: ["hours"],
      });
    }
  });
}
```

`maxHours === null` 代表該假別無上限（例如公假、其他），直接跳過檢查。呼叫端在送出當下才建立 schema 實例：`createLeaveFormSchema(remaining[type]).safeParse(formValues)`，確保用的是當前下拉選單選到的那個假別的剩餘額度。

> 這仍然只是**前端提醒**；最終是否真的超額，以後端回應為準（後端也可能回 `QUOTA_EXCEEDED` 類錯誤）。`EditLeaveDialog`（編輯既有申請）刻意用不含上限檢查的 `leaveFormSchema`，因為編輯時沒有重新查詢當下額度，上限交給後端判斷。

### 2.6 刻意不做的事

- 沒有導入 `react-hook-form` 或 `@hookform/resolvers/zod`：現有表單都是手動 `useState` 管理欄位，元件數量不多、欄位也不複雜，直接在 `onSubmit` 裡 `safeParse` 已經足夠，不需要多一層表單狀態庫的學習成本。
- 沒有用 zod 驗證「伺服器回應」（API response），只驗證「使用者輸入」。後端回應的型別仍由 `features/*/types.ts` 的 TS `interface` 描述，信任後端回應格式正確。

## 3. TanStack Query 資料層

### 3.1 Provider 設定（`src/components/providers.tsx`）

```ts
const [queryClient] = useState(() => new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
}));
```

- 用 `useState(() => new QueryClient())` 而非 module 頂層 `new QueryClient()`，避免 Next.js 伺服器端渲染時所有使用者共用同一份快取。
- 全域 `staleTime: 30_000`（30 秒）：大多數清單資料（員工、請假紀錄）30 秒內視為新鮮，不重複打 API；沒有個別頁面覆寫更長的 `staleTime`。
- `refetchOnWindowFocus: false`：切回分頁不會自動重抓，避免管理者在審核時被意外的重新整理打斷正在看的資料。
- 掛載點：`src/app/layout.tsx` 用 `<Providers>{children}</Providers>` 包住整個 App Router 樹。

### 3.2 queryKey 命名慣例（`features/<name>/keys.ts`）

```ts
export const leaveKeys = {
  all: ["leaves"] as const,
  lists: () => [...leaveKeys.all, "list"] as const,
  list: (params: LeavesQueryParams) => [...leaveKeys.lists(), params] as const,
};
```

所有 feature 遵循同一套階層：`all` → `lists()` → `list(params)`（目前沒有 feature 需要 `detail(id)`，因為沒有「單筆查詢」頁面，請假/員工都是列表+彈窗呈現明細）。

| Feature | Keys |
| --- | --- |
| `leaves` | `leaveKeys.all` / `.lists()` / `.list(params)` |
| `users` | `userKeys.all` / `.lists()` / `.list(params)` |
| `quota` | `quotaKeys.all` / `.me(asOf?)` |
| `overview` | `overviewKeys.all`（單一端點，無參數變化）|

查詢參數（`params`）直接整包放進 queryKey 陣列最後一格，TanStack Query 用深比對決定要不要重抓；換頁、換搜尋字、切換「顯示已停用帳號」都會因為 `params` 物件不同而視為不同 cache entry。

### 3.3 查詢 Hook 模式

```ts
export function useLeavesQuery(params: LeavesQueryParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leaveKeys.list(params),
    queryFn: () => leaveApi.getList(params),
    enabled: options?.enabled,
  });
}
```

- 統一用 `enabled` 選項讓呼叫端決定要不要發查詢（例如 `Sidebar` 只在 `role === admin` 時才查 `useLeavesQuery`，員工不需要待審核數徽章）。
- 沒有使用 `placeholderData: keepPreviousData`；換頁/換搜尋時會短暫出現 `isLoading`，由頁面自行用骨架卡或 `animate-pulse` 卡片遮罩，而非保留舊資料。

### 3.4 Mutation 與快取失效（invalidate）模式

請假相關的三個 mutation（`useCreateLeave`、`useUpdateLeave`、`useUpdateLeaveStatus`、`useDeleteLeave`）共用同一個失效邏輯：

```ts
function useInvalidateLeaveRelated() {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
    queryClient.invalidateQueries({ queryKey: quotaKeys.all }),
    queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
  ]);
}
```

**規則：任何會改變請假資料狀態的動作（新增/編輯/審核/取消），一律同時失效三個 feature 的快取**——因為請假紀錄變動必然影響假別餘額（`quota`）與管理者總覽統計（`overview`），即使呼叫端目前沒有停留在那些頁面上，下次進入時也會拿到新資料，不需要頁面自己手動 refetch。

`users` feature 的三個 mutation（`useCreateUser`、`useUpdateUser`、`useUpdateUserStatus`）共用同一個失效函式：

```ts
// 員工姓名／人數都會出現在 /overview（排行榜姓名、員工人數），
// 三個 mutation 一律連同 overviewKeys 一起失效，避免總覽顯示舊資料
function useInvalidateUsersAndOverview() {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: userKeys.all }),
    queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
  ]);
}
```

三者都一併失效 `overviewKeys.all`，理由不只是 `employee_count`（新增帳號／切換啟停用會改變 `is_active`，進而改變啟用中人數），**編輯姓名（`useUpdateUser`）也需要**：`/overview` 的「員工年請假總時數」排行榜（`top_leave_hours`）裡的姓名是後端 `/overview` 這支 API 直接回傳的，不是前端拿 `users` 查詢結果去對照出來的，如果改名的人剛好在排行榜上，沒有失效 `overview` 的話畫面會停留在改名前的舊名字，直到 30 秒 staleTime 過期才自然更新。因此三個 mutation 統一用同一個失效範圍，不特別區分「這次改的欄位會不會影響 overview」——判斷成本比直接一起失效還高，而且 `/overview` 本身查詢成本低，一起失效沒有明顯代價。

### 3.5 登入/登出與快取生命週期

- 登出（`Sidebar.handleLogout`）會呼叫 `queryClient.clear()`，清空所有快取——同一台裝置換人登入時，不會讓下一位使用者在資料真正重抓回來前，短暫看到前一位使用者的殘留畫面。
- 登入流程本身不主動清快取（通常是從乾淨的 `/login` 頁面開始，不會有殘留資料的風險）。

### 3.6 測試慣例（`src/test/test-utils.tsx`）

```ts
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}
```

- 測試環境關閉 `retry`，避免失敗測試因為重試機制拖長執行時間或難以斷言呼叫次數。
- `gcTime: Infinity`：測試內不需要背景垃圾回收快取，避免非同步計時器讓測試不穩定。
- Hook 測試（如 `features/leaves/hooks.test.tsx`、`features/quota/hooks.test.tsx`）一律 mock `@/lib/api-client` 的 `apiFetch`，直接斷言呼叫的 URL/body 與回傳資料，不打真實網路。

## 4. 與既有規格文件的關係

- `01-summary.md` §5、§7 的「架構慣例」「API 慣例」為本文件的上層總覽；本文件是那兩節的延伸細節。
- 01（登入）、03（員工管理）、07（申請請假）、08（個別請假紀錄）的「驗證規則」小節，實作上都已改為呼叫本文件 §2 列出的對應 schema；若規則需要調整（例如密碼長度政策改變），只需改 `src/lib/validation.ts` 一處。
- 02（總覽）、05（審核管理）文件中提到的「核准/拒絕後 `/overview` 數字會更新」，依據即是本文件 §3.4 的 invalidate 規則。
