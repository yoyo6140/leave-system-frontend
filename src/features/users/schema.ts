import { z } from "zod";
import {
  emailSchema,
  idNumberOptionalSchema,
  idNumberSchema,
  passwordSchema,
} from "@/lib/validation";

const genderSchema = z.enum(["男", "女"]);

export const userCreateSchema = z.object({
  username: z.string().min(1, "請輸入帳號"),
  password: passwordSchema,
  name: z.string().min(1, "請輸入姓名"),
  role: z.string().min(1),
  email: emailSchema,
  gender: genderSchema,
  id_number: idNumberSchema,
  hire_date: z.string().min(1, "請選擇任職日期"),
  birth_date: z.string().min(1, "請選擇出生年月日"),
});
export type UserCreateFormInput = z.infer<typeof userCreateSchema>;

// 編輯表單：帳號不可改、身分證字號可留空（沿用原值時）
export const userUpdateSchema = z.object({
  username: z.string().min(1),
  name: z.string().min(1, "請輸入姓名"),
  role: z.string().min(1),
  email: emailSchema,
  gender: genderSchema,
  id_number: idNumberOptionalSchema,
  hire_date: z.string(),
  birth_date: z.string(),
});
export type UserUpdateFormInput = z.infer<typeof userUpdateSchema>;
