"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { resetPassword } from "@/features/auth/api";
import { resetPasswordSchema } from "@/features/auth/schema";

// 重設密碼表單：從網址帶的 token 驗證並送出新密碼，成功後 3 秒自動跳轉登入頁
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("無效的重設連結，請重新申請。");
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const parsed = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "輸入資料有誤");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, parsed.data.newPassword);
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } else {
      setError(result.message);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          密碼已成功重設，3 秒後將自動跳轉至登入頁。
        </div>
        <Link href="/login">
          <Button className="w-full">立即登入</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium">
          新密碼
        </label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPwd ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="6～12 個字元"
            minLength={6}
            maxLength={12}
            required
            disabled={!token}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPwd ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          確認新密碼
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="再次輸入密碼"
          minLength={6}
          maxLength={12}
          required
          disabled={!token}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !token}>
        {loading ? "重設中..." : "確認重設密碼"}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        返回登入
      </Link>
    </form>
  );
}

// 重設密碼頁外殼：提供卡片版面，實際表單邏輯在 ResetPasswordForm（需 Suspense 包裹以讀取 URL 參數）
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card padding="xl" className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CalendarDays className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">重設密碼</h1>
          <p className="text-sm text-muted-foreground">請設定您的新密碼</p>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
