import { z } from "zod"

export const leaveRecordSchema = z.object({
  id: z.string(),
  username: z.string().default(""),
  type: z.enum(["特休", "病假", "事假", "婚假", "喪假", "公假", "其他"]),
  startDate: z.string(),
  endDate: z.string(),
  hours: z.number(),
  reason: z.string(),
  status: z.enum(["待審核", "已通過", "已拒絕"]),
  createdAt: z.string(),
})

export type LeaveRecordRow = z.infer<typeof leaveRecordSchema>
