# API 規格建議

> 目前系統使用 localStorage 模擬資料，以下為串接後端時建議的 API 設計。
> 串接位置標注於各節末尾。

---

## 統一回應格式

所有 API 回應皆包含 `success` 欄位，用以判斷呼叫是否成功。

**成功**

```json
{
  "success": true,
  "data": { ... }
}
```

**失敗**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤說明"
  }
}
```

---

## 使用者欄位說明

| 欄位        | 型別                      | 說明                       |
| ----------- | ------------------------- | -------------------------- |
| `username`  | `string`                  | 登入帳號（唯一）           |
| `name`      | `string`                  | 當事人姓名                 |
| `role`      | `"admin"` \| `"employee"` | 角色                       |
| `gender`    | `"男"` \| `"女"`          | 性別                       |
| `idNumber`  | `string`                  | 身分證字號                 |
| `birthDate` | `string`                  | 出生年月日（`YYYY-MM-DD`） |
| `hireDate`  | `string`                  | 任職日期（`YYYY-MM-DD`）   |

---

## 認證 Auth

### POST `/api/auth/login`

登入取得 token。

**Request Body**

```json
{
  "username": "admin",
  "password": "111111"
}
```

**Response — 成功**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "username": "admin",
      "name": "主管",
      "role": "admin"
    }
  }
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "帳號或密碼錯誤"
  }
}
```

**串接位置** `src/lib/auth.ts` → `login()`、`src/app/login/page.tsx` → `handleSubmit()`

---

### POST `/api/auth/logout`

登出。

**Response**

```json
{
  "success": true,
  "data": null
}
```

**串接位置** `src/lib/auth.ts` → `logout()`、`src/components/Sidebar.tsx` → `handleLogout()`

---

### GET `/api/auth/me`

取得當前登入使用者資訊。

**Response — 成功**

```json
{
  "success": true,
  "data": {
    "username": "admin",
    "name": "主管",
    "role": "admin"
  }
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "請先登入"
  }
}
```

**串接位置** `src/lib/auth.ts` → `getCurrentUser()`、`src/components/AppLayout.tsx`

---

## 員工管理 Users

### GET `/api/users`

取得所有帳號列表（admin only）。

**Query Params**

| 參數   | 說明                  |
| ------ | --------------------- |
| `role` | `admin` \| `employee` |

**Response — 成功**

```json
{
  "success": true,
  "data": [
    {
      "username": "employee01",
      "name": "王小明",
      "role": "employee",
      "gender": "男",
      "idNumber": "A123456789",
      "birthDate": "1990-05-10",
      "hireDate": "2020-03-01"
    }
  ]
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "權限不足" }
}
```

**串接位置** `src/lib/auth.ts` → `getUsers()`、`src/app/admin/employees/page.tsx`、`src/app/dashboard/page.tsx`

---

### POST `/api/users`

新增帳號（admin only）。

**Request Body**

```json
{
  "username": "employee01",
  "password": "111111",
  "name": "王小明",
  "role": "employee",
  "gender": "男",
  "idNumber": "A123456789",
  "birthDate": "1990-05-10",
  "hireDate": "2020-03-01"
}
```

**Response — 成功**

```json
{
  "success": true,
  "data": { "username": "employee01", "name": "王小明" }
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "USER_ALREADY_EXISTS", "message": "帳號已存在" }
}
```

**串接位置** `src/lib/auth.ts` → `addUser()`、`src/app/admin/employees/page.tsx` → `handleAdd()`

---

### PATCH `/api/users/:username`

更新帳號資料（admin only）。

**Request Body**（僅需帶入要更新的欄位）

```json
{
  "name": "王大明",
  "password": "newpass",
  "gender": "男",
  "idNumber": "A123456789",
  "birthDate": "1990-05-10",
  "hireDate": "2021-06-01"
}
```

**Response — 成功**

```json
{
  "success": true,
  "data": { "username": "employee01", "name": "王大明" }
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "USER_NOT_FOUND", "message": "查無此使用者" }
}
```

**串接位置** `src/lib/auth.ts` → `updateUser()`、`src/app/admin/employees/page.tsx` → `handleEditSave()`

---

### DELETE `/api/users/:username`

刪除帳號（admin only）。

**Response — 成功**

```json
{
  "success": true,
  "data": null
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "USER_NOT_FOUND", "message": "查無此使用者" }
}
```

**串接位置** `src/lib/auth.ts` → `deleteUser()`、`src/app/admin/employees/page.tsx` → `handleDeleteConfirm()`

---

## 請假申請 Leave Records

### GET `/api/leaves`

取得請假紀錄。

**Query Params**

