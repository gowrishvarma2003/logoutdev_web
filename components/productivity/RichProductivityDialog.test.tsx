import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RichProductivityDialog from "./RichProductivityDialog";
import { productivityApi } from "@/lib/services/productivityApi";

vi.mock("@/lib/services/productivityApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/productivityApi")>("@/lib/services/productivityApi");
  return {
    ...actual,
    productivityApi: {
      compose: vi.fn().mockResolvedValue({ kind: "task", item: { id: "task-1", title: "Ship planner" } }),
    },
  };
});

describe("RichProductivityDialog", () => {
  it("creates a sparse Inbox task from only a title", async () => {
    vi.mocked(productivityApi.compose).mockClear();
    render(<RichProductivityDialog open onClose={() => {}} defaultTitle="Capture quickly" />);

    expect(screen.queryByLabelText(/Description/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() => expect(productivityApi.compose).toHaveBeenCalledWith({
      kind: "task",
      item: expect.objectContaining({ title: "Capture quickly" }),
    }));
    expect(vi.mocked(productivityApi.compose).mock.calls[0][0].item).not.toHaveProperty("priority");
    expect(vi.mocked(productivityApi.compose).mock.calls[0][0].item).not.toHaveProperty("list_id");
  });

  it("builds a rich task compose payload", async () => {
    vi.mocked(productivityApi.compose).mockClear();
    const onCreated = vi.fn();
    render(
      <RichProductivityDialog
        open
        onClose={() => {}}
        initialKind="task"
        lists={[{ id: "list-1", name: "Launch", description: null, color: null, default_view: "list", is_archived: false }]}
        defaultTitle="Ship planner"
        defaultMyDay
        onCreated={onCreated}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^More$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^List$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Priority$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Date$/i }));
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Robust creation flow" } });
    fireEvent.change(screen.getByLabelText(/^List$/i), { target: { value: "list-1" } });
    fireEvent.change(screen.getByLabelText(/^Priority$/i), { target: { value: "high" } });
    fireEvent.change(screen.getByLabelText(/^Due$/i), { target: { value: "2026-07-20T10:30" } });
    fireEvent.change(screen.getByLabelText(/^Estimate minutes$/i), { target: { value: "45" } });
    fireEvent.change(screen.getByLabelText(/^Checklist$/i), { target: { value: "Backend\nFrontend" } });
    fireEvent.change(screen.getByLabelText(/^Tags$/i), { target: { value: "planning, logoutdev" } });
    fireEvent.change(screen.getByLabelText(/^Linked reminder time$/i), { target: { value: "2026-07-20T09:30" } });

    fireEvent.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() => expect(productivityApi.compose).toHaveBeenCalledTimes(1));
    expect(productivityApi.compose).toHaveBeenCalledWith(expect.objectContaining({
      kind: "task",
      checklist: ["Backend", "Frontend"],
      tags: ["planning", "logoutdev"],
      my_day: { day: expect.any(String) },
    }));
    expect(productivityApi.compose).toHaveBeenCalledWith(expect.objectContaining({
      item: expect.objectContaining({
        title: "Ship planner",
        description: "Robust creation flow",
        list_id: "list-1",
        priority: "high",
        estimated_minutes: 45,
      }),
      reminders: [expect.objectContaining({ title: "Reminder: Ship planner" })],
    }));
    expect(onCreated).toHaveBeenCalled();
  });
});
