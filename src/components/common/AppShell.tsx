"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getHomePath, restoreSession, type User } from "@/lib/auth";
import { ADMIN_ONLY_PATHS, PUBLIC_PATHS, matchesPath } from "@/lib/routes";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * 整個 App 唯一的登入/角色守門元件，放在 root layout 底下，取代原本
 * (protected)/(admin-only) 兩層巢狀 route group layout（拿掉這兩層括號
 * 資料夾，讓 src/app/ 底下每個路由都是扁平的 app/<name>/page.tsx）。
 *
 * 這個元件掛在 root layout，不管切到哪個路由都不會重新 mount，所以：
 * - 登入驗證（打 /auth/me）只在「從公開頁進到受保護頁」那一刻跑一次，
 *   之後在受保護頁之間互相切換不會重複打 API（`checked` 一旦 true 就不再呼叫 restoreSession）。
 * - 角色是否符合 admin-only 的檢查，每次切頁都會重新比對，但只是同步比對
 *   已經拿到的 `user.role`，不是重新打 API。
 * - 離開受保護區（回到公開頁，例如登出後導回 /login）時會重置 `checked`/`user`，
 *   確保下次再進入受保護頁時重新驗證一次（模擬原本「跨 route group 會重新 mount」的效果）。
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  const isPublic = matchesPath(pathname, PUBLIC_PATHS);
  const needsAdmin = matchesPath(pathname, ADMIN_ONLY_PATHS);
  const roleOk = !needsAdmin || (!!user && (user.role === "admin" || user.role === "sup_admin"));
  const allowed = checked && roleOk;

  // 進入公開頁時重置驗證狀態，離開時才會重新觸發下面的驗證 effect
  useEffect(() => {
    if (isPublic) {
      setChecked(false);
      setUser(null);
    }
  }, [isPublic]);

  // 只在「目前還沒驗證過、且不是公開頁」時打一次 /auth/me
  useEffect(() => {
    if (isPublic || checked) return;

    let cancelled = false;
    restoreSession().then((u) => {
      if (cancelled) return;
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isPublic, checked, router]);

  // 角色不符 admin-only 頁面要求時導走；純同步比對，不打 API
  useEffect(() => {
    if (!checked || !user) return;
    if (needsAdmin && user.role !== "admin" && user.role !== "sup_admin") {
      router.replace(getHomePath(user.role));
    }
  }, [needsAdmin, checked, user, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!allowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f4f6]">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f4f6]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
