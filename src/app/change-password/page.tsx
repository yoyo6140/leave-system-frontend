"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { changePassword } from "@/features/auth/api";
import { changePasswordSchema } from "@/features/auth/schema";

// 修改密碼頁：本人輸入舊密碼驗證後設定新密碼，所有角色都可使用
export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const parsed = changePasswordSchema.safeParse({
      oldPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "輸入資料有誤");
      return;
    }

    setLoading(true);
    const result = await changePassword(
      parsed.data.oldPassword,
      parsed.data.newPassword,
    );
    setLoading(false);

    if (result.ok) {
      setSuccessMsg(result.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-xl font-semibold">修改密碼</h1>

      <Card asChild padding="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel>舊密碼</FieldLabel>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="請輸入目前的密碼"
              required
            />
          </Field>

          <Field>
            <FieldLabel>新密碼</FieldLabel>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6～12 個字元"
                minLength={6}
                maxLength={12}
                required
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
          </Field>

          <Field>
            <FieldLabel>確認新密碼</FieldLabel>
            <Input
              type={showPwd ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次輸入新密碼"
              minLength={6}
              maxLength={12}
              required
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMsg}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "修改中..." : "確認修改"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
