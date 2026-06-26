import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import SkipLayerEditor from "./SkipLayerEditor.svelte";
import { projectSession } from "../../state/project-session.svelte";

beforeEach(() => projectSession.newDocument());

describe("SkipLayerEditor.svelte", () => {
  it("updates the mandrel rotation", async () => {
    const id = projectSession.addLayer("skip");
    render(SkipLayerEditor, { props: { layerId: id } });

    const input = screen.getByLabelText(/Mandrel Rotation/);
    await fireEvent.input(input, { target: { value: "120" } });
    expect(projectSession.document.layers[0].skip?.mandrel_rotation).toBe(120);
  });

  it("shows a client error for a non-numeric rotation (debounced)", async () => {
    const id = projectSession.addLayer("skip");
    render(SkipLayerEditor, { props: { layerId: id } });

    await fireEvent.input(screen.getByLabelText(/Mandrel Rotation/), {
      target: { value: "" },
    });
    await waitFor(() =>
      expect(screen.getByText("Rotation must be a valid number")).toBeInTheDocument(),
    );
  });
});
