"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getHomePath, restoreSession } from "@/lib/auth";

/**
 * 疊在 (protected)/layout.tsx 之上，只多做一件事：role 必須是 admin 或 sup_admin。
 * 是否已登入交給外層處理，這裡只管「登入了，但角色不對」要導去哪。
 * 同樣固定從 false 開始（理由見 (protected)/layout.tsx 的註解：
 * 用 localStorage 當初始值會在 SSR/client 算出不同結果，造成 hydration
 * mismatch）；換頁時這個 layout 在 admin-only 子樹內不會重新 mount，
 * 驗證只在第一次進入時跑一次，不會每次切頁都閃一下。
 */
export default function AdminOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkRole() {
      const user = await restoreSession();
      if (cancelled || !user) return; // 未登入由外層 (protected) layout 導回 /login

      if (user.role !== "admin" && user.role !== "sup_admin") {
        router.replace(getHomePath(user.role));
        return;
      }
      setAllowed(true);
    }

    checkRole();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
