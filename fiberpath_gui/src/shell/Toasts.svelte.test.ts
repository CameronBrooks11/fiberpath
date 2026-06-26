import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import Toasts from "./Toasts.svelte";
import { notifications } from "../state/notifications.svelte";

beforeEach(() => notifications.clear());

describe("Toasts.svelte", () => {
  it("renders nothing when there are no toasts", () => {
    const { container } = render(Toasts);
    expect(container.querySelector(".toast-container")).toBeNull();
  });

  it("renders pushed toasts with their type and message", async () => {
    render(Toasts);
    notifications.error("disk full");
    expect(await screen.findByText("disk full")).toBeInTheDocument();
    // type is reflected on the element (drives the scoped colour rules)
    const toast = screen.getByText("disk full").closest(".toast");
    expect(toast).toHaveAttribute("data-type", "error");
    // the fixed-overlay container is present (the styling the renderer depends on)
    expect(document.querySelector(".toast-container")).not.toBeNull();
  });

  it("dismisses a toast via its close button", async () => {
    render(Toasts);
    notifications.info("hello");
    await screen.findByText("hello");
    await fireEvent.click(screen.getByLabelText("Close notification"));
    expect(screen.queryByText("hello")).toBeNull();
  });
});
