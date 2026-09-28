# 後端 API 變更說明：員工帳號啟用／停用

## 背景

員工帳號不會被真正刪除。改以啟用／停用控制能否登入，請假紀錄一律保留。

---

## 1. 員工資料新增 `is_active` 欄位

以下 API 回傳的員工資料都多了 `is_active`（布林值）：

- `GET /users`
- `GET /user/{id}`
- `POST /user`
- `PUT /user/{id}`
- `PATCH /user/{id}/status`
- `GET /auth/me`

```json
{
  "id": 2,
  "username": "F12345",
  "name": "王小明",
  "role": "employee",
  "email": "emp@example.com",
  "gender": "男",
  "id_number": "A123456789",
  "hire_date": "2024-01-01",
  "birth_date": "1990-05-15",
  "is_active": true
}
```

---

## 2. `GET /users` 新增查詢參數 `include_inactive`

| 參數 | 型別 | 預設 | 說明 |
|---|---|---|---|
| `include_inactive` | boolean | `false` | 是否包含已停用的帳號 |

- 不帶參數時，只回傳啟用中的帳號。
- 要顯示停用的帳號：`GET /users?include_inactive=true`

---

## 3. 啟用／停用 API

**`DELETE /user/{id}` 已移除。**

```text
PATCH /user/{id}/status
```

**Request body：**

```json
{ "is_active": false }
```

| 值 | 說明 |
|---|---|
| `false` | 停用：員工無法登入，已登入的 token 立即失效，請假紀錄保留 |
| `true` | 恢復啟用：員工可以用原本的帳號密碼登入 |

**成功回應（200）：** 回傳更新後的員工資料。

**錯誤回應：**

| HTTP | code | 說明 |
|---|---|---|
| 400 | `CANNOT_DEACTIVATE_SELF` | admin 不可停用自己的帳號 |
| 403 | `FORBIDDEN` | 非 admin 呼叫 |
| 404 | `USER_NOT_FOUND` | 找不到員工 |

---

## 4. `POST /auth/login` 新增 403 錯誤

帳號密碼正確但帳號已停用時：

```json
HTTP 403
{
  "success": false,
  "error": { "code": "ACCOUNT_DISABLED", "message": "帳號已停用" }
}
```

---

## 5. 已登入的員工被停用後，需登入的 API 回 401

token 立即失效，前端既有 401 導回登入頁即可。

---

## 6. `GET /overview` 的 `employee_count`

只計算啟用中的員工。

---

## 注意事項

- 帳號、信箱、身分證字號仍被停用帳號佔用；新增重複值會回 409。