| 參數       | 說明                                |
| ---------- | ----------------------------------- |
| `username` | employee 只能查自己，admin 可查全部 |
| `status`   | `待審核` \| `已通過` \| `已拒絕`    |
| `type`     | 假別，例如 `特休`                   |
| `year`     | 年份，例如 `2026`                   |

**Response — 成功**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "employee01",
      "type": "特休",
      "startDate": "2026-05-01",
      "endDate": "2026-05-03",
      "hours": 24,
      "reason": "家庭旅遊",
      "status": "待審核",
      "createdAt": "2026-04-28T08:00:00Z"
    }
  ]
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "請先登入" }
}
```

**串接位置** `src/lib/leave.ts` → `getRecords()`、`src/app/records/page.tsx`、`src/app/admin/review/page.tsx`、`src/app/dashboard/page.tsx`

---

### POST `/api/leaves`

送出請假申請。

**Request Body**

```json
{
  "type": "特休",
  "startDate": "2026-05-01",
  "endDate": "2026-05-03",
  "hours": 24,
  "reason": "家庭旅遊"
}
```

**Response — 成功**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "待審核",
    "createdAt": "2026-04-28T08:00:00Z"
  }
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "QUOTA_EXCEEDED", "message": "特休剩餘時數不足" }
}
```

**串接位置** `src/lib/leave.ts` → `addRecord()`、`src/app/apply/page.tsx` → `handleSubmit()`

---

### PATCH `/api/leaves/:id/status`

更新審核狀態（admin only）。

**Request Body**

```json
{ "status": "已通過" }
```

**Response — 成功**

```json
{
  "success": true,
  "data": { "id": "uuid", "status": "已通過" }
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "LEAVE_NOT_FOUND", "message": "查無此申請紀錄" }
}
```

**串接位置** `src/app/admin/review/page.tsx` → `updateStatus()`、`handleApprove()`、`handleRejectConfirm()`

---

### DELETE `/api/leaves/:id`

取消申請（僅限 `待審核` 狀態）。

**Response — 成功**

```json
{
  "success": true,
  "data": null
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "INVALID_STATUS", "message": "僅可取消待審核的申請" }
}
```

**串接位置** `src/app/records/page.tsx` → `handleDelete()`、`src/app/records/components/data-table-row-actions.tsx`

---

## 假別額度 Leave Quotas

### GET `/api/quotas`

取得假別額度設定。

**Response — 成功**

```json
{
  "success": true,
  "data": [
    {
      "type": "特休",
      "totalHours": 112,
      "bgColor": "bg-blue-50",
      "textColor": "text-blue-600",
      "barColor": "#3b82f6"
    }
  ]
}
```

**串接位置** `src/lib/leave.ts` → `LEAVE_QUOTAS`

---

### GET `/api/quotas/usage`

取得使用者各假別已使用時數。

**Query Params**

| 參數       | 說明                |
| ---------- | ------------------- |
| `username` | employee 只能查自己 |
| `year`     | 年份                |

**Response — 成功**

```json
{
  "success": true,
  "data": [{ "type": "特休", "used": 40, "total": 112, "remaining": 72 }]
}
```

**Response — 失敗**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "無權查詢其他使用者的額度" }
}
```

**串接位置** `src/lib/leave.ts` → `getUsedHours()`、`src/app/dashboard/page.tsx`、`src/app/apply/page.tsx`

---

## HTTP 狀態碼

| 狀態碼 | `success` | 說明               |
| ------ | --------- | ------------------ |
| `200`  | `true`    | 成功               |
| `201`  | `true`    | 新增成功           |
| `400`  | `false`   | 請求參數錯誤       |
| `401`  | `false`   | 未登入             |
| `403`  | `false`   | 權限不足           |
| `404`  | `false`   | 資源不存在         |
| `409`  | `false`   | 衝突（帳號已存在） |

---

## Error Code 一覽

| Code                  | 說明             |
| --------------------- | ---------------- |
| `INVALID_CREDENTIALS` | 帳號或密碼錯誤   |
| `UNAUTHORIZED`        | 未登入           |
| `FORBIDDEN`           | 權限不足         |
| `USER_NOT_FOUND`      | 查無使用者       |
| `USER_ALREADY_EXISTS` | 帳號已存在       |
| `LEAVE_NOT_FOUND`     | 查無請假紀錄     |
| `QUOTA_EXCEEDED`      | 假別時數超額     |
| `INVALID_STATUS`      | 狀態不允許此操作 |

---

## Token 規範

使用 **JWT Bearer Token**，所有 API（除 `/api/auth/login`）需帶入：

```
Authorization: Bearer <token>
```

前端統一在 `src/lib/api.ts`（待建立）封裝請求，自動帶入 token 並統一處理 `success: false` 的錯誤回應。
