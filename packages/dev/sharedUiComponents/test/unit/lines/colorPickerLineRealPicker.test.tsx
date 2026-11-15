/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Color3, Color4 } from "core/Maths/math.color";
import { ColorPickerLine } from "../../../src/lines/colorPickerComponent";
import { ColorPickerLineComponent } from "../../../src/components/lines/ColorPickerLineComponent";

// Uses the real ColorPicker children (no mocks), so their own update lifecycle runs.
describe.each([
    ["ColorPickerLine", ColorPickerLine],
    ["ColorPickerLineComponent", ColorPickerLineComponent],
] as const)("%s with the real picker", (_, LineComponent) => {
    const roots: Root[] = [];

    beforeAll(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    });

    afterEach(() => {
        act(() => roots.splice(0).forEach((root) => root.unmount()));
        document.body.replaceChildren();
    });

    it.each([
        ["Color3", new Color3(2, 0.5, 0.25), new Color3(3, 0.5, 0.25)],
        ["Color4", new Color4(2, 0.5, 0.25, 1), new Color4(3, 0.5, 0.25, 1)],
    ])("does not emit onColorChanged when the %s prop changes to a value with the same hex while open", (_, first, second) => {
        expect(first.toHexString()).toBe(second.toHexString());

        const onColorChanged = vi.fn();
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        roots.push(root);
        const render = (value: Color3 | Color4) => act(() => root.render(<LineComponent value={value} onColorChanged={onColorChanged} />));

        render(first);
        const swatch = container.firstElementChild!.firstElementChild as HTMLElement;
        act(() => swatch.click());
        onColorChanged.mockClear();

        render(second);

        expect(onColorChanged).not.toHaveBeenCalled();
    });
});
