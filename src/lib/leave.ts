// 假別一律用英文代碼跟後端溝通（type 欄位），中文只用於畫面顯示
export type LeaveType =
  | "annual"
  | "sick"
  | "personal"
  | "marriage"
  | "bereavement"
  | "official"
  | "other";

export type LeaveStatus =
  | "待審核"
  | "已通過"
  | "已拒絕"
  | "已取消"
  | "已銷假";

// 英文代碼 -> 中文顯示名稱
export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  annual: "特休",
  sick: "病假",
  personal: "事假",
  marriage: "婚假",
  bereavement: "喪假",
  official: "公假",
  other: "其他",
};

export const LEAVE_BADGE_ROUNDED = "rounded-[8px]";

export const LEAVE_STATUS_STYLE: Record<LeaveStatus, string> = {
  待審核: "bg-amber-50 text-amber-600",
  已通過: "bg-blue-50 text-blue-600",
  已拒絕: "bg-red-50 text-red-600",
  已取消: "bg-gray-100 text-gray-500",
  已銷假: "bg-gray-100 text-gray-500",
};

export const LEAVE_QUOTAS: Record<
  LeaveType,
  { bgColor: string; textColor: string; barColor: string }
> = {
  annual: {
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    barColor: "#3b82f6",
  },
  sick: {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    barColor: "#ef4444",
  },
  personal: {
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    barColor: "#f59e0b",
  },
  marriage: {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    barColor: "#ef4444",
  },
  bereavement: {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    barColor: "#ef4444",
  },
  official: {
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    barColor: "#f59e0b",
  },
  other: {
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    barColor: "#f59e0b",
  },
};

export const LEAVE_TYPES = Object.keys(LEAVE_QUOTAS) as LeaveType[];

// 將請假時數換算成約略天數（以 8 小時為一天），四捨五入到小數點後一位
export function hoursToApproxDays(hours: number): number {
  return Math.round((hours / 8) * 10) / 10;
}
