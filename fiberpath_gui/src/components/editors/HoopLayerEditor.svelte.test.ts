import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import HoopLayerEditor from "./HoopLayerEditor.svelte";
import { projectSession } from "../../state/project-session.svelte";

beforeEach(() => projectSession.newDocument());

describe("HoopLayerEditor.svelte", () => {
  it("reflects and toggles the terminal flag", async () => {
    const id = projectSession.addLayer("hoop");
    render(HoopLayerEditor, { props: { layerId: id } });

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await fireEvent.click(checkbox);
    expect(projectSession.document.layers[0].hoop?.terminal).toBe(true);
    expect(checkbox.checked).toBe(true);
  });
});
