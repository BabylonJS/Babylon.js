/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Color3, Color4 } from "core/Maths/math.color";

const pickerColors = vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    return [] as Array<Color3 | Color4>;
});

vi.mock("../../../src/colorPicker/colorPicker", () => ({
    ColorPicker: (props: { color: Color3 | Color4 }) => {
        pickerColors.push(props.color);
        return null;
    },
}));

vi.mock("../../../src/components/colorPicker/ColorPicker", () => ({
    ColorPickerComponent: (props: { color: Color3 | Color4 }) => {
        pickerColors.push(props.color);
        return null;
    },
}));

import { ColorPickerLine } from "../../../src/lines/colorPickerComponent";
import { ColorPickerLineComponent } from "../../../src/components/lines/ColorPickerLineComponent";

describe.each([
    ["ColorPickerLine", ColorPickerLine],
    ["ColorPickerLineComponent", ColorPickerLineComponent],
] as const)("%s", (_, LineComponent) => {
    const roots: Root[] = [];

    afterEach(() => {
        act(() => roots.splice(0).forEach((root) => root.unmount()));
        document.body.replaceChildren();
        pickerColors.length = 0;
    });

    function Render(value: Color3 | Color4, onColorChanged: (hex: string) => void = () => {}) {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        roots.push(root);
        const render = (nextValue: Color3 | Color4) => act(() => root.render(<LineComponent value={nextValue} onColorChanged={onColorChanged} />));
        render(value);
        return { container, render };
    }

    it.each([
        ["Color3", new Color3(2, 0.5, 0.25), new Color3(3, 0.5, 0.25)],
        ["Color4", new Color4(0.5, 0.5, 0.25, 2), new Color4(0.5, 0.5, 0.25, 3)],
    ])("opens the picker with the latest %s value when two HDR values share a hex string", (_, first, second) => {
        expect(first.toHexString()).toBe(second.toHexString());

        const { container, render } = Render(first);
        render(second);

        const swatch = container.firstElementChild!.firstElementChild as HTMLElement;
        act(() => swatch.click());

        expect(pickerColors.at(-1)).toBe(second);
    });

    it.each([
        ["Color3", new Color3(2, 0.5, 0.25), new Color3(3, 0.5, 0.25)],
        ["Color4", new Color4(0.5, 0.5, 0.25, 2), new Color4(0.5, 0.5, 0.25, 3)],
    ])("does not emit onColorChanged when %s prop changes while picker is open", (_, first, second) => {
        expect(first.toHexString()).toBe(second.toHexString());

        const onColorChanged = vi.fn();
        const { container, render } = Render(first, onColorChanged);

        const swatch = container.firstElementChild!.firstElementChild as HTMLElement;
        act(() => swatch.click());

        render(second);

        expect(onColorChanged).not.toHaveBeenCalled();
    });
});
