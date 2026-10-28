/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

import { SyncedSliderInput } from "../../../src/fluent/primitives/syncedSlider";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

it.each([undefined, true])("only accepts out-of-range numeric input when unboundedInput is enabled (%s)", (unboundedInput) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();
    try {
        act(() => root.render(<SyncedSliderInput value={0.5} min={0} max={1} step={0.01} unboundedInput={unboundedInput} onChange={onChange} />));
        const input = container.querySelector<HTMLInputElement>('input[type="text"]')!;
        const range = container.querySelector<HTMLInputElement>('input[type="range"]')!;
        expect(range).not.toBeNull();
        // Slider scales bounds by 0.01 and uses the native default step of 1 to avoid tick marks.
        expect([range.min, range.max, range.step]).toEqual(["0", "100", ""]);
        for (const value of ["1.5", "-0.5"]) {
            act(() => {
                input.focus();
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
                input.dispatchEvent(new Event("input", { bubbles: true }));
            });
            act(() => input.blur());
            expect(input.value).toBe(unboundedInput ? value : "0.5");
        }
        expect(onChange.mock.calls).toEqual(unboundedInput ? [[1.5], [-0.5]] : []);
    } finally {
        act(() => root.unmount());
        container.remove();
    }
});
