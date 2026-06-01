"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, UserRole } from "@/lib/auth"
import Sidebar from "@/components/Sidebar"
import Navbar from "@/components/Navbar"

interface AppLayoutProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function AppLayout({ children, allowedRoles }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.replace("/login")
      return
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard")
      return
    }
    setReady(true)
  }, [router, pathname, allowedRoles])

  if (!ready) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f4f6]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
