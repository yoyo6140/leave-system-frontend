export type UserRole = "admin" | "employee"
export type Gender   = "男" | "女"

export interface User {
  username: string
  role:     UserRole
  name:     string
  gender?:  Gender
  idNumber?: string
  hireDate?: string
  birthDate?: string
}

interface StoredUser extends User {
  password: string
}

const AUTH_KEY  = "leave_system_auth"
const USERS_KEY = "leave_system_users"

const DEFAULT_USERS: StoredUser[] = [
  { username: "admin",    password: "111111", role: "admin",    name: "主管" },
  { username: "employee", password: "111111", role: "employee", name: "員工" },
]

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
    return DEFAULT_USERS
  }
  return (JSON.parse(raw) as (StoredUser & { displayName?: string })[]).map((u) => ({
    ...u,
    name: u.name ?? u.displayName ?? u.username,
  }))
}

export function getUsers(): User[] {
  return getStoredUsers().map(({ password: _pw, ...u }) => u)
}

export interface AddUserPayload {
  username:  string
  password:  string
  name:      string
  role:      UserRole
  gender?:   Gender
  idNumber?: string
  hireDate?: string
  birthDate?: string
}

export function addUser(payload: AddUserPayload): { success: boolean; error?: string } {
  const users = getStoredUsers()
  if (users.some((u) => u.username === payload.username)) {
    return { success: false, error: "帳號已存在" }
  }
  users.push(payload)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return { success: true }
}

export function updateUser(
  username: string,
  updates: Partial<Omit<StoredUser, "username">>
): void {
  const users = getStoredUsers()
  const idx = users.findIndex((u) => u.username === username)
  if (idx === -1) return
  users[idx] = { ...users[idx], ...updates }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function deleteUser(username: string): void {
  const users = getStoredUsers().filter((u) => u.username !== username)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function login(username: string, password: string): boolean {
  const user = getStoredUsers().find(
    (u) => u.username === username && u.password === password
  )
  if (!user) return false
  const { password: _pw, ...data } = user
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  return true
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as User } catch { return null }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function getHomePath(role: UserRole): string {
  return role === "admin" ? "/dashboard" : "/leave-balance"
}
