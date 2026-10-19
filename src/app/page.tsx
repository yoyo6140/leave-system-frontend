"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getHomePath, restoreSession } from "@/lib/auth";

// 根路徑「/」：嘗試還原登入狀態，依角色導向對應首頁，否則導向登入頁；本身只顯示載入中動畫
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      const user = await restoreSession();
      if (cancelled) return;
      router.replace(user ? getHomePath(user.role) : "/login");
    }

    redirect();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#f3f4f6]">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
