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

export interface TopLeaveHoursItem {
  user_id: number;
  name: string;
  hours: number;
}

export interface OverviewData {
  pending_count: number;
  approved_this_month: number;
  employee_count: number;
  pending_list: PendingLeaveItem[];
  top_leave_hours: TopLeaveHoursItem[];
}
