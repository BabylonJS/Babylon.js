// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CurveEditorProvider, useCurveEditor } from "../../src/components/curveEditor/normalizedCurveEditorContext";
import { type ICurveEditorAnimation, type ICurveEditorSource } from "../../src/components/curveEditor/curveEditorModel";
import { LiteCurveEditorSideBar } from "../../src/lite/components/curveEditor/sideBar";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

describe("Lite curve-editor track selection", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    it("updates the shared editor's active tracks when a sidebar checkbox changes", async () => {
        const createAnimation = (uniqueId: string, name: string): ICurveEditorAnimation => ({
            uniqueId,
            name,
            framePerSecond: 60,
            kind: "float",
            components: [{ name: "Value", color: "#ffffff" }],
            supportsTangents: false,
            supportsInterpolationEditing: false,
            source: {},
            getKeys: () => [],
            setKeys: () => {},
            evaluate: () => [0],
        });
        const first = createAnimation("first", "First track");
        const second = createAnimation("second", "Second track");
        const source: ICurveEditorSource = {
            animations: [first, second],
            initialActiveAnimations: [first, second],
            playback: {
                play: () => {},
                stop: () => {},
                moveToFrame: () => {},
                getCurrentFrame: () => 0,
            },
            clipDuration: 10,
            capabilities: {
                canEditClipLength: false,
                canDeleteBoundaryKeys: true,
                canEditBoundaryKeyFrames: true,
                canDeleteLastKey: false,
                constrainKeyFrames: true,
            },
        };

        let setActiveCurveAnimations: ((animations: ICurveEditorAnimation[]) => void) | undefined;
        const Probe = () => {
            const { state, actions } = useCurveEditor();
            setActiveCurveAnimations = actions.setActiveCurveAnimations;
            return <output data-testid="active-tracks">{state.activeCurveAnimations.map((animation) => animation.name).join(",")}</output>;
        };

        const root = createRoot(container);
        await act(async () => {
            root.render(
                <CurveEditorProvider source={source}>
                    <LiteCurveEditorSideBar />
                    <Probe />
                </CurveEditorProvider>
            );
        });
        await act(async () => {
            setActiveCurveAnimations?.([...source.initialActiveAnimations]);
        });

        const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(2);
        expect(container.querySelector("[data-testid='active-tracks']")?.textContent).toBe("First track,Second track");

        await act(async () => {
            checkboxes[1].click();
        });

        expect(container.querySelector("[data-testid='active-tracks']")?.textContent).toBe("First track");

        await act(async () => root.unmount());
    });
});
