import axios from "axios";
import { API_ENDPOINTS } from "./constants";
import { apiClient } from "./client";

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

type AuthBody = {
  success: boolean;
  data?: { message: string };
  error?: { message: string };
};

export interface ApiUserData {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
}

export async function Login(input: LoginInput): Promise<LoginResponse> {
  try {
    const res = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      input,
    );
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as LoginResponse;
    }
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "網路錯誤" },
    };
  }
}

export async function Logout() {
  try {
    await apiClient.post(API_ENDPOINTS.auth.logout);
  } catch {
    // ignore
  }
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
  try {
    const res = await apiClient.post<AuthBody>(
      API_ENDPOINTS.auth.forgotPassword,
      { email },
    );
    const body = res.data;
    if (body.success) return { ok: true, message: body.data?.message ?? "已送出" };
    return { ok: false, message: body.error?.message ?? "發生錯誤" };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data as AuthBody;
      return { ok: false, message: body.error?.message ?? "發生錯誤" };
    }
    return { ok: false, message: "網路錯誤" };
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiClient.post<AuthBody>(
      API_ENDPOINTS.auth.resetPassword,
      { token, new_password: newPassword },
    );
    const body = res.data;
    if (body.success)
      return { ok: true, message: body.data?.message ?? "密碼已重設" };
    return { ok: false, message: body.error?.message ?? "發生錯誤" };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data as AuthBody;
      return { ok: false, message: body.error?.message ?? "發生錯誤" };
    }
    return { ok: false, message: "網路錯誤" };
  }
}
