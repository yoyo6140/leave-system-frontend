export const quotaKeys = {
  all: ["quota"] as const,
  me: (asOf?: string) => [...quotaKeys.all, "me", asOf] as const,
};
