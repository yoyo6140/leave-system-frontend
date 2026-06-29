"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { login, getCurrentUser, getHomePath, restoreSession } from "@/lib/auth"
import { CalendarDays, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [username,    setUsername]    = useState("")
  const [password,    setPassword]    = useState("")
  const [showPwd,     setShowPwd]     = useState(false)
  const [error,       setError]       = useState("")
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkExistingSession() {
      const cached = getCurrentUser()
      if (cached) {
        router.replace(getHomePath(cached.role))
        return
      }
      const user = await restoreSession()
      if (!cancelled && user) router.replace(getHomePath(user.role))
    }

    checkExistingSession()
    return () => { cancelled = true }
  }, [router])

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (password.length < 6 || password.length > 18) {
      setError("密碼須為 6～18 個字元")
      return
    }

    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.success) {
        router.push(getHomePath(result.user.role))
      } else {
        setError(result.error)
        setLoading(false)
      }
    } catch {
      setError("無法連線至伺服器，請確認後端是否已啟動")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card padding="xl" className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CalendarDays className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">請假系統</h1>
          <p className="text-sm text-muted-foreground">請登入以繼續使用</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium">帳號</label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入帳號"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">密碼</label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼（6～18 字元）"
                minLength={6}
                maxLength={18}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登入中..." : "登入"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
