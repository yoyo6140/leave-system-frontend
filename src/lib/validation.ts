import { z } from "zod";

// 密碼規則統一 6～12 字元（重設密碼、修改密碼共用；新增員工帳號改由後端自動產生，不走這條）
export const passwordSchema = z
  .string()
  .min(6, "密碼須為 6～12 個字元")
  .max(12, "密碼須為 6～12 個字元");

export const emailSchema = z.string().email("請輸入有效的電子郵件");

// 身分證字號只檢查長度為 10，不檢查格式（不限台灣身分證格式）、不檢查重複（後端會擋重複）
const ID_NUMBER_LENGTH = 10;

// 必填版本：新增員工時使用
export const idNumberSchema = z
  .string()
  .transform((v) => v.toUpperCase())
  .refine((v) => v.length === ID_NUMBER_LENGTH, {
    message: `身分證字號須為 ${ID_NUMBER_LENGTH} 個字元`,
  });

// 選填版本：編輯員工時使用（允許留空，但有填就要符合長度）
export const idNumberOptionalSchema = z
  .string()
  .transform((v) => v.toUpperCase())
  .refine((v) => v === "" || v.length === ID_NUMBER_LENGTH, {
    message: `身分證字號須為 ${ID_NUMBER_LENGTH} 個字元`,
  });

// 畫面顯示用：遮罩中間字元（例：A123456789 -> A12****789）
export function maskIdNumber(idNumber: string): string {
  if (idNumber.length !== ID_NUMBER_LENGTH) return idNumber;
  return `${idNumber.slice(0, 3)}****${idNumber.slice(-3)}`;
}
