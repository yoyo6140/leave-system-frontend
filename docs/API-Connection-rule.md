# Next.js Feature 架構：api / keys / hooks / types 寫法

Oct 5, 2026 · @yoyo

## 概覽

每個業務功能放在 `features/<名稱>/`，裡面用四個檔案分工：`types` 定義資料長相，`api` 負責去拿，`keys` 決定放在快取哪裡，`hooks` 把三者組起來給元件用。

| 檔案 | 回答的問題 | 比喻 |
| --- | --- | --- |
| `types.ts` | 資料長什麼樣子？ | 表格的欄位定義 |
| `api.ts` | 怎麼跟後端要資料？ | 打電話給後端的號碼簿 |
| `keys.ts` | 拿回來的資料存在快取哪裡？ | 倉庫貨架的編號 |
| `hooks.ts` | 元件要怎麼用？ | 把上面三個組裝好的成品 |

以「登入、員工名單、請假明細」三支 API 為例，資料夾結構如下。欄位名稱沿用後端的 snake\_case，因為欄位是對著 FastAPI `/docs` 確認的，前後端同名最不容易對錯。

```text
src/
├── app/
│   ├── layout.tsx                  ← 最外層，掛 QueryProvider
│   ├── (auth)/                     ← 括號 = 不會出現在網址
│   │   └── login/page.tsx          → /login
│   └── (dashboard)/
│       ├── layout.tsx              ← 側邊欄、Header
│       ├── employees/page.tsx      → /employees
│       └── leaves/
│           ├── page.tsx            → /leaves
│           └── [id]/page.tsx       → /leaves/123
│
├── features/
│   ├── auth/                       ← 登入（沒有 keys.ts）
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── types.ts
│   │   └── components/LoginForm.tsx
│   ├── employees/                  ← 員工名單
│   │   ├── api.ts
│   │   ├── keys.ts
│   │   ├── hooks.ts
│   │   ├── types.ts
│   │   └── components/EmployeeTable.tsx
│   └── leaves/                     ← 請假明細
│       ├── api.ts
│       ├── keys.ts
│       ├── hooks.ts
│       ├── types.ts
│       └── components/
│           ├── LeaveTable.tsx
│           └── LeaveDetail.tsx
│
├── components/                     ← 全站共用 UI
├── lib/
│   ├── request.ts                  ← 統一帶 token 的 fetch
│   └── utils.ts                    ← toQuery 等工具
├── types/
│   └── api.ts                      ← Paginated<T> 等共用型別
├── providers/
│   └── QueryProvider.tsx
└── middleware.ts                   ← 未登入導向 /login（Next.js 16 起為 proxy.ts）
```

資料流向：

```text
LeaveTable 元件
   ↓ 呼叫
useLeaveList          (hooks.ts)
   ├─ queryKey ← leaveKeys.list()   (keys.ts)  存哪
   └─ queryFn  ← leaveApi.getList() (api.ts)   怎麼拿
                    ↓
                 request()           (lib/request.ts)
                    ↓
                 FastAPI 後端
回傳資料的形狀 ← Leave               (types.ts)
```

## 共用檔案

三個 feature 都依賴這三個檔案：`request` 統一發請求並帶 token，`toQuery` 組查詢字串，`Paginated<T>` 定義分頁格式。

### lib/request.ts

```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const TOKEN_KEY = 'access_token';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser ? localStorage.getItem(TOKEN_KEY) : null;

  const headers = new Headers(options.headers);
  if (typeof options.body === 'string') headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && isBrowser) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}
```

- 只有 body 是字串（JSON）時才設 `Content-Type: application/json`；body 是 `URLSearchParams` 時讓瀏覽器自動帶 form 格式。
- 收到 401 代表 token 失效，清掉並導回登入頁。

### lib/utils.ts

```ts
// { page: 1, status: undefined } → "?page=1"（自動略過沒填的條件）
export function toQuery(params: object): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}
```

### types/api.ts

```ts
// 分頁回傳格式，不屬於任何一個 feature，所以放全域 types/
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
```

## features/auth：登入

登入是 POST 動作（mutation），結果是 token 而不是要快取的資料，所以沒有 `keys.ts`。之後多了 `GET /me` 再加 `authKeys`。

### types.ts

```ts
export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}
```

### api.ts

```ts
import { request } from '@/lib/request';
import type { LoginInput, LoginResponse } from './types';

export const authApi = {
  // FastAPI OAuth2PasswordRequestForm 收 form 格式，不是 JSON
  login: (data: LoginInput) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: new URLSearchParams({
        username: data.username,
        password: data.password,
      }),
    }),
};
```

