import axios from "axios";
import { API_BASE_URL } from "./constants";

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

function handleUnauthorized() {
  localStorage.removeItem("leave_system_auth");
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("leave_system_token")
      : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

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
