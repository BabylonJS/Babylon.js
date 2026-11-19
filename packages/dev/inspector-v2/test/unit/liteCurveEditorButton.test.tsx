// @vitest-environment jsdom

import { type AnimationGroup, type EngineContext } from "@babylonjs/lite";
import { act, type PropsWithChildren, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { LiteAnimationCurveEditor } from "../../src/lite/components/curveEditor/curveEditorButton";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

vi.mock("shared-ui-components/fluent/hoc/buttonLine", () => ({ ButtonLine: () => null }));
vi.mock("shared-ui-components/fluent/hoc/childWindow", () => ({ ChildWindow: (props: PropsWithChildren) => props.children }));
vi.mock("../../src/lite/components/curveEditor/curveEditor", () => {
    let mounts = 0;
    return {
        LiteCurveEditor: (props: { group: AnimationGroup }) => {
            const [instance] = useState(() => ++mounts);
            return <output>{`${props.group.name}:${instance}`}</output>;
        },
    };
});

describe("Lite curve editor window", () => {
    it("resets the editor when its animation group changes", async () => {
        const container = document.createElement("div");
        const root = createRoot(container);
        const engine = {} as EngineContext;
        const first = { name: "First" } as AnimationGroup;
        const second = { name: "Second" } as AnimationGroup;

        await act(async () => root.render(<LiteAnimationCurveEditor engine={engine} group={first} />));
        const firstInstance = container.textContent;
        await act(async () => root.render(<LiteAnimationCurveEditor engine={engine} group={second} />));
        expect(firstInstance).toBe("First:1");
        expect(container.textContent).toBe("Second:2");
        await act(async () => root.unmount());
    });
});
