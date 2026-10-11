"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getHomePath, restoreSession } from "@/lib/auth";

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
