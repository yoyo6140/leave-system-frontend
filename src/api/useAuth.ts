import { API_BASE_URL, API_ENDPOINTS } from "./constants"

interface LoginInput {
  username: string
  password: string
}

interface LoginResponse {
  success: boolean
  error?: {
    code: string
    message: string
  }
}
interface LoginOutResponse {
  success: boolean
  error?: {
    code: string
    message: string
  }
}
export async function Login(input: LoginInput): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  })
  return res.json()
}

export async function Logout() {
    await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.logout}`, { method: "POST", credentials: "include" })
  }

export async function apiGetMe() {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.me}`, { credentials: "include" })
  if (!res.ok) return null
  const body = await res.json()
  return body.data ?? body
}


