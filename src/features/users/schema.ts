import { z } from "zod";
import {
  emailSchema,
  idNumberOptionalSchema,
  idNumberSchema,
} from "@/lib/validation";

const genderSchema = z.enum(["男", "女"]);

// 帳號、密碼都由後端自動產生（帳號自動編號、密碼固定預設），表單不收這兩個欄位
export const userCreateSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  role: z.string().min(1),
  email: emailSchema,
  gender: genderSchema,
  id_number: idNumberSchema,
  hire_date: z.string().min(1, "請選擇任職日期"),
  birth_date: z.string().min(1, "請選擇出生年月日"),
});
export type UserCreateFormInput = z.infer<typeof userCreateSchema>;

// 編輯表單：帳號不可改（不送出）、身分證字號可留空（沿用原值時）
export const userUpdateSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  role: z.string().min(1),
  email: emailSchema,
  gender: genderSchema,
  id_number: idNumberOptionalSchema,
  hire_date: z.string(),
  birth_date: z.string(),
});
export type UserUpdateFormInput = z.infer<typeof userUpdateSchema>;
