/**
 * @vitest-environment jsdom
 */

import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Switch } from "../../../src/fluent/primitives/switch";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

describe("Switch", () => {
    const roots: Root[] = [];

    afterEach(() => {
        act(() => roots.splice(0).forEach((root) => root.unmount()));
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    function RenderSwitch(value: boolean, controlled?: boolean) {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        roots.push(root);
        const onChange = vi.fn<(checked: boolean) => void>();
        const render = (nextValue: boolean) =>
            act(() =>
                root.render(
                    <StrictMode>
                        <Switch value={nextValue} controlled={controlled} onChange={onChange} />
                    </StrictMode>
                )
            );
        render(value);
        return { toggle: container.querySelector<HTMLInputElement>('input[role="switch"]')!, render, onChange };
    }

    it.each([false, true])("preserves optimistic updates by default from initial value %s", (initialValue) => {
        const { toggle, render, onChange } = RenderSwitch(initialValue);
        act(() => toggle.click());
        expect(toggle.checked).toBe(!initialValue);
        expect(onChange.mock.calls).toEqual([[!initialValue]]);
        render(!initialValue);
        render(initialValue);
        expect(toggle.checked).toBe(initialValue);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each([false, true])("keeps a controlled switch at value %s until the parent accepts the request", (initialValue) => {
        const { toggle, render, onChange } = RenderSwitch(initialValue, true);
        act(() => toggle.click());
        expect(toggle.checked).toBe(initialValue);
        act(() => toggle.click());
        expect(toggle.checked).toBe(initialValue);
        expect(onChange.mock.calls).toEqual([[!initialValue], [!initialValue]]);
        render(!initialValue);
        expect(toggle.checked).toBe(!initialValue);
        act(() => toggle.click());
        expect(toggle.checked).toBe(!initialValue);
        expect(onChange.mock.calls).toEqual([[!initialValue], [!initialValue], [initialValue]]);
        render(initialValue);
        expect(toggle.checked).toBe(initialValue);
        expect(onChange).toHaveBeenCalledTimes(3);
    });
});
