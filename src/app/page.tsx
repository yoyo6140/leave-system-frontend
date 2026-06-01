"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getCurrentUser, getHomePath } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      const user = getCurrentUser();
      router.replace(getHomePath(user?.role ?? "employee"));
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
