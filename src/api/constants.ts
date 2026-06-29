export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export const API_ENDPOINTS = {
  auth: {
    login:  "/auth/login",
    logout: "/auth/logout",
    me:     "/auth/me",
  },
  quota: {
    me:   "/leave-quota/me",
    user: (id: number) => `/leave-quota/${id}`,
  },
  users: {
    list:   "/users",
    create: "/user",
    get:    (id: number) => `/user/${id}`,
    update: (id: number) => `/user/${id}`,
    delete: (id: number) => `/user/${id}`,
  },
} as const
