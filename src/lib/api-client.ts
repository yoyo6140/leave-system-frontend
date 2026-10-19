import axios from "axios";
import { API_BASE_URL } from "./api-endpoints";

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// 未授權（401）時清除登入快取並導回登入頁
function handleUnauthorized() {
  localStorage.removeItem("leave_system_auth");
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }
}

// 共用的 axios 實例，所有 API 請求都透過它送出
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 請求攔截器：自動在每個請求夾帶 localStorage 中的 token
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("leave_system_token")
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 回應攔截器：收到 401 時（登入請求本身除外）觸發登出流程
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const path = error.config?.url ?? "";
      if (!path.endsWith("/auth/login")) handleUnauthorized();
    }
    return Promise.reject(error);
  },
);

// 統一的 API 請求包裝：呼叫後端並回傳一致格式的 ApiResponse，錯誤會被攔截轉換而不是丟出例外
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: string } = {},
): Promise<ApiResponse<T>> {
  try {
    const res = await apiClient.request<ApiResponse<T>>({
      url: path,
      method: init.method ?? "GET",
      data: init.body ? (JSON.parse(init.body) as unknown) : undefined,
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<T>;
    }
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "網路錯誤，請稍後再試" },
    };
  }
}
