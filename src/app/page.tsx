"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  return null;
}
