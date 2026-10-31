"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Search,
  UserPlus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  SuccessDialog,
  AlertDialog,
  ConfirmDialog,
} from "@/components/ui/app-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentUser, type Gender } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { maskIdNumber } from "@/lib/validation";
import {
  type ApiUser,
  type UserCreateInput,
  type UserUpdateInput,
  useUsersQuery,
  useCreateUser,
  useUpdateUser,
  useUpdateUserStatus,
} from "@/features/users/hooks";
import { userCreateSchema, userUpdateSchema } from "@/features/users/schema";

const PAGE_SIZE = 12;

/** 左右切換開關；點擊不會立刻改狀態，由外層彈確認後再送 API */
// 啟用/停用帳號的切換開關；點擊只是「請求切換」，實際變更要等外層的確認對話框按下確認才送出
function StatusToggle({
  checked,
  disabled,
  onRequestToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  onRequestToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "帳號啟用中" : "帳號已停用"}
      disabled={disabled}
      onClick={onRequestToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:opacity-90",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ── Shared Modal Shell ────────────────────────────────────────────────────────

// 新增/編輯員工彈出視窗共用的外層容器（標題 + 內容）
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="mb-5 font-semibold">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ── Gender Select ─────────────────────────────────────────────────────────────

// 性別選擇下拉選單（男/女）
function GenderSelect({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (v: Gender) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Gender)}
      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
    >
      <option value="男">男</option>
      <option value="女">女</option>
    </select>
  );
}

// ── Role Select ───────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  sup_admin: "總管理員",
  admin: "主管",
  employee: "員工",
};

// 角色選擇下拉選單；只有 sup_admin 能指派 admin／sup_admin，所以只在 sup_admin 的表單裡出現
function RoleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="employee">員工</SelectItem>
        <SelectItem value="admin">主管</SelectItem>
        <SelectItem value="sup_admin">總管理員</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ── Add Dialog ────────────────────────────────────────────────────────────────

const EMPTY_FORM: UserCreateInput = {
  name: "",
  email: "",
  role: "employee",
  gender: "男",
  id_number: "",
  hire_date: "",
  birth_date: "",
};

interface AddDialogProps {
  onAdd: (form: UserCreateInput) => void;
  onCancel: () => void;
  loading: boolean;
  /** 只有 sup_admin 能指派角色；admin 建立的一律是 employee */
  canAssignRole: boolean;
}

