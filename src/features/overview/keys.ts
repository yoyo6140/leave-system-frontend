export const overviewKeys = {
  all: ["overview"] as const,
  monthly: (year: number) => [...overviewKeys.all, "monthly", year] as const,
};
