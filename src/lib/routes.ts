// 不需要登入即可訪問的頁面；AppShell 對這些路徑完全不做登入檢查、也不包 Sidebar/Navbar。
// 這幾頁自己都有各自的「已登入就導去首頁」邏輯（見各自的 page.tsx），這裡不重複判斷。
export const PUBLIC_PATHS = ["/", "/login", "/forgot-password", "/reset-password"];

// 僅 admin、sup_admin 可以進入的頁面。拿掉 (admin-only) route group 之後，
// 這份清單是唯一記錄「哪些頁面是管理層專用」的地方——新增管理層頁面時記得加進來，
// 不然這裡不會自動擋人（原本資料夾結構會自然保護，現在要靠手動維護這份清單）。
export const ADMIN_ONLY_PATHS = [
  "/overview",
  "/employees",
  "/employee-records",
  "/review",
  "/ai-analysis",
  "/knowledge-base",
];

// 判斷 pathname 是否屬於某個清單（支援巢狀路徑，例如 /employees/123 也算 /employees 底下）
export function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
