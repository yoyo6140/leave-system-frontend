import { API_BASE_URL } from "./constants"

export interface ApiError {
  code: string
  message: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
}

function handleUnauthorized() {
  localStorage.removeItem("leave_system_auth")
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login"
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  })

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    handleUnauthorized()
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "登入已過期，請重新登入" },
    }
  }

  try {
    return (await res.json()) as ApiResponse<T>
  } catch {
    return {
      success: false,
      error: { code: "INVALID_RESPONSE", message: "伺服器回應格式錯誤" },
    }
  }
}
