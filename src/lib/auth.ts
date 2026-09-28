import { apiGetMe, Login } from "@/hooks/queries/use-auth";

export type UserRole = "admin" | "employee";
export type Gender = "男" | "女";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  name: string;
  gender?: Gender;
  idNumber?: string;
  hireDate?: string;
  birthDate?: string;
}

const AUTH_KEY = "leave_system_auth";
const TOKEN_KEY = "leave_system_token";

function mapApiUser(user: {
  id: number;
  username: string;
  name: string;
  role: string;
  gender?: string;
  id_number?: string;
  idNumber?: string;
  hire_date?: string;
  hireDate?: string;
  birth_date?: string;
  birthDate?: string;
}): User {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role?.toLowerCase() === "admin" ? "admin" : "employee",
    gender: user.gender as Gender | undefined,
    idNumber: user.id_number ?? user.idNumber,
    hireDate: user.hire_date ?? user.hireDate,
    birthDate: user.birth_date ?? user.birthDate,
  };
}

function persistUser(user: User): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export async function login(
  username: string,
  password: string,
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  const body = await Login({ username, password });
  if (!body.success) {
    if (body.error?.code === "ACCOUNT_DISABLED") {
      return {
        success: false,
        error: body.error.message || "帳號已停用，請聯絡管理員",
      };
    }
    return { success: false, error: body.error?.message ?? "帳號或密碼錯誤" };
  }

  if (body.data?.token) {
    localStorage.setItem(TOKEN_KEY, body.data.token);
  }

  const me = await apiGetMe();
  if (!me) {
    return {
      success: false,
      error: "登入成功但無法取得使用者資訊，請稍後再試",
    };
  }

  const user = mapApiUser(me);
  persistUser(user);
  return { success: true, user };
}

export async function restoreSession(): Promise<User | null> {
  const me = await apiGetMe();
  if (!me) {
    clearCurrentUser();
    return null;
  }

  const user = mapApiUser(me);
  persistUser(user);
  return user;
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as User;
    // 舊版快取（登入時尚未存 id）視為無效，強制重新 restoreSession()
    if (user.id == null) return null;
    return user;
  } catch {
    return null;
  }
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getHomePath(role: UserRole): string {
  return role === "admin" ? "/overview" : "/leave-balance";
}
