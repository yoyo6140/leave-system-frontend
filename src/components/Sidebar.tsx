"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import { CalendarDays, ClipboardList, Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/dashboard", icon: Home, label: "首頁" },
  { href: "/apply", icon: CalendarDays, label: "申請請假" },
  { href: "/records", icon: ClipboardList, label: "請假紀錄" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = now.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-blue-200 bg-blue-50">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2  px-4">
        <CalendarDays className="size-5 text-primary" />
        <span className="font-semibold text-primary">請假系統</span>
      </div>

      {/* 導覽連結 */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-blue-100 hover:text-foreground"
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        ))}
      </nav>

      {/* 登出 */}
        <Button
          variant="outline"
          onClick={handleLogout}
          
        >
          <LogOut className="size-4" />
          登出
        </Button>
    </aside>
  );
}
