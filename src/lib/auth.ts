import { apiGetMe, Login } from "@/features/auth/api";

export type UserRole = "sup_admin" | "admin" | "employee";
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

// 將後端回傳的 snake_case 使用者資料轉換成前端慣用的 camelCase User 物件
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
    role:
      user.role?.toLowerCase() === "sup_admin"
        ? "sup_admin"
        : user.role?.toLowerCase() === "admin"
          ? "admin"
          : "employee",
    gender: user.gender as Gender | undefined,
    idNumber: user.id_number ?? user.idNumber,
    hireDate: user.hire_date ?? user.hireDate,
    birthDate: user.birth_date ?? user.birthDate,
  };
}

// 將登入後的使用者資料寫入 localStorage，供重新整理後讀取
function persistUser(user: User): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

// 登入流程：呼叫登入 API、儲存 token，再取得並快取使用者資料
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

// 頁面載入時用既有 token 向後端驗證並還原登入狀態，失敗則清除快取
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

// 同步讀取 localStorage 中快取的使用者資料（不打 API），用於畫面初始渲染
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

// 登出時清除本機儲存的使用者資料與 token
export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

// 依角色決定登入後導向的首頁路徑（管理者看總覽，員工看自己的假別餘額）
export function getHomePath(role: UserRole): string {
  return role === "admin" || role === "sup_admin"
    ? "/overview"
    : "/leave-balance";
}
