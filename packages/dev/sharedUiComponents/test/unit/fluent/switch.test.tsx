/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

import { Switch } from "../../../src/fluent/primitives/switch";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

it("names a switch independently of its visible property label and preserves its disabled behavior", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();
    try {
        act(() => root.render(<Switch ariaLabel="Ground Grid" value={false} onChange={onChange} disabled />));
        const input = container.querySelector('input[role="switch"]') as HTMLInputElement;
        expect(input.getAttribute("aria-label")).toBe("Ground Grid");
        expect(input.disabled).toBe(true);
        act(() => input.click());
        expect(onChange).not.toHaveBeenCalled();
        act(() => root.render(<Switch ariaLabel="Ground Grid" value={false} onChange={onChange} />));
        act(() => input.click());
        expect(onChange).toHaveBeenCalledWith(true);
    } finally {
        act(() => root.unmount());
        container.remove();
    }
});

it("shows the accepted controlled value when the caller rejects a change", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();
    try {
        act(() => root.render(<Switch controlled value={false} onChange={onChange} />));
        const input = container.querySelector<HTMLInputElement>('input[role="switch"]')!;
        act(() => input.click());
        expect(onChange).toHaveBeenLastCalledWith(true);
        expect(input.checked).toBe(false);
        act(() => input.click());
        expect(onChange).toHaveBeenNthCalledWith(2, true);
        expect(input.checked).toBe(false);
        act(() => root.render(<Switch controlled value onChange={onChange} />));
        expect(input.checked).toBe(true);
        act(() => input.click());
        expect(onChange).toHaveBeenLastCalledWith(false);
        expect(input.checked).toBe(true);
    } finally {
        act(() => root.unmount());
        container.remove();
    }
});

it.each([undefined, false])("preserves optimistic updates without controlled mode when value is %s", (value) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();
    try {
        act(() => root.render(<Switch value={value} onChange={onChange} />));
        const input = container.querySelector<HTMLInputElement>('input[role="switch"]')!;
        act(() => input.click());
        expect(onChange).toHaveBeenLastCalledWith(true);
        expect(input.checked).toBe(true);
        act(() => root.render(<Switch value={value} onChange={onChange} />));
        expect(input.checked).toBe(true);
        act(() => input.click());
        expect(onChange).toHaveBeenLastCalledWith(false);
        expect(input.checked).toBe(false);
    } finally {
        act(() => root.unmount());
        container.remove();
    }
});
