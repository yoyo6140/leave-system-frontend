import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useCreateLeave,
  useLeavesQuery,
  type ApiLeaveRecord,
} from "@/features/leaves/hooks";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
  apiClient: {},
}));

import { apiFetch } from "@/lib/api-client";

const mockedApiFetch = vi.mocked(apiFetch);

const sampleLeave: ApiLeaveRecord = {
  id: "leave-1",
  user_id: 1,
  type: "annual",
  start_date: "2026-03-01",
  end_date: "2026-03-01",
  hours: 8,
  reason: "家庭事務",
  status: "待審核",
  reviewer: null,
  reviewed_at: null,
  review_note: null,
  created_at: "2026-02-01T00:00:00.000Z",
  updated_at: null,
};

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useLeavesQuery / useCreateLeave", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("成功載入請假列表", async () => {
    mockedApiFetch.mockResolvedValue({
      success: true,
      data: {
        total: 1,
        page: 1,
        limit: 100,
        data: [sampleLeave],
      },
    });

    const { result } = renderHook(
      () => useLeavesQuery({ limit: 100, mine: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0]?.type).toBe("annual");
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/leaves?limit=100&mine=true",
    );
  });

  it("新增假單成功後可取得回傳資料", async () => {
    mockedApiFetch.mockResolvedValue({
      success: true,
      data: sampleLeave,
    });

    const { result } = renderHook(() => useCreateLeave(), {
      wrapper: createWrapper(),
    });

    let created: ApiLeaveRecord | undefined;
    await act(async () => {
      created = await result.current.mutateAsync({
        type: "annual",
        start_date: "2026-03-01",
        end_date: "2026-03-01",
        hours: 8,
        reason: "家庭事務",
      });
    });

    expect(created?.id).toBe("leave-1");
    expect(mockedApiFetch).toHaveBeenCalledWith("/leaves", {
      method: "POST",
      body: JSON.stringify({
        type: "annual",
        start_date: "2026-03-01",
        end_date: "2026-03-01",
        hours: 8,
        reason: "家庭事務",
      }),
    });
  });
});
