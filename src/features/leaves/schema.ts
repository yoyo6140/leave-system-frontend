import { z } from "zod";

// 基本表單規則：日期必選、時數必須 > 0（申請、編輯請假共用）
export const leaveFormSchema = z.object({
  type: z.string().min(1, "請選擇假別"),
  startDate: z.string().min(1, "請選擇請假日期"),
  endDate: z.string().optional(),
  hours: z.coerce.number().positive("請填寫請假時數"),
  reason: z.string().optional(),
});
export type LeaveFormInput = z.infer<typeof leaveFormSchema>;

/**
 * 額度上限會隨假別、使用者動態變化（來自 /leave-quota/me），
 * 用 factory 把「剩餘時數」當參數包進 refine，而不是寫死在 schema 裡。
 * `maxHours` 為 null 代表該假別無上限，不做上限檢查。
 */
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
