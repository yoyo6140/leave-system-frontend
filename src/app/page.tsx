"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { CalendarDays, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";

const cards = [
  {
    href: "/apply",
    icon: CalendarDays,
    title: "申請請假",
    description: "提交新的請假申請",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/records",
    icon: ClipboardList,
    title: "請假紀錄",
    description: "查看所有請假申請狀態",
    color: "bg-green-50 text-green-600",
  },
  {
    href: "/records",
    icon: Clock,
    title: "待審核",
    description: "尚有 0 筆申請待處理",
    color: "bg-amber-50 text-amber-600",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">歡迎回來，admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            今天是{" "}
            {new Date().toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`mb-4 inline-flex rounded-xl p-3 ${card.color}`}>
                <card.icon className="size-6" />
              </div>
              <h3 className="font-semibold group-hover:text-primary">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
