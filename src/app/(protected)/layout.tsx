"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { restoreSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

/**
 * 所有登入後頁面的共用外殼。放在 Next.js layout（而非每頁各自包一層）
 * 是為了讓 Sidebar/Navbar 在同一受保護區塊內的頁面間切換時維持掛載，
 * 不會每次換頁都重新驗證、重新渲染導致側邊欄閃一下消失——換頁時這個
 * layout 不會重新 mount，下面的驗證只在第一次進入受保護區塊時跑一次。
 *
 * ready 固定從 false 開始（SSR 跟 client 都讀不到 localStorage 前的
 * 一致初始值，避免 hydration mismatch），交給 useEffect 驗證後才翻成
 * true；不要用 getCurrentUser() 當初始值，那是只有 client 讀得到的
 * localStorage，SSR 階段一定是 null，兩邊算出不同結果就會 hydration 錯誤。
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const user = await restoreSession();
      if (cancelled) return;

      if (!user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
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
