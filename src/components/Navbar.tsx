"use client";

export default function Navbar() {
  const today = new Date().toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <header className="h-14 border-b border-blue-200 bg-blue-50 px-6">
      <div className="flex h-full items-center justify-between">
        <div className="text-base font-semibold leading-tight">歡迎回來，admin</div>
        <div className="text-xs text-muted-foreground">今日是 {today}</div>
      </div>
    </header>
  );
}
