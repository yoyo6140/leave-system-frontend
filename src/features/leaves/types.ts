export interface ApiLeaveRecord {
  id: string;
  user_id: number;
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string;
  status: string;
  reviewer: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string | null;
  /** 由呼叫端從使用者列表填入，方便顯示 */
  _username?: string;
}

export interface LeaveListData {
  total: number;
  page: number;
  limit: number;
  data: ApiLeaveRecord[];
}

export interface LeaveCreateInput {
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason?: string;
}

export interface LeaveUpdateInput {
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason?: string;
}

export interface LeaveStatusUpdateInput {
  status: string;
  review_note?: string | null;
}

export type LeavesQueryParams = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  mine?: boolean;
};

export interface LeaveStatusLog {
  id: string;
  from_status: string | null;
  to_status: string;
  action: string | null;
  note: string | null;
  changes: Record<string, [unknown, unknown]> | null;
  changed_by: number;
  changed_at: string;
}