欄位逐一寫出、不直接傳 `new URLSearchParams(data)`，是因為 TypeScript 的 `interface` 不能直接當 `Record<string, string>` 傳入，會報型別錯誤。

### hooks.ts

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/request';
import { authApi } from './api';

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      queryClient.clear();          // 清掉上一個登入者的快取
      router.push('/leaves');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem(TOKEN_KEY);
    queryClient.clear();
    router.push('/login');
  };
}
```

`queryClient.clear()` 在請假系統特別重要：同一台電腦 A 登出、B 登入，不清快取的話 B 可能短暫看到 A 的請假資料。

## features/employees：員工名單

只有列表 API，所以 `keys.ts` 只做到 `list`，沒有 `detail`；員工名單不常變，用較長的 `staleTime` 減少重抓。

### types.ts

```ts
export interface Employee {
  id: number;
  employee_no: string;
  name: string;
  department: string;
  is_active: boolean;
}

export interface EmployeeListParams {
  department?: string;
  keyword?: string;
}
```

### api.ts

```ts
import { request } from '@/lib/request';
import { toQuery } from '@/lib/utils';
import type { Employee, EmployeeListParams } from './types';

export const employeeApi = {
  getList: (params: EmployeeListParams = {}) =>
    request<Employee[]>(`/employees${toQuery(params)}`),
};
```

### keys.ts

```ts
import type { EmployeeListParams } from './types';

export const employeeKeys = {
  all:   ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list:  (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
};
```

### hooks.ts

```ts
import { useQuery } from '@tanstack/react-query';
import { employeeApi } from './api';
import { employeeKeys } from './keys';
import type { EmployeeListParams } from './types';

export function useEmployeeList(params: EmployeeListParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeeApi.getList(params),
    staleTime: 5 * 60 * 1000,   // 5 分鐘內不重抓
  });
}
```

## features/leaves：請假明細

請假有列表（分頁）和單筆明細兩支 API，所以 `keys.ts` 同時有 `list` 和 `detail` 兩條路徑。

### types.ts

```ts
export type LeaveType = 'annual' | 'sick' | 'personal';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface Leave {
  id: number;
  employee_id: number;
  employee_name: string;       // 後端直接帶，前端不用自己對照員工名單
  leave_type: LeaveType;
  start_date: string;          // 'YYYY-MM-DD'，JSON 裡日期是字串
  end_date: string;
  hours: number;
  reason: string;
  status: LeaveStatus;
}

export interface LeaveListParams {
  page: number;
  page_size: number;
  employee_id?: number;
  status?: LeaveStatus;
}
```

### api.ts

```ts
import { request } from '@/lib/request';
import { toQuery } from '@/lib/utils';
import type { Paginated } from '@/types/api';
import type { Leave, LeaveListParams } from './types';

export const leaveApi = {
  getList: (params: LeaveListParams) =>
    request<Paginated<Leave>>(`/leaves${toQuery(params)}`),

  getById: (id: number) =>
    request<Leave>(`/leaves/${id}`),
};
```

### keys.ts

```ts
import type { LeaveListParams } from './types';

export const leaveKeys = {
  all:     ['leaves'] as const,
  lists:   () => [...leaveKeys.all, 'list'] as const,
  list:    (params: LeaveListParams) => [...leaveKeys.lists(), params] as const,
  details: () => [...leaveKeys.all, 'detail'] as const,
  detail:  (id: number) => [...leaveKeys.details(), id] as const,
};
```

展開後的實際值：

```text
leaveKeys.all                        → ['leaves']
leaveKeys.lists()                    → ['leaves', 'list']
leaveKeys.list({page:1,page_size:20}) → ['leaves', 'list', { page: 1, page_size: 20 }]
leaveKeys.detail(5)                  → ['leaves', 'detail', 5]
```

TanStack Query 清快取是前綴比對：invalidate `['leaves', 'list']` 會清掉所有頁數與篩選條件的列表，但不動 `['leaves', 'detail', 5]`。

### hooks.ts

```ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { leaveApi } from './api';
import { leaveKeys } from './keys';
import type { LeaveListParams } from './types';

export function useLeaveList(params: LeaveListParams) {
  return useQuery({
    queryKey: leaveKeys.list(params),
    queryFn: () => leaveApi.getList(params),
    placeholderData: keepPreviousData,   // 換頁時先留著舊資料，表格不會閃空
  });
}

