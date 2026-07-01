import { API_BASE_URL, API_ENDPOINTS } from "./constants";

interface LoginInput {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: { token: string };
  error?: {
    code: string;
    message: string;
  };
}
interface LoginOutResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}
export async function Login(input: LoginInput): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function Logout() {
  await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.logout}`, {
    method: "POST",
    credentials: "include",
  });
}

export async function apiGetMe() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("leave_system_token")
      : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.me}`, {
    credentials: "include",
    headers,
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.data ?? body;
}

export async function forgotPassword(
  email: string,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.auth.forgotPassword}`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
  const body = (await res.json()) as {
    success: boolean;
    data?: { message: string };
    error?: { message: string };
  };
  if (body.success)
    return { ok: true, message: body.data?.message ?? "已送出" };
  return { ok: false, message: body.error?.message ?? "發生錯誤" };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.auth.resetPassword}`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    },
  );
  const body = (await res.json()) as {
    success: boolean;
    data?: { message: string };
    error?: { message: string };
  };
  if (body.success)
    return { ok: true, message: body.data?.message ?? "密碼已重設" };
  return { ok: false, message: body.error?.message ?? "發生錯誤" };
}
