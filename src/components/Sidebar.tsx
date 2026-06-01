"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, logout, type UserRole } from "@/lib/auth"
import { getRecords } from "@/lib/leave"
import { Bot, CalendarDays, CalendarPlus, ClipboardCheck, ClipboardList, LayoutDashboard, LogOut, PieChart, Users } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { href: string; icon: React.ElementType; label: string; roles: UserRole[] }

const ALL_NAV: NavItem[] = [
  { href: "/dashboard",        icon: LayoutDashboard, label: "儀表板",   roles: ["admin", "employee"] },
  { href: "/leave-balance",    icon: PieChart,        label: "假別餘額", roles: ["admin", "employee"] },
  { href: "/admin/review",     icon: ClipboardCheck,  label: "審核管理", roles: ["admin"] },
  { href: "/admin/employees",  icon: Users,           label: "員工管理", roles: ["admin"] },
  { href: "/apply",            icon: CalendarPlus,    label: "申請請假", roles: ["admin", "employee"] },
  { href: "/records",          icon: ClipboardList,   label: "請假紀錄", roles: ["admin", "employee"] },
  { href: "/ai-analysis",      icon: Bot,             label: "AI 分析",  roles: ["admin"] },
]

export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const user     = getCurrentUser()
  const role     = user?.role ?? "employee"

  const [now, setNow]               = useState(new Date())
  const [pendingCount, setPending]  = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (role === "admin") {
      setPending(getRecords().filter((r) => r.status === "待審核").length)
    }
  }, [role, pathname])  // pathname 變動時重新計算（例如從 review 頁回來）

  const timeStr = now.toLocaleTimeString("zh-TW", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  })

  const navLinks = ALL_NAV.filter((link) => link.roles.includes(role))

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-blue-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <CalendarDays className="size-5 text-primary" />
        <span className="font-semibold text-primary">請假系統</span>
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
                : "text-muted-foreground hover:bg-blue-100 hover:text-foreground"
            )}
          >
            <link.icon className="size-4 shrink-0" />
            <span className="flex-1">{link.label}</span>
            {link.href === "/admin/review" && pendingCount > 0 && (
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
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-blue-100 hover:text-foreground"
          )}
        >
          <LogOut className="size-4" />
          登出
        </button>
      </div>
    </aside>
  )
}
