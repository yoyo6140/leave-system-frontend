import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CalendarDays className="size-8" />
      </div>

      <div className="text-center">
        <h1 className="text-7xl font-bold tabular-nums text-foreground">404</h1>
        <p className="mt-2 text-lg font-medium text-foreground">找不到此頁面</p>
        <p className="mt-1 text-sm text-muted-foreground">
          您所尋找的頁面不存在或已被移除
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        回到儀表板
      </Link>
    </div>
  );
}