export function useLeave(id: number) {
  return useQuery({
    queryKey: leaveKeys.detail(id),
    queryFn: () => leaveApi.getById(id),
    enabled: Number.isFinite(id),        // 網址的 id 不是數字就不發請求
  });
}
```

## 對照與語法拆解

三個 feature 的檔案內容依 API 性質不同而增減，不是每個都要湊滿四個檔案。

| Feature | types.ts | api.ts | keys.ts | hooks.ts |
| --- | --- | --- | --- | --- |
| auth | 登入輸入、token 回傳 | `login`（form 格式） | 不需要 | `useMutation` |
| employees | 員工、篩選條件 | `getList` | 只有 list | `useQuery` + 長 `staleTime` |
| leaves | 請假、假別、狀態、分頁條件 | `getList`、`getById` | list + detail | `useQuery` ×2 |

### 程式碼元素分類

| 片段 | 類別 | 怎麼辨認 |
| --- | --- | --- |
| `import` / `export` / `const` / `function` / `return` | 保留字 | 語言本身，無法跳轉 |
| `interface` / `type` / `import type` | TypeScript 保留字 | 只存在編譯期，編譯成 JS 後消失 |
| `as const` | TypeScript 語法 | 讓陣列變成唯讀固定值，key 型別才精確 |
| `'pending' \| 'paid'` | 字面值聯集型別 | 只能是其中一個字串，打錯會報錯 |
| `?:`（如 `status?:`） | 可選屬性 | 可以不傳，值為 `undefined` |
| `Paginated<T>` / `request<T>` | 專案自訂泛型 | `<T>` 是佔位，呼叫時填入；跳轉停在 `src/` |
| `Promise<T>` / `RequestInit` | TS 內建型別 | 跳轉進 `lib.es5.d.ts` / `lib.dom.d.ts` |
| `...` | 展開運算子 | 把前一層 key 攤開接上 |
| `Headers` / `URLSearchParams` / `fetch` / `localStorage` | 瀏覽器內建 API | 不用 import，跳轉進 `lib.dom.d.ts` |
| `Object.entries` / `JSON.stringify` / `Number.isFinite` | JS 內建函式 | 跳轉進 TS 的 lib 型別檔 |
| `process.env.NEXT_PUBLIC_API_URL` | 環境變數 + Next.js 命名規則 | 要 `NEXT_PUBLIC_` 前綴瀏覽器才讀得到；值寫在 `.env.local` |
| `typeof window !== 'undefined'` | JS 慣用寫法 | 判斷在瀏覽器還是伺服器（SSR 時沒有 `window`） |
| `useQuery` / `useMutation` / `useQueryClient` | 套件提供的 Hook | 從 `@tanstack/react-query` import，跳轉進 `node_modules` |
| `keepPreviousData` | 套件提供的函式 | TanStack Query v5 寫法（v4 是 `keepPreviousData: true`） |
| `queryKey` / `queryFn` / `mutationFn` / `onSuccess` / `staleTime` / `placeholderData` / `enabled` | 套件規定的選項名稱 | 名字不能改，hover 看得到說明 |
| `invalidateQueries` / `clear` | 套件提供的方法 | `queryClient` 物件上的方法 |
| `useRouter` / `router.push` | Next.js 提供 | 從 `next/navigation` import（不是 Pages Router 的 `next/router`） |
| `request` / `toQuery` / `TOKEN_KEY` | 專案自訂 | 跳轉停在 `src/lib/` |
| `Leave` / `leaveApi` / `leaveKeys` / `useLeaveList` 等 | 專案自訂 | 跳轉停在 `features/` 底下 |

## 實務注意事項

- **欄位以 `/docs` 為準**：本文的 `Leave`、`Employee` 欄位是示意，實際接 API 時以 FastAPI `/docs` 顯示的 Schema 為準。
- **登入格式**：FastAPI 若用 `OAuth2PasswordRequestForm`，收的是 `application/x-www-form-urlencoded`，欄位叫 `username`、`password`。在 `/docs` 看登入 API 的 Request body 類型確認，是 form 就用 `URLSearchParams`，不能 `JSON.stringify`。
- **token 存放**：本文用 `localStorage` 是為了好理解。它容易被 XSS 讀取，而且 `middleware.ts` 跑在伺服器端讀不到它；正式環境建議由後端以 httpOnly cookie 回傳 token。
- **feature 單向依賴**：`leaves` 可以 import `employees` 的 hook（例如請假表單的員工下拉選單），但 `employees` 不要反過來 import `leaves`。兩邊都要用的型別移到 `src/types/`。
- **QueryProvider**：不要在 module 頂層 `new QueryClient()`，伺服器端會讓所有使用者共用同一份快取；改用 `useState(() => new QueryClient())`。
- **動態路由**：Next.js 15 起，`app/leaves/[id]/page.tsx` 的 `params` 是 Promise，要 `await params` 才拿得到 `id`。
- **hooks 檔不用加 `'use client'`**：指令加在使用這些 hook 的元件檔案第一行即可。
