@AGENTS.md
# POST /auth/login
登入成功後以 httpOnly cookie 寫入 JWT，後續請求自動帶上 cookie 進行認證
input
{
  "username": "string",
  "password": "string"
}

res
200
{
  "success": true
}
401
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}

# POST  /auth/logout
清除 httpOnly cookie，使 token 失效
input 
token
res
200
{
  "success": true
}

# /auth/me
傳入token 取得使用者資料
res
200
{
  "id": 0,
  "username": "string",
  "name": "string",
  "role": "string",
  "email": "string",
  "gender": "string",
  "id_number": "string",
  "hire_date": "string",
  "birth_date": "string"
}
id是個別id
username是 帳號名稱
name 是名字
role 是角色 分admin管理者跟employee員工 員工只能看自己的資料
email 是必填 會用來重置密碼用 且會驗證唯一值
gender是性別 目前沒有針對性別新增生理假 生理假用其他假別申請
id_number是身份證字號
hire_date是被雇用日期 格式為xxxx-xx-xx 另外會換算成小時 請假以小時為單位 請一天是八小時
birth_date是出生日期

# /auth/forgot-password
申請密碼重設
輸入信箱會送出重設連結
連結30分鐘內有效
{
  "email": "user@example.com"
}
res 
200
{
  "success": true,
  "data": {
    "message": "若此信箱已註冊，您將收到密碼重設信件"
  }
}

# /auth/reset-password
使用信箱收到的 token 設定新密碼
{
  "token": "string",
  "new_password": "string"
}
res 
200
{
  "success": true,
  "data": {
    "message": "密碼已成功重設，請重新登入"
  }
}

### user群組
# /users
傳入token
res
200
{
  "success": true,
  "data": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "data": [
      {
        "id": 1,
        "username": "john_doe",
        "name": "John Doe",
        "role": "employee",
        "email": "john@example.com",
        "gender": "male",
        "id_number": "A123456789",
        "hire_date": "2020-01-01",
        "birth_date": "1990-05-15"
      }
    ]
  }
}
支援分頁與搜尋

# /user
新增 員工 傳入
{
  "username": "string",
  "password": "string",
  "name": "string",
  "role": "employee",
  "email": "string",
  "gender": "string",
  "id_number": "string",
  "hire_date": "string",
  "birth_date": "string"
}
# /user/{id}
查詢 修改 刪除員工 傳入 id