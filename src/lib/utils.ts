import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 合併 Tailwind class 名稱，並自動處理衝突的樣式（後面的覆蓋前面的）
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
