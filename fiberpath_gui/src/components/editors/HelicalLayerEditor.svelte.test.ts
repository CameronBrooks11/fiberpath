import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import HelicalLayerEditor from "./HelicalLayerEditor.svelte";
import { projectSession } from "../../state/project-session.svelte";

beforeEach(() => projectSession.newDocument());

function renderHelical() {
  const id = projectSession.addLayer("helical");
  render(HelicalLayerEditor, { props: { layerId: id } });
  return id;
}

describe("HelicalLayerEditor.svelte", () => {
  it("renders all six helical fields with defaults", () => {
    renderHelical();
    expect((screen.getByLabelText(/Wind Angle/, { selector: "input" }) as HTMLInputElement).value).toBe("45");
    expect((screen.getByLabelText(/Pattern Number/, { selector: "input" }) as HTMLInputElement).value).toBe("3");
    expect((screen.getByLabelText(/Skip Index/, { selector: "input" }) as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText(/Lock Degrees/, { selector: "input" }) as HTMLInputElement).value).toBe("540");
  });

  it("updates a field and parses integers for pattern/skip", async () => {
    renderHelical();
    await fireEvent.input(screen.getByLabelText(/Wind Angle/, { selector: "input" }), { target: { value: "60" } });
    await fireEvent.input(screen.getByLabelText(/Pattern Number/, { selector: "input" }), { target: { value: "5" } });
    const helical = projectSession.document.layers[0].helical!;
    expect(helical.wind_angle).toBe(60);
    expect(helical.pattern_number).toBe(5);
  });

  it("flags a non-coprime pair on BOTH fields and clears when fixed", async () => {
    renderHelical();
    // pattern 3, skip 6 -> gcd 3 -> not coprime (both fields); skip >= pattern -> hint
    await fireEvent.input(screen.getByLabelText(/Skip Index/, { selector: "input" }), { target: { value: "6" } });
    await waitFor(() => {
      expect(
        screen.getAllByText("Pattern and skip must be coprime (GCD = 1)"),
      ).toHaveLength(2);
    });
    expect(
      screen.getByText(/Skip index should be less than pattern number/),
    ).toBeInTheDocument();

    // fix: skip 2 is coprime with 3 and < pattern -> both errors and the hint clear
    await fireEvent.input(screen.getByLabelText(/Skip Index/, { selector: "input" }), { target: { value: "2" } });
    await waitFor(() => {
      expect(
        screen.queryByText("Pattern and skip must be coprime (GCD = 1)"),
      ).toBeNull();
    });
    expect(
      screen.queryByText(/Skip index should be less than pattern number/),
    ).toBeNull();
  });

  it("validates pre-existing invalid values on mount (no interaction)", async () => {
    const id = projectSession.addLayer("helical");
    projectSession.updateLayer(id, {
      helical: { ...projectSession.document.layers[0].helical!, skip_index: 6 },
    });
    render(HelicalLayerEditor, { props: { layerId: id } });
    await waitFor(() => {
      expect(
        screen.getAllByText("Pattern and skip must be coprime (GCD = 1)"),
      ).toHaveLength(2);
    });
  });

  it("toggles skip_initial_near_lock", async () => {
    renderHelical();
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    await fireEvent.click(checkbox);
    expect(projectSession.document.layers[0].helical?.skip_initial_near_lock).toBe(true);
  });
});