// 新增員工帳號的表單彈窗（帳號、密碼由後端自動產生，不在這裡輸入）
function AddDialog({ onAdd, onCancel, loading, canAssignRole }: AddDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (key: keyof UserCreateInput, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <ModalShell title="新增員工帳號" onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(form);
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {canAssignRole && (
            <Field>
              <FieldLabel>
                角色 <span className="text-destructive">*</span>
              </FieldLabel>
              <RoleSelect
                value={form.role}
                onChange={(v) => set("role", v)}
              />
            </Field>
          )}
          <Field>
            <FieldLabel>
              姓名 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="顯示名稱"
              required
            />
          </Field>
          <Field>
            <FieldLabel>
              信箱 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@example.com"
              required
            />
          </Field>
          <Field>
            <FieldLabel>
              性別 <span className="text-destructive">*</span>
            </FieldLabel>
            <GenderSelect
              value={form.gender as Gender}
              onChange={(v) => set("gender", v)}
            />
          </Field>
          <Field>
            <FieldLabel>
              身分證字號 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={form.id_number}
              onChange={(e) => set("id_number", e.target.value)}
              placeholder="A123456789"
              maxLength={10}
              required
            />
          </Field>
          <Field>
            <FieldLabel>
              出生年月日 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="date"
              value={form.birth_date}
              onChange={(e) => set("birth_date", e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>
              任職日期 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="date"
              value={form.hire_date}
              onChange={(e) => set("hire_date", e.target.value)}
              required
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>
            {loading ? "新增中..." : "新增"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  user: ApiUser;
  onSave: (updates: UserUpdateInput) => void;
  onCancel: () => void;
  loading: boolean;
  /** 角色、受雇日期僅 sup_admin 可改，admin 編輯時這兩欄要鎖住、照原值送出 */
  canEditRoleAndHireDate: boolean;
}

// 編輯員工資料的表單彈窗（帳號不可修改）
function EditDialog({
  user,
  onSave,
  onCancel,
  loading,
  canEditRoleAndHireDate,
}: EditDialogProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [gender, setGender] = useState<Gender>(user.gender as Gender);
  const [idNumber, setIdNumber] = useState(user.id_number);
  const [birthDate, setBirthDate] = useState(user.birth_date);
  const [hireDate, setHireDate] = useState(user.hire_date);
  const [role, setRole] = useState(user.role);

  // 組裝編輯後的欄位並呼叫父層的儲存回呼
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim(),
      role: canEditRoleAndHireDate ? role : user.role,
      email: email.trim(),
      gender,
      id_number: idNumber.toUpperCase(),
      hire_date: canEditRoleAndHireDate ? hireDate : user.hire_date,
      birth_date: birthDate,
    });
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
            <FieldLabel>
              姓名 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>
              信箱 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>性別</FieldLabel>
            <GenderSelect value={gender} onChange={setGender} />
          </Field>
          <Field>
            <FieldLabel>身分證字號</FieldLabel>
            <Input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="A123456789"
              maxLength={10}
            />
          </Field>
          <Field>
            <FieldLabel>出生年月日</FieldLabel>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>
              任職日期
              {!canEditRoleAndHireDate && "（僅 sup_admin 可修改）"}
            </FieldLabel>
            <Input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              disabled={!canEditRoleAndHireDate}
              className={!canEditRoleAndHireDate ? "opacity-50" : undefined}
            />
          </Field>
          {canEditRoleAndHireDate && (
            <Field>
              <FieldLabel>角色</FieldLabel>
              <RoleSelect value={role} onChange={setRole} />
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>
            {loading ? "儲存中..." : "變更"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// 員工管理頁：列表（員工/主管分開顯示）＋新增、編輯、啟用停用帳號
export default function EmployeesPage() {
  const currentUser = getCurrentUser();
  const isSupAdmin = currentUser?.role === "sup_admin";
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<ApiUser | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  // 搜尋框即時輸入 / 實際拿去打 API 的關鍵字（debounce 1 秒再送，跟其他搜尋頁一致）
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading: loading, isError, error } = useUsersQuery({
    page,
    limit: PAGE_SIZE,
    search,
    include_inactive: includeInactive,
  });
  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const createUserMut = useCreateUser();
  const updateUserMut = useUpdateUser();
  const updateStatusMut = useUpdateUserStatus();

  useEffect(() => {
    if (isError) {
      setAlertMsg(error instanceof Error ? error.message : "查詢員工列表失敗");
    }
  }, [isError, error]);

  // 停用後若當頁沒資料，退回上一頁
  useEffect(() => {
    if (!loading && page > pageCount) setPage(pageCount);
  }, [loading, page, pageCount]);

  // 驗證表單後新增員工帳號
  async function handleAdd(form: UserCreateInput) {
    const parsed = userCreateSchema.safeParse(form);
    if (!parsed.success) {
      setAlertMsg(parsed.error.issues[0]?.message ?? "輸入資料有誤");
      return;
    }
    setActionLoading(true);
    try {
      const created = await createUserMut.mutateAsync(parsed.data);
      setShowAdd(false);
      // 帳號是後端自動產生的，操作者要知道這組編號才能告知新同事
      setSuccessMsg(`員工「${created.name}」已新增，帳號：${created.username}`);
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : "新增員工失敗");
    } finally {
      setActionLoading(false);
    }
  }

  // 驗證表單後儲存編輯中的員工資料
  async function handleEditSave(updates: UserUpdateInput) {
    if (!editTarget) return;
    const parsed = userUpdateSchema.safeParse(updates);
    if (!parsed.success) {
      setAlertMsg(parsed.error.issues[0]?.message ?? "輸入資料有誤");
      return;
    }
    setActionLoading(true);
    try {
      const updated = await updateUserMut.mutateAsync({
        id: editTarget.id,
        input: parsed.data,
      });
      setEditTarget(null);
      setSuccessMsg(`員工「${updated.name}」資料已更新`);
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : "更新員工失敗");
    } finally {
      setActionLoading(false);
    }
  }

  // 使用者在確認對話框按下確認後，才真正切換帳號啟用/停用狀態
  async function handleStatusConfirm() {
    if (!statusTarget) return;
    const nextActive = statusTarget.is_active === false;
    setActionLoading(true);
    try {
      const updated = await updateStatusMut.mutateAsync({
        id: statusTarget.id,
        isActive: nextActive,
      });
      setStatusTarget(null);
      setSuccessMsg(
        nextActive
          ? `員工「${updated.name}」已恢復啟用`
          : `員工「${updated.name}」已停用`,
      );
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : "更新帳號狀態失敗");
    } finally {
      setActionLoading(false);
    }
  }

  const employees = users.filter((u) => u.role === "employee");
  // 主管（admin）看不到 sup_admin 帳號，只有 sup_admin 能看到全部管理層帳號
  const admins = users.filter((u) =>
    isSupAdmin
      ? u.role === "admin" || u.role === "sup_admin"
      : u.role === "admin",
  );
  const isSelf = (u: ApiUser): boolean =>
    currentUser?.id != null && u.id === currentUser.id;
  return (
    <>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">員工管理</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              共 {total} 筆帳號
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <UserPlus className="size-3.5" />
            新增員工
          </Button>
        </div>

        {/* 搜尋（打後端 API，不是前端過濾；搜尋框固定掛著，載入中也不會失去焦點） */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="搜尋姓名、帳號或身分證字號..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-8 text-sm bg-white"
              />
            </div>
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
              >
                清除
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                setPage(1);
              }}
              className="size-4 rounded border-input accent-primary"
            />
            顯示已停用帳號
          </label>
        </div>

        {/* 員工列表 */}
        <section className="mb-6">
          {loading ? (
            <Card
              padding="default"
              className="animate-pulse text-center text-sm text-muted-foreground"
            >
              載入中…
            </Card>
          ) : employees.length === 0 ? (
            <Card
              variant="dashed"
              padding="default"
              className="text-center text-sm text-muted-foreground"
            >
              {searchInput ? "查無符合搜尋條件的員工" : "尚無員工帳號"}
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">姓名</th>
                      <th className="px-4 py-3 text-left font-medium">性別</th>
                      <th className="px-4 py-3 text-left font-medium">
                        身分證字號
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        出生年月日
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        任職日期
                      </th>
                      <th className="px-4 py-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((u, idx) => (
                      <tr
                        key={u.id}
                        className={
                          idx !== employees.length - 1
                            ? "border-b border-border"
                            : ""
                        }
                      >
                        <td className="px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-2">
                            {u.name}
                            {u.is_active === false && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                已停用
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">{u.gender}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {maskIdNumber(u.id_number)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {u.birth_date}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {u.hire_date}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {u.is_active !== false && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => setEditTarget(u)}
                                title="編輯"
                              >
                                <Edit className="size-5" />
                              </Button>
                            )}
                            <StatusToggle
                              checked={u.is_active !== false}
                              disabled={isSelf(u)}
                              onRequestToggle={() => {
                                if (isSelf(u)) return;
                                setStatusTarget(u);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && total > 0 && (
            <div className="mt-4 flex items-center justify-end text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  第 {page} 頁，共 {pageCount} 頁（{total} 筆）
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                  >
                    <ChevronsLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPage(pageCount)}
                    disabled={page >= pageCount}
                  >
                    <ChevronsRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 主管列表 */}
        {admins.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
管理層帳號（{admins.length}）
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">姓名</th>
                      <th className="px-4 py-3 text-left font-medium">角色</th>
                      <th className="px-4 py-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((u, idx) => (
                      <tr
                        key={u.id}
                        className={
                          idx !== admins.length - 1
                            ? "border-b border-border"
                            : ""
                        }
                      >
                        <td className="px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-2">
                            {u.name}
                            {u.is_active === false && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                已停用
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                            {ROLE_LABEL[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* 管理其他管理員帳號僅限 sup_admin */}
                            {isSupAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => setEditTarget(u)}
                                title="編輯"
                              >
                                <Edit className="size-5" />
                              </Button>
                            )}
                            {/* 啟用/停用僅限 sup_admin 操作，且任何人都不能改自己的狀態，所以自己的帳號不顯示開關 */}
                            {isSupAdmin && !isSelf(u) && (
                              <StatusToggle
                                checked={u.is_active !== false}
                                onRequestToggle={() => setStatusTarget(u)}
                              />
                            )}
                          </div>
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

      {showAdd && (
        <AddDialog
          onAdd={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={actionLoading}
          canAssignRole={isSupAdmin}
        />
      )}
      {editTarget && (
        <EditDialog
          user={editTarget}
          onSave={handleEditSave}
          loading={actionLoading}
          onCancel={() => setEditTarget(null)}
          canEditRoleAndHireDate={isSupAdmin}
        />
      )}

      <SuccessDialog
        open={!!successMsg}
        title="成功"
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
      <AlertDialog
        open={!!alertMsg}
        title="錯誤"
        message={alertMsg}
        onClose={() => setAlertMsg("")}
      />
      <ConfirmDialog
        open={!!statusTarget}
        title={
          statusTarget?.is_active === false ? "確認啟用員工？" : "確認停用員工？"
        }
        message={
          statusTarget?.is_active === false
            ? `啟用後「${statusTarget?.name}」將可再次使用原本的帳號密碼登入。`
            : `停用後「${statusTarget?.name}」將無法登入，請假紀錄會保留，之後可以重新啟用。`
        }
        confirmLabel={statusTarget?.is_active === false ? "確認啟用" : "確認停用"}
        variant={statusTarget?.is_active === false ? "default" : "destructive"}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusTarget(null)}
      />
    </>
  );
}
