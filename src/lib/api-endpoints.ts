export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://leaves-api.yoyodev.win";

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
    updateStatus: (id: number) => `/user/${id}/status`,
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
    // 取消申請＝刪除整筆（delete 端點），沒有另外的 cancel 端點
    statusLogs: (id: string) => `/leaves/${id}/status-logs`,
  },
} as const;
