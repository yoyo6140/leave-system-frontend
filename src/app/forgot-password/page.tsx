"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { forgotPassword } from "@/features/auth/api";
import { forgotPasswordSchema } from "@/features/auth/schema";

// 忘記密碼頁：輸入信箱送出重設連結請求，成功後顯示提示訊息（不洩漏信箱是否存在）
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "請輸入有效的電子郵件");
      return;
    }

    setLoading(true);
    const result = await forgotPassword(parsed.data.email);
    setLoading(false);
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card padding="xl" className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CalendarDays className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">忘記密碼</h1>
          <p className="text-center text-sm text-muted-foreground">
            輸入您的帳號信箱，我們將寄送重設連結
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              若此信箱已註冊，您將收到密碼重設信件，請確認信箱（含垃圾郵件）。
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                返回登入
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                信箱
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "送出中..." : "送出重設連結"}
            </Button>

            <Link
              href="/login"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              返回登入
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}
