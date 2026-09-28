export const queryKeys = {
  overview: ["overview"] as const,
  quotaMe: (asOf?: string) => ["quota", "me", asOf] as const,
  leaves: (params: object = {}) => ["leaves", params] as const,
  users: (params: object = {}) => ["users", params] as const,
};
