export type LeaveType =
  "特休" | "病假" | "事假" | "婚假" | "喪假" | "公假" | "其他";
export type LeaveStatus = "待審核" | "已通過" | "已拒絕" | "已取消";

export type LeaveRecord = {
  id: string;
  username: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  hours: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
};

export const LEAVE_BADGE_ROUNDED = "rounded-[8px]";

export const LEAVE_STATUS_STYLE: Record<LeaveStatus, string> = {
  待審核: "bg-amber-50 text-amber-600",
  已通過: "bg-blue-50 text-blue-600",
  已拒絕: "bg-red-50 text-red-600",
  已取消: "bg-gray-100 text-gray-500",
};

export const LEAVE_QUOTAS: Record<
  LeaveType,
  { bgColor: string; textColor: string; barColor: string }
> = {
  特休: {
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    barColor: "#3b82f6",
  },
  病假: {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    barColor: "#ef4444",
  },
  事假: {
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    barColor: "#f59e0b",
  },
  婚假: {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    barColor: "#ef4444",
  },
  喪假: {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    barColor: "#ef4444",
  },
  公假: {
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    barColor: "#f59e0b",
  },
  其他: {
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    barColor: "#f59e0b",
  },
};

export const LEAVE_TYPES = Object.keys(LEAVE_QUOTAS) as LeaveType[];

const STORAGE_KEY = "leave_records";
const PENDING_SEED_ID = "seed-pending-001";

const DEFAULT_RECORDS: LeaveRecord[] = [
  {
    id: PENDING_SEED_ID,
    username: "employee",
    type: "特休",
    startDate: "2026-06-10",
    endDate: "2026-06-11",
    hours: 16,
    reason: "家庭旅遊",
    status: "待審核",
    createdAt: "2026-06-01T09:30:00.000Z",
  },
];

// 從 localStorage 讀取全部請假紀錄；若是初次使用則寫入預設種子資料
function loadAllRecords(): LeaveRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECORDS));
    return DEFAULT_RECORDS;
  }

  const all = (JSON.parse(raw) as Partial<LeaveRecord>[]).map((r) => ({
    ...r,
    username: r.username ?? "admin",
  })) as LeaveRecord[];

  if (!all.some((r) => r.id === PENDING_SEED_ID)) {
    const withSeed = [...all, ...DEFAULT_RECORDS];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withSeed));
    return withSeed;
  }

  return all;
}

// 取得請假紀錄，傳入 username 可只篩選該使用者的紀錄
export function getRecords(username?: string): LeaveRecord[] {
  if (typeof window === "undefined") return [];
  const all = loadAllRecords();
  return username ? all.filter((r) => r.username === username) : all;
}

// 新增一筆請假紀錄並寫回 localStorage，狀態固定從「待審核」開始
export function addRecord(
  data: Omit<LeaveRecord, "id" | "createdAt" | "status">,
): LeaveRecord {
  const all = getRecords();
  const record: LeaveRecord = {
    ...data,
    id: crypto.randomUUID(),
    status: "待審核",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, record]));
  return record;
}

// 計算某假別已使用的總時數（排除已拒絕的紀錄），用於額度計算
export function getUsedHours(type: LeaveType, username?: string): number {
  return getRecords(username)
    .filter((r) => r.type === type && r.status !== "已拒絕")
    .reduce((sum, r) => sum + r.hours, 0);
}

// 將請假時數換算成約略天數（以 8 小時為一天），四捨五入到小數點後一位
export function hoursToApproxDays(hours: number): number {
  return Math.round((hours / 8) * 10) / 10;
}
