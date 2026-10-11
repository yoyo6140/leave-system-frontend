import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { apiClient } from "@/lib/api-client";
import type {
  ApiUserData,
  AuthBody,
  LoginInput,
  LoginResponse,
} from "./types";

export type { ApiUserData, AuthBody, LoginInput, LoginResponse };

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

export async function apiGetMe(): Promise<ApiUserData | null> {
  try {
    const res = await apiClient.get<
      { data?: ApiUserData } & Partial<ApiUserData>
    >(API_ENDPOINTS.auth.me);
    const body = res.data;
    return body.data ?? (body as ApiUserData);
  } catch {
    return null;
  }
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
    if (body.success)
      return { ok: true, message: body.data?.message ?? "已送出" };
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
