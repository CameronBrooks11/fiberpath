import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import AboutDialog from "./AboutDialog.svelte";

describe("AboutDialog.svelte", () => {
  it("renders the title and closes via the × button and Escape", async () => {
    const onclose = vi.fn();
    render(AboutDialog, { props: { onclose } });

    expect(screen.getByText("About FiberPath")).toBeInTheDocument();

    await fireEvent.click(screen.getByLabelText("Close"));
    expect(onclose).toHaveBeenCalledTimes(1);

    await fireEvent.keyDown(window, { key: "Escape" });
    expect(onclose).toHaveBeenCalledTimes(2);
  });

  it("closes on a backdrop click but not on a content click", async () => {
    const onclose = vi.fn();
    const { container } = render(AboutDialog, { props: { onclose } });
    const overlay = container.querySelector(".dialog-overlay")!;
    const content = container.querySelector(".dialog-content")!;

    await fireEvent.click(content); // inside the dialog — must NOT close
    expect(onclose).not.toHaveBeenCalled();

    await fireEvent.click(overlay); // the backdrop — closes
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
