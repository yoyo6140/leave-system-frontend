export interface QuotaItem {
  type: string;
  total_days: number | null;
  total_hours: number | null;
  used_hours: number;
  remaining_hours: number | null;
  note: string | null;
}

export interface LeaveQuotaData {
  user_id: number;
  username: string;
  name: string;
  as_of: string;
  year_start: string;
  year_end: string;
  quotas: QuotaItem[];
}
