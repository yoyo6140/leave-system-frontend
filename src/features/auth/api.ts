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

// 呼叫後端登入 API，成功會回傳 token；失敗回傳錯誤訊息
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

// 通知後端登出使 cookie/token 失效；失敗也忽略，前端仍會清除本機登入狀態
export async function Logout() {
  try {
    await apiClient.post(API_ENDPOINTS.auth.logout);
  } catch {
    // ignore
  }
}

// 用目前的 token 向後端查詢「我是誰」，取不到就回傳 null（視為未登入）
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

// 送出忘記密碼請求，後端會寄送 30 分鐘內有效的重設連結到該信箱
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

// 本人登入後，用舊密碼驗證並設定新密碼
export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiClient.post<AuthBody>(
      API_ENDPOINTS.auth.changePassword,
      { old_password: oldPassword, new_password: newPassword },
    );
    const body = res.data;
    if (body.success)
      return { ok: true, message: body.data?.message ?? "密碼已修改" };
    return { ok: false, message: body.error?.message ?? "發生錯誤" };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data as AuthBody;
      return { ok: false, message: body.error?.message ?? "發生錯誤" };
    }
    return { ok: false, message: "網路錯誤" };
  }
}

// 使用信件中的 token 設定新密碼
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
