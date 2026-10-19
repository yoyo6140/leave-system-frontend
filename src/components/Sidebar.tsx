"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Logout } from "@/features/auth/api";
import { useLeavesQuery } from "@/features/leaves/hooks";
import { getCurrentUser, clearCurrentUser, type UserRole } from "@/lib/auth";
import {
  Bot,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  ClipboardList,
  Files,
  LayoutDashboard,
  LogOut,
  PieChart,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
};

const ALL_NAV: NavItem[] = [
  { href: "/overview", icon: LayoutDashboard, label: "總覽", roles: ["admin"] },
  { href: "/employees", icon: Users, label: "員工管理", roles: ["admin"] },
  {
    href: "/employee-records",
    icon: Files,
    label: "員工請假紀錄",
    roles: ["admin"],
  },
  {
    href: "/review",
    icon: ClipboardCheck,
    label: "審核管理",
    roles: ["admin"],
  },
  {
    href: "/leave-balance",
    icon: PieChart,
    label: "假別餘額",
    roles: ["admin", "employee"],
  },
  {
    href: "/apply",
    icon: CalendarPlus,
    label: "申請請假",
    roles: ["admin", "employee"],
  },
  {
    href: "/records",
    icon: ClipboardList,
    label: "個別請假紀錄",
    roles: ["admin", "employee"],
  },
  { href: "/ai-analysis", icon: Bot, label: "AI 分析", roles: ["admin"] },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

// 左側導覽選單：依角色顯示可用頁面連結、待審核假單數量角標，並提供登出功能（手機版為可收合抽屜）
export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const role = user?.role ?? "employee";
  const isAdmin = role === "admin";

  const { data: leavesData } = useLeavesQuery(
    { limit: 200 },
    { enabled: isAdmin },
  );
  const pendingCount =
    leavesData?.data.filter((r) => r.status === "待審核").length ?? 0;

  // 手機導航後自動關閉抽屜
  useEffect(() => {
    onClose?.();
  }, [pathname]);

  const navLinks = ALL_NAV.filter((link) => link.roles.includes(role));

  // 登出：通知後端、清除本機登入資料與快取，導回登入頁
  async function handleLogout() {
    await Logout();
    clearCurrentUser();
    queryClient.clear();
    router.push("/login");
  }

  // 共用的導覽內容
  const navContent = (showClose: boolean) => (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <CalendarDays className="size-5 text-primary" />
        <span className="font-semibold text-primary">請假系統</span>
        {showClose && (
          <button
            className="ml-auto rounded p-1 text-muted-foreground hover:bg-blue-100 cursor-pointer"
            onClick={onClose}
            aria-label="關閉選單"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* 導覽連結 */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-blue-100 hover:text-foreground",
            )}
          >
            <link.icon className="size-4 shrink-0" />
            <span className="flex-1">{link.label}</span>
            {link.href === "/review" && pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* 登出 */}
      <div className="border-t border-blue-200 px-3 py-3">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
            "text-muted-foreground hover:bg-blue-100 hover:text-foreground",
          )}
        >
          <LogOut className="size-4" />
          登出
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 桌面版：左側靜態 sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-blue-200 bg-white lg:flex">
        {navContent(false)}
      </aside>

      {/* 手機/平板：右側抽屜 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-56 flex-col border-l border-blue-200 bg-white transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {navContent(true)}
      </aside>
    </>
  );
}
