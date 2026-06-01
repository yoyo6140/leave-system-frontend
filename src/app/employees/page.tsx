"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Pencil, Trash2, UserPlus } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { SuccessDialog, AlertDialog, ConfirmDialog } from "@/components/ui/app-dialog"
import {
  addUser,
  deleteUser,
  updateUser,
  getCurrentUser,
  getUsers,
  type User,
  type Gender,
} from "@/lib/auth"

// ── Shared Modal Shell ────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="mb-5 text-base font-semibold">{title}</h2>
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

const EMPTY_FORM = {
  username: "", name: "", password: "",
  gender: "男" as Gender, idNumber: "", hireDate: "", birthDate: "",
}

interface AddDialogProps {
  onAdd: (form: typeof EMPTY_FORM) => void
  onCancel: () => void
}

function AddDialog({ onAdd, onCancel }: AddDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (key: keyof typeof EMPTY_FORM, val: string) =>
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
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="初始密碼" required />
          </Field>
          <Field>
            <FieldLabel>姓名 <span className="text-destructive">*</span></FieldLabel>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="顯示名稱" required />
          </Field>
          <Field>
            <FieldLabel>性別 <span className="text-destructive">*</span></FieldLabel>
            <GenderSelect value={form.gender} onChange={(v) => set("gender", v)} />
          </Field>
          <Field>
            <FieldLabel>身分證字號 <span className="text-destructive">*</span></FieldLabel>
            <Input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} placeholder="A123456789" maxLength={10} required />
          </Field>
          <Field>
            <FieldLabel>出生年月日 <span className="text-destructive">*</span></FieldLabel>
            <Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel>任職日期 <span className="text-destructive">*</span></FieldLabel>
            <Input type="date" value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} required />
          </Field>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" size="sm" variant="success">確認新增</Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>取消</Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  user: User
  onSave: (updates: Partial<User> & { password?: string }) => void
  onCancel: () => void
}

function EditDialog({ user, onSave, onCancel }: EditDialogProps) {
  const [name, setDisplayName] = useState(user.name)
  const [password,    setPassword]    = useState("")
  const [gender,      setGender]      = useState<Gender>(user.gender ?? "男")
  const [idNumber,    setIdNumber]    = useState(user.idNumber ?? "")
  const [birthDate,   setBirthDate]   = useState(user.birthDate ?? "")
  const [hireDate,    setHireDate]    = useState(user.hireDate ?? "")

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      gender,
      idNumber:  idNumber.toUpperCase() || undefined,
      birthDate: birthDate || undefined,
      hireDate:  hireDate  || undefined,
      ...(password ? { password } : {}),
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
            <FieldLabel>姓名</FieldLabel>
            <Input value={name} onChange={(e) => setDisplayName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel>新密碼（留空不變）</FieldLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="輸入新密碼" />
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
        <div className="flex gap-3 pt-1">
          <Button type="submit" size="sm" variant="success">儲存變更</Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>取消</Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const currentUser = getCurrentUser()
  const [users,        setUsers]        = useState<User[]>([])
  const [showAdd,      setShowAdd]      = useState(false)
  const [editTarget,   setEditTarget]   = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [successMsg,   setSuccessMsg]   = useState("")
  const [alertMsg,     setAlertMsg]     = useState("")

  useEffect(() => { refresh() }, [])

  function refresh() {
    setUsers(getUsers().filter((u) => u.username !== currentUser?.username))
  }

  function handleAdd(form: typeof EMPTY_FORM) {
    if (!form.username.trim() || !form.name.trim() || !form.password.trim() ||
        !form.idNumber.trim() || !form.birthDate || !form.hireDate) {
      setAlertMsg("所有欄位皆為必填"); return
    }
    if (!/^[A-Z][12]\d{8}$/i.test(form.idNumber)) {
      setAlertMsg("身分證字號格式不正確（例：A123456789）"); return
    }
    const result = addUser({
      username:    form.username.trim(),
      password:    form.password.trim(),
      name: form.name.trim(),
      role:        "employee",
      gender:      form.gender,
      idNumber:    form.idNumber.toUpperCase() || undefined,
      hireDate:    form.hireDate  || undefined,
      birthDate:   form.birthDate || undefined,
    })
    if (!result.success) { setAlertMsg(result.error ?? "新增失敗"); return }
    refresh()
    setShowAdd(false)
    setSuccessMsg(`員工「${form.name}」已成功新增`)
  }

  function handleEditSave(updates: Partial<User> & { password?: string }) {
    if (!editTarget) return
    updateUser(editTarget.username, updates)
    refresh()
    setEditTarget(null)
    setSuccessMsg("員工資料已更新")
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteUser(deleteTarget.username)
    refresh()
    setDeleteTarget(null)
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
          <Button size="sm" variant="success" onClick={() => setShowAdd(true)}>
            <UserPlus className="size-3.5" />
            新增員工
          </Button>
        </div>

        {/* 員工條列表格 */}
        <section className="mb-6">
          {employees.length === 0 ? (
            <Card variant="dashed" padding="default" className="text-center text-sm text-muted-foreground">
              尚無員工帳號
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">姓名</th>
                    <th className="px-4 py-3 text-left font-medium">帳號</th>
                    <th className="px-4 py-3 text-left font-medium">性別</th>
                    <th className="px-4 py-3 text-left font-medium">身分證字號</th>
                    <th className="px-4 py-3 text-left font-medium">出生年月日</th>
                    <th className="px-4 py-3 text-left font-medium">任職日期</th>
                    <th className="px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((u, idx) => (
                    <tr key={u.username} className={idx !== employees.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {(u.name ?? u.username)?.[0] ?? "?"}
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">@{u.username}</td>
                      <td className="px-4 py-3">{u.gender ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums">{u.idNumber ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums">{u.birthDate ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums">{u.hireDate ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => setEditTarget(u)}>
                            <Pencil className="size-3.5" />
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
          )}
        </section>

        {/* 其他主管 */}
        {admins.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">其他主管（{admins.length}）</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">姓名</th>
                    <th className="px-4 py-3 text-left font-medium">帳號</th>
                    <th className="px-4 py-3 text-left font-medium">角色</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u, idx) => (
                    <tr key={u.username} className={idx !== admins.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                            {(u.name ?? u.username)?.[0] ?? "?"}
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">@{u.username}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">主管</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {showAdd    && <AddDialog  onAdd={handleAdd}  onCancel={() => setShowAdd(false)} />}
      {editTarget && <EditDialog user={editTarget}  onSave={handleEditSave} onCancel={() => setEditTarget(null)} />}

      <SuccessDialog open={!!successMsg}  title="Success" message={successMsg}  onClose={() => setSuccessMsg("")} />
      <AlertDialog   open={!!alertMsg}    title="Alert"   message={alertMsg}    onClose={() => setAlertMsg("")} />
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
