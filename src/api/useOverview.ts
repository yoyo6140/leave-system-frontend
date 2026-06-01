// 儀表板 API

// --團隊總覽--
export interface OverviewResponse {
  pendingCount: number
  approvedMonthCount: number
  employeeCount: number
  pendingLeaveList: {
    id: string
    name: string
    type: string
    hours: number
  }[]
  employeeYearLeaveHoursList: {
    id: string
    name: string
    hours: number
  }[]
}

export const mockOverviewResponse: OverviewResponse = {
  pendingCount: 6,
  approvedMonthCount: 14,
  employeeCount: 48,
  pendingLeaveList: [
    {
      id: "LV-202605-001",
      name: "王小明",
      type: "事假",
      hours: 8,
    },
    {
      id: "LV-202605-004",
      name: "李佳穎",
      type: "病假",
      hours: 4,
    },
    {
      id: "LV-202605-007",
      name: "張志豪",
      type: "特休",
      hours: 16,
    },
  ],
  employeeYearLeaveHoursList: [
    {
      id: "EMP-0032",
      name: "陳怡君",
      hours: 72,
    },
    {
      id: "EMP-0015",
      name: "林冠廷",
      hours: 64,
    },
    {
      id: "EMP-0041",
      name: "吳佩珊",
      hours: 58,
    },
  ],
}