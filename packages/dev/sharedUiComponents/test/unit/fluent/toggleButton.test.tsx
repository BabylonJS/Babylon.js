/**
 * @vitest-environment jsdom
 */

import { TargetRegular } from "@fluentui/react-icons";
import { act, StrictMode, useState, type FunctionComponent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToggleButton } from "../../../src/fluent/primitives/toggleButton";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

describe("ToggleButton", () => {
    const roots: Root[] = [];

    afterEach(() => {
        act(() => roots.splice(0).forEach((root) => root.unmount()));
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    function MakeRoot() {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        roots.push(root);
        return { root, container };
    }

    function RenderToggle(value: boolean, onChange = vi.fn<(checked: boolean) => void>()) {
        const { root, container } = MakeRoot();
        const render = (nextValue: boolean) =>
            act(() =>
                root.render(
                    <StrictMode>
                        <ToggleButton title="Toggle" checkedIcon={TargetRegular} value={nextValue} onChange={onChange} />
                    </StrictMode>
                )
            );
        render(value);
        return { container, render, onChange };
    }

    it.each([false, true])("keeps the parent in control of checked state from initial value %s", (initialValue) => {
        const { container, render, onChange } = RenderToggle(initialValue);
        const button = container.querySelector("button")!;
        act(() => button.click());
        expect(onChange.mock.calls).toEqual([[!initialValue]]);
        expect(button.getAttribute("aria-pressed")).toBe(String(initialValue));
        render(!initialValue);
        expect(button.getAttribute("aria-pressed")).toBe(String(!initialValue));
        act(() => button.click());
        expect(onChange.mock.calls).toEqual([[!initialValue], [initialValue]]);
        expect(button.getAttribute("aria-pressed")).toBe(String(!initialValue));
    });

    it("requests the opposite of the rendered value for each batched click without duplicate StrictMode callbacks", () => {
        const { container, onChange } = RenderToggle(false);
        const button = container.querySelector("button")!;
        act(() => {
            button.click();
            button.click();
            button.click();
        });
        expect(onChange.mock.calls).toEqual([[true], [true], [true]]);
        expect(button.getAttribute("aria-pressed")).toBe("false");
    });

    it("synchronizes external value changes without notifying onChange", () => {
        const { container, render, onChange } = RenderToggle(false);
        expect(onChange).not.toHaveBeenCalled();
        render(true);
        expect(container.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
        expect(onChange).not.toHaveBeenCalled();
        act(() => container.querySelector("button")!.click());
        expect(onChange.mock.calls).toEqual([[false]]);
        render(false);
        expect(container.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
        expect(onChange.mock.calls).toEqual([[false]]);
        act(() => container.querySelector("button")!.click());
        expect(onChange.mock.calls).toEqual([[false], [true]]);
    });

    it("notifies a controlled parent once per click outside render and renders the accepted value", () => {
        const consoleError = vi.spyOn(console, "error");
        const onChange = vi.fn<(checked: boolean) => void>();
        const Parent: FunctionComponent = () => {
            const [value, setValue] = useState(false);
            return (
                <ToggleButton
                    title="Toggle"
                    checkedIcon={TargetRegular}
                    value={value}
                    onChange={(checked) => {
                        onChange(checked);
                        setValue(checked);
                    }}
                />
            );
        };
        const { root, container } = MakeRoot();
        act(() =>
            root.render(
                <StrictMode>
                    <Parent />
                </StrictMode>
            )
        );
        const button = container.querySelector("button")!;
        act(() => button.click());
        expect(button.getAttribute("aria-pressed")).toBe("true");
        act(() => button.click());
        expect(button.getAttribute("aria-pressed")).toBe("false");
        act(() => button.click());
        expect(onChange.mock.calls).toEqual([[true], [false], [true]]);
        expect(button.getAttribute("aria-pressed")).toBe("true");
        expect(consoleError).not.toHaveBeenCalled();
    });
});
