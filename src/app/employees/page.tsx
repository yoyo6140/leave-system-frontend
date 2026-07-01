"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Edit, Trash2, UserPlus } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { SuccessDialog, AlertDialog, ConfirmDialog } from "@/components/ui/app-dialog"
import { type Gender } from "@/lib/auth"
import {
  type ApiUser,
  type UserCreateInput,
  type UserUpdateInput,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/api/useUsers"

// ── Shared Modal Shell ────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="mb-5 font-semibold">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  )
}

// ── Gender Select ─────────────────────────────────────────────────────────────

function GenderSelect({ value, onChange }: { value: Gender; onChange: (v: Gender) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Gender)}
      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
    >
      <option value="男">男</option>
      <option value="女">女</option>
    </select>
  )
}

// ── Add Dialog ────────────────────────────────────────────────────────────────

const EMPTY_FORM: UserCreateInput = {
  username: "", name: "", password: "", email: "",
  role: "employee", gender: "男",
  id_number: "", hire_date: "", birth_date: "",
}

interface AddDialogProps {
  onAdd:    (form: UserCreateInput) => void
  onCancel: () => void
  loading:  boolean
}

function AddDialog({ onAdd, onCancel, loading }: AddDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (key: keyof UserCreateInput, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  return (
    <ModalShell title="新增員工帳號" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onAdd(form) }} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>帳號 <span className="text-destructive">*</span></FieldLabel>
            <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="登入帳號" required />
          </Field>
          <Field>
            <FieldLabel>密碼 <span className="text-destructive">*</span></FieldLabel>
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="初始密碼（6～12 字元）" minLength={6} maxLength={12} required />
          </Field>
          <Field>
            <FieldLabel>姓名 <span className="text-destructive">*</span></FieldLabel>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="顯示名稱" required />
          </Field>
          <Field>
            <FieldLabel>信箱 <span className="text-destructive">*</span></FieldLabel>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" required />
          </Field>
          <Field>
            <FieldLabel>性別 <span className="text-destructive">*</span></FieldLabel>
            <GenderSelect value={form.gender as Gender} onChange={(v) => set("gender", v)} />
          </Field>
          <Field>
            <FieldLabel>身分證字號 <span className="text-destructive">*</span></FieldLabel>
            <Input value={form.id_number} onChange={(e) => set("id_number", e.target.value)} placeholder="A123456789" maxLength={10} required />
          </Field>
          <Field>
            <FieldLabel>出生年月日 <span className="text-destructive">*</span></FieldLabel>
            <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel>任職日期 <span className="text-destructive">*</span></FieldLabel>
            <Input type="date" value={form.hire_date} onChange={(e) => set("hire_date", e.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button type="button" size="sm" variant="outline" className="w-full" onClick={onCancel} disabled={loading}>取消</Button>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>{loading ? "新增中..." : "新增"}</Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  user:     ApiUser
  onSave:   (updates: UserUpdateInput) => void
  onCancel: () => void
  loading:  boolean
}

function EditDialog({ user, onSave, onCancel, loading }: EditDialogProps) {
  const [name,      setName]      = useState(user.name)
  const [email,     setEmail]     = useState(user.email)
  const [gender,    setGender]    = useState<Gender>(user.gender as Gender)
  const [idNumber,  setIdNumber]  = useState(user.id_number)
  const [birthDate, setBirthDate] = useState(user.birth_date)
  const [hireDate,  setHireDate]  = useState(user.hire_date)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      username:   user.username,
      name:       name.trim(),
      role:       user.role,
      email:      email.trim(),
      gender,
      id_number:  idNumber.toUpperCase(),
      hire_date:  hireDate,
      birth_date: birthDate,
    })
  }

  return (
    <ModalShell title="編輯員工資料" onClose={onCancel}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>帳號（不可修改）</FieldLabel>
            <Input value={user.username} disabled className="opacity-50" />
          </Field>
          <Field>
            <FieldLabel>姓名 <span className="text-destructive">*</span></FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel>信箱 <span className="text-destructive">*</span></FieldLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel>性別</FieldLabel>
            <GenderSelect value={gender} onChange={setGender} />
          </Field>
          <Field>
            <FieldLabel>身分證字號</FieldLabel>
            <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="A123456789" maxLength={10} />
          </Field>
          <Field>
            <FieldLabel>出生年月日</FieldLabel>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>任職日期</FieldLabel>
            <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button type="button" size="sm" variant="outline" className="w-full" onClick={onCancel} disabled={loading}>取消</Button>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>{loading ? "儲存中..." : "變更"}</Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [users,        setUsers]        = useState<ApiUser[]>([])
  const [loading,      setLoading]      = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editTarget,   setEditTarget]   = useState<ApiUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null)
  const [successMsg,   setSuccessMsg]   = useState("")
  const [alertMsg,     setAlertMsg]     = useState("")

  useEffect(() => { refresh() }, [])

  async function refresh() {
    setLoading(true)
    const result = await getUsers({ limit: 100 })
    if (result.ok) setUsers(result.data.data)
    else setAlertMsg(result.message)
    setLoading(false)
  }

  async function handleAdd(form: UserCreateInput) {
    if (form.password.length < 6 || form.password.length > 12) {
      setAlertMsg("密碼須為 6～12 個字元"); return
    }
    if (!/^[A-Z][12]\d{8}$/i.test(form.id_number)) {
      setAlertMsg("身分證字號格式不正確（例：A123456789）"); return
    }
    setActionLoading(true)
    const result = await createUser(form)
    setActionLoading(false)
    if (result.ok) {
      setShowAdd(false)
      setSuccessMsg(`員工「${result.data.name}」已新增`)
      await refresh()
    } else {
      setAlertMsg(result.message)
    }
  }

  async function handleEditSave(updates: UserUpdateInput) {
    if (!editTarget) return
    setActionLoading(true)
    const result = await updateUser(editTarget.id, updates)
    setActionLoading(false)
    if (result.ok) {
      setEditTarget(null)
      setSuccessMsg(`員工「${result.data.name}」資料已更新`)
      await refresh()
    } else {
      setAlertMsg(result.message)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setActionLoading(true)
    const result = await deleteUser(deleteTarget.id)
    setActionLoading(false)
    if (result.ok) {
      setDeleteTarget(null)
      setSuccessMsg(`員工「${deleteTarget.name}」帳號已刪除`)
      await refresh()
    } else {
      setAlertMsg(result.message)
    }
  }

  const employees = users.filter((u) => u.role === "employee")
  const admins    = users.filter((u) => u.role === "admin")

  return (
    <AppLayout allowedRoles={["admin"]}>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">員工管理</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">共 {employees.length} 位員工</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <UserPlus className="size-3.5" />
            新增員工
          </Button>
        </div>

        {/* 員工列表 */}
        <section className="mb-6">
          {loading ? (
            <Card padding="default" className="animate-pulse text-center text-sm text-muted-foreground">載入中…</Card>
          ) : employees.length === 0 ? (
            <Card variant="dashed" padding="default" className="text-center text-sm text-muted-foreground">
              尚無員工帳號
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">姓名</th>
                    <th className="px-4 py-3 text-left font-medium">性別</th>
                    <th className="px-4 py-3 text-left font-medium">身分證字號</th>
                    <th className="px-4 py-3 text-left font-medium">出生年月日</th>
                    <th className="px-4 py-3 text-left font-medium">任職日期</th>
                    <th className="px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((u, idx) => (
                    <tr key={u.id} className={idx !== employees.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3">{u.gender}</td>
                      <td className="px-4 py-3 tabular-nums">{u.id_number}</td>
                      <td className="px-4 py-3 tabular-nums">{u.birth_date}</td>
                      <td className="px-4 py-3 tabular-nums">{u.hire_date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => setEditTarget(u)}>
                            <Edit className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(u)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </section>

        {/* 主管列表 */}
        {admins.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">其他主管（{admins.length}）</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">姓名</th>
                    <th className="px-4 py-3 text-left font-medium">角色</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u, idx) => (
                    <tr key={u.id} className={idx !== admins.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">主管</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {showAdd    && <AddDialog  onAdd={handleAdd}  onCancel={() => setShowAdd(false)}    loading={actionLoading} />}
      {editTarget && <EditDialog user={editTarget}  onSave={handleEditSave}               loading={actionLoading} onCancel={() => setEditTarget(null)} />}

      <SuccessDialog open={!!successMsg}  title="成功" message={successMsg}  onClose={() => setSuccessMsg("")} />
      <AlertDialog   open={!!alertMsg}    title="錯誤" message={alertMsg}    onClose={() => setAlertMsg("")} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="確認刪除員工？"
        message={`將刪除「${deleteTarget?.name}」（@${deleteTarget?.username}）帳號，此操作無法復原。`}
        confirmLabel="確認刪除"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  )
}
