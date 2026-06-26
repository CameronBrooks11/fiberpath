import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import LayerList from "./LayerList.svelte";
import { projectSession } from "../../state/project-session.svelte";

beforeEach(() => projectSession.newDocument());

describe("LayerList.svelte", () => {
  it("shows an empty state with no layers", () => {
    render(LayerList);
    expect(screen.getByText(/No layers yet/)).toBeInTheDocument();
  });

  it("adds a layer via the type picker", async () => {
    render(LayerList);
    await fireEvent.click(screen.getByRole("button", { name: "+ Add Layer" }));
    await fireEvent.click(screen.getByRole("menuitem", { name: /Helical Layer/ }));
    expect(projectSession.document.layers).toHaveLength(1);
    expect(projectSession.document.layers[0].type).toBe("helical");
    // picker closes after adding
    expect(screen.queryByRole("menuitem", { name: /Helical Layer/ })).toBeNull();
  });

  it("selects, duplicates and removes layers", async () => {
    projectSession.addLayer("hoop");
    projectSession.selectLayer(null);
    render(LayerList);

    await fireEvent.click(screen.getByRole("button", { name: /Hoop/ }));
    expect(projectSession.selectedLayerId).toBe(projectSession.document.layers[0].id);

    await fireEvent.click(screen.getByTitle("Duplicate layer"));
    expect(projectSession.document.layers).toHaveLength(2);

    const removeButtons = screen.getAllByTitle("Remove layer");
    await fireEvent.click(removeButtons[0]);
    expect(projectSession.document.layers).toHaveLength(1);
  });

  it("reorders with the keyboard handle (ArrowUp)", async () => {
    const first = projectSession.addLayer("hoop");
    const second = projectSession.addLayer("skip");
    render(LayerList);

    const handles = screen.getAllByLabelText(/Reorder/);
    await fireEvent.keyDown(handles[1], { key: "ArrowUp" });
    expect(projectSession.document.layers.map((l) => l.id)).toEqual([second, first]);
  });

  it("reorders via native drag and drop", async () => {
    const first = projectSession.addLayer("hoop");
    const second = projectSession.addLayer("skip");
    render(LayerList);

    const rows = screen.getAllByRole("listitem");
    await fireEvent.dragStart(rows[0]);
    await fireEvent.drop(rows[1]);
    expect(projectSession.document.layers.map((l) => l.id)).toEqual([second, first]);
  });
});
