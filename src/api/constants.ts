export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  quota: {
    me: "/leave-quota/me",
    user: (id: number) => `/leave-quota/${id}`,
  },
  users: {
    list: "/users",
    create: "/user",
    get: (id: number) => `/user/${id}`,
    update: (id: number) => `/user/${id}`,
    delete: (id: number) => `/user/${id}`,
  },
  overview: "/overview",
  chat: "/chat",
  leaves: {
    list: "/leaves",
    create: "/leaves",
    get: (id: string) => `/leaves/${id}`,
    update: (id: string) => `/leaves/${id}`,
    delete: (id: string) => `/leaves/${id}`,
    updateStatus: (id: string) => `/leaves/${id}/status`,
    cancel: (id: string) => `/leaves/${id}/cancel`,
    statusLogs: (id: string) => `/leaves/${id}/status-logs`,
  },
} as const;
