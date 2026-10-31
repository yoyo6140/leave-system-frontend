export interface PendingLeaveItem {
  id: string;
  user_id: number;
  user_name: string;
  type: string;
  hours: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface OverviewData {
  pending_count: number;
  approved_this_month: number;
  employee_count: number;
  pending_list: PendingLeaveItem[];
}

export interface MonthlyLeaveStat {
  month: number;
  count: number;
}

export interface MonthlyLeaveStatsData {
  year: number;
  months: MonthlyLeaveStat[];
}
