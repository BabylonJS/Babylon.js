// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Animation } from "core/Animations/animation";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";

import { GetAnimationsWithChildren, type AnimatableWithChildren } from "../../src/components/curveEditor/animatableAnimations";
import { CurveEditorProvider, useCurveEditor, type CurveEditorObservables } from "../../src/components/curveEditor/curveEditorContext";
import { SideBar } from "../../src/components/curveEditor/sideBar";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

describe("Curve editor SideBar delete", () => {
    let engine: NullEngine;
    let scene: Scene;
    let container: HTMLElement;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
        scene.dispose();
        engine.dispose();
    });

    it("removes a deleted child track from the latest animations array after the prop is replaced", async () => {
        const childAnimation = new Animation("child", "position.x", 30, Animation.ANIMATIONTYPE_FLOAT);
        const child = { animations: [childAnimation] } as IAnimatable;
        const target: AnimatableWithChildren = { getAnimatables: () => [child] };

        let observables: CurveEditorObservables | undefined;
        const Probe = () => {
            observables = useCurveEditor().observables;
            return null;
        };

        const render = (animations: Animation[]) => (
            <CurveEditorProvider scene={scene} target={target as IAnimatable} animations={animations}>
                <SideBar />
                <Probe />
            </CurveEditorProvider>
        );

        const root = createRoot(container);
        await act(async () => root.render(render(GetAnimationsWithChildren(target))));

        // The animations pane builds a new aggregate array on every render
        const latest = GetAnimationsWithChildren(target);
        await act(async () => root.render(render(latest)));

        await act(async () => observables!.onDeleteAnimation.notifyObservers(childAnimation));

        expect(child.animations).toEqual([]);
        expect(latest).toEqual([]);

        await act(async () => root.unmount());
    });
});
