"use client";

import { Menu } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const user = getCurrentUser();

  const today = new Date().toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <header className="h-14 border-b border-blue-200 bg-white px-4 lg:px-6">
      <div className="flex h-full items-center justify-between">
        <div className="truncate font-semibold leading-tight">
          歡迎回來，{user?.name ?? ""}
          <span className="hidden sm:inline"> {user?.username ?? ""}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-xs text-muted-foreground sm:block">
            {today}
          </div>
          {/* 漢堡按鈕（平板以下） */}
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-blue-100 hover:text-foreground lg:hidden cursor-pointer"
            onClick={onMenuToggle}
            aria-label="開啟選單"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
