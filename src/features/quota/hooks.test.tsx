import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMyQuotaQuery } from "@/features/quota/hooks";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
  apiClient: {},
}));

import { apiFetch } from "@/lib/api-client";

const mockedApiFetch = vi.mocked(apiFetch);

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useMyQuotaQuery", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("成功時回傳假別餘額資料", async () => {
    mockedApiFetch.mockResolvedValue({
      success: true,
      data: {
        user_id: 1,
        username: "employee",
        name: "陳志明",
        as_of: "2026-01-01",
        year_start: "2025-01-01",
        year_end: "2025-12-31",
        quotas: [
          {
            type: "annual",
            total_days: 10,
            total_hours: 80,
            used_hours: 8,
            remaining_hours: 72,
            note: "年資滿一年",
          },
        ],
      },
    });

    const { result } = renderHook(() => useMyQuotaQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe("陳志明");
    expect(result.current.data?.quotas[0]?.remaining_hours).toBe(72);
    expect(mockedApiFetch).toHaveBeenCalledWith("/leave-quota/me");
  });

  it("API 失敗時進入 error 狀態", async () => {
    mockedApiFetch.mockResolvedValue({
      success: false,
      error: { code: "ERROR", message: "載入失敗" },
    });

    const { result } = renderHook(() => useMyQuotaQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("載入失敗");
  });
});
