import { z } from "zod";

// 密碼規則統一 6～12 字元（登入、重設密碼、新增員工共用）
export const passwordSchema = z
  .string()
  .min(6, "密碼須為 6～12 個字元")
  .max(12, "密碼須為 6～12 個字元");

export const emailSchema = z.string().email("請輸入有效的電子郵件");

const ID_NUMBER_PATTERN = /^[A-Z][12]\d{8}$/;

// 必填版本：新增員工時使用
export const idNumberSchema = z
  .string()
  .min(1, "請輸入身分證字號")
  .transform((v) => v.toUpperCase())
  .refine((v) => ID_NUMBER_PATTERN.test(v), {
    message: "身分證字號格式不正確（例：A123456789）",
  });

// 選填版本：編輯員工時使用（允許留空，但有填就要符合格式）
export const idNumberOptionalSchema = z
  .string()
  .transform((v) => v.toUpperCase())
  .refine((v) => v === "" || ID_NUMBER_PATTERN.test(v), {
    message: "身分證字號格式不正確（例：A123456789）",
  });
