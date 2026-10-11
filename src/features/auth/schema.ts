import { z } from "zod";
import { emailSchema, passwordSchema } from "@/lib/validation";

export const loginSchema = z.object({
  username: z.string().min(1, "請輸入帳號"),
  password: passwordSchema,
});
export type LoginFormInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordFormInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "兩次輸入的密碼不相符",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormInput = z.infer<typeof resetPasswordSchema>;
