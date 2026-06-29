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

  try {
    return (await res.json()) as ApiResponse<T>
  } catch {
    return {
      success: false,
      error: { code: "INVALID_RESPONSE", message: "伺服器回應格式錯誤" },
    }
  }
}
