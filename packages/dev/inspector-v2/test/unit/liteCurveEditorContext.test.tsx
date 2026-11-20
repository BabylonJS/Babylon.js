// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    createAnimationManager,
    createPropertyAnimationClip,
    createPropertyAnimationGroup,
    evaluateAnimationTrack,
    getAnimationGroupTracks,
    goToFrame,
    setAnimationTrackKeys,
    type AnimationEasing,
    type EngineContext,
} from "@babylonjs/lite";

import { CurveEditorProvider, useCurveEditor } from "../../src/components/curveEditor/normalizedCurveEditorContext";
import { type ICurveEditorAnimation, type ICurveEditorSource } from "../../src/components/curveEditor/curveEditorModel";
import { PlayHead } from "../../src/components/curveEditor/canvas/playHead";
import { Graph } from "../../src/components/curveEditor/canvas/graph";
import { CurveData } from "../../src/components/curveEditor/canvas/curveData";
import { RangeFrameBar } from "../../src/components/curveEditor/canvas/rangeFrameBar";
import { CreateBabylonCurveEditorAnimation } from "../../src/components/curveEditor/curveEditorSource";
import { Animation } from "core/Animations/animation";
import { Quaternion } from "core/Maths/math.vector";
import { LiteCurveEditorSideBar } from "../../src/lite/components/curveEditor/sideBar";
import { CreateLiteCurveEditorSource } from "../../src/lite/components/curveEditor/curveEditorSource";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

function CreateEasedLiteSource(easing: AnimationEasing, frame = 0) {
    const target = { value: 0 };
    const clip = createPropertyAnimationClip(
        "Eased",
        [
            {
                path: "value",
                easing,
                keys: [
                    { frame: 0, value: 0 },
                    { frame: 30, value: 10 },
                ],
            },
        ],
        { frameRate: 30 }
    );
    const group = createPropertyAnimationGroup(createAnimationManager(), target, clip);
    const scene = { _kind: "scene", animationGroups: [group] };
    const engineData = { surfaces: [] as object[], _renderingContexts: [scene] };
    engineData.surfaces.push(engineData);
    const engine = engineData as unknown as EngineContext;
    goToFrame(group, frame, engine);
    const source = CreateLiteCurveEditorSource(group, engine, { evaluateAnimationTrack, getAnimationGroupTracks, setAnimationTrackKeys });
    return { target, group, source };
}

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

    it("initializes and refreshes at the playback's current frame", async () => {
        const moveToFrame = vi.fn();
        const animation: ICurveEditorAnimation = {
            uniqueId: "track",
            name: "Track",
            framePerSecond: 30,
            kind: "float",
            components: [{ name: "Value", color: "#fff" }],
            supportsTangents: false,
            supportsInterpolationEditing: false,
            source: {},
            getKeys: () => [],
            setKeys: () => {},
            evaluate: () => [0],
        };
        const source: ICurveEditorSource = {
            animations: [animation],
            initialActiveAnimations: [animation],
            playback: { play: () => {}, stop: () => {}, moveToFrame, getCurrentFrame: () => 15 },
            clipDuration: 30,
            capabilities: {
                canEditClipLength: false,
                canDeleteBoundaryKeys: true,
                canEditBoundaryKeyFrames: true,
                canDeleteLastKey: false,
                constrainKeyFrames: true,
            },
        };
        let refresh: (() => void) | undefined;
        let prepare: (() => void) | undefined;
        let moveTo: ((frame: number) => void) | undefined;
        const Probe = () => {
            const { state, actions } = useCurveEditor();
            refresh = actions.refreshTarget;
            prepare = actions.prepare;
            moveTo = actions.moveToFrame;
            return <output>{state.activeFrame}</output>;
        };
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <CurveEditorProvider source={source}>
                    <Probe />
                    <PlayHead width={330} height={100} />
                </CurveEditorProvider>
            )
        );
        await act(async () => prepare?.());
        expect(container.querySelector("output")?.textContent).toBe("15");
        const handle = container.querySelectorAll("div")[2];
        expect(handle.textContent).toBe("15");
        const midpoint = parseFloat(handle.style.left);
        await act(async () => moveTo?.(0));
        const start = parseFloat(handle.style.left);
        await act(async () => moveTo?.(30));
        const end = parseFloat(handle.style.left);
        expect(midpoint).toBeCloseTo((start + end) / 2);
        await act(async () => moveTo?.(15));
        await act(async () => refresh?.());
        expect(moveToFrame).toHaveBeenCalledWith(15, expect.any(Number), expect.any(Number), false);
        await act(async () => root.unmount());
    });

    it("uses the live playback frame when changing direction and pausing", async () => {
        let currentFrame = 0;
        const playback = { play: vi.fn(), stop: vi.fn(), moveToFrame: vi.fn(), getCurrentFrame: () => currentFrame };
        const source: ICurveEditorSource = {
            animations: [],
            initialActiveAnimations: [],
            playback,
            clipDuration: 0,
            capabilities: {
                canEditClipLength: false,
                canDeleteBoundaryKeys: true,
                canEditBoundaryKeyFrames: true,
                canDeleteLastKey: false,
                constrainKeyFrames: true,
            },
        };
        let play: ((forward: boolean) => void) | undefined;
        let stop: (() => void) | undefined;
        const Probe = () => {
            const { state, actions } = useCurveEditor();
            play = actions.play;
            stop = actions.stop;
            return <output>{state.activeFrame}</output>;
        };
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <CurveEditorProvider source={source}>
                    <Probe />
                </CurveEditorProvider>
            )
        );
        await act(async () => play?.(true));
        currentFrame = 30;
        await act(async () => play?.(false));
        expect(playback.play).toHaveBeenLastCalledWith(false, expect.any(Number), expect.any(Number), 30);
        currentFrame = 42;
        await act(async () => stop?.());
        expect(container.querySelector("output")?.textContent).toBe("42");
        await act(async () => play?.(true));
        expect(playback.play).toHaveBeenLastCalledWith(true, expect.any(Number), expect.any(Number), 42);
        await act(async () => root.unmount());
    });

    it("deletes selected keys from the same native track after it is toggled", async () => {
        const native = new Animation("track", "value", 30, Animation.ANIMATIONTYPE_FLOAT);
        native.setKeys([0, 10, 20, 30, 40].map((frame) => ({ frame, value: frame })));
        const first = CreateBabylonCurveEditorAnimation(native)!;
        const second = CreateBabylonCurveEditorAnimation(native)!;
        const source: ICurveEditorSource = {
            animations: [first],
            initialActiveAnimations: [first],
            playback: { play: () => {}, stop: () => {}, moveToFrame: () => {}, getCurrentFrame: () => 0 },
            clipDuration: 40,
            capabilities: {
                canEditClipLength: true,
                canDeleteBoundaryKeys: true,
                canEditBoundaryKeyFrames: true,
                canDeleteLastKey: true,
                constrainKeyFrames: false,
            },
        };
        let context!: ReturnType<typeof useCurveEditor>;
        const Probe = () => {
            context = useCurveEditor();
            return null;
        };
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <CurveEditorProvider source={source}>
                    <Probe />
                    <Graph width={300} height={200} />
                </CurveEditorProvider>
            )
        );
        await act(async () => context.actions.setActiveKeyPoints([{ curve: new CurveData("#fff", first), keyId: 1 }]));
        await act(async () => context.actions.setActiveCurveAnimations([]));
        await act(async () => context.actions.setActiveCurveAnimations([second]));
        await act(async () => context.actions.setActiveKeyPoints((previous) => [...(previous ?? []), { curve: new CurveData("#fff", second), keyId: 2 }]));
        await act(async () => context.observables.onDeleteKeyActiveKeyPoints.notifyObservers());
        expect(native.getKeys().map((key) => key.frame)).toEqual([0, 30, 40]);
        await act(async () => root.unmount());
    });

    it("keeps quaternion points out of bulk selections", async () => {
        const translation = new Animation("translation", "x", 30, Animation.ANIMATIONTYPE_FLOAT);
        translation.setKeys([
            { frame: 0, value: 0 },
            { frame: 10, value: 1 },
        ]);
        const rotation = new Animation("rotation", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION);
        rotation.setKeys([
            { frame: 0, value: new Quaternion(0, 0, 0, 1) },
            { frame: 10, value: new Quaternion(0, 1, 0, 0) },
        ]);
        const animations = [CreateBabylonCurveEditorAnimation(translation)!, CreateBabylonCurveEditorAnimation(rotation)!];
        const source: ICurveEditorSource = {
            animations,
            initialActiveAnimations: animations,
            playback: { play: () => {}, stop: () => {}, moveToFrame: () => {}, getCurrentFrame: () => 0 },
            clipDuration: 10,
            capabilities: {
                canEditClipLength: false,
                canDeleteBoundaryKeys: true,
                canEditBoundaryKeyFrames: true,
                canDeleteLastKey: false,
                constrainKeyFrames: true,
            },
        };
        let context!: ReturnType<typeof useCurveEditor>;
        const Probe = () => {
            context = useCurveEditor();
            return null;
        };
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <CurveEditorProvider source={source}>
                    <Probe />
                    <Graph width={300} height={200} />
                </CurveEditorProvider>
            )
        );
        await act(async () => context.actions.prepare());
        await act(async () => context.observables.onSelectAllKeys.notifyObservers());
        expect(context.state.activeKeyPoints).toHaveLength(2);
        expect(context.state.activeKeyPoints?.every((point) => point.curve.animation.source === translation)).toBe(true);
        await act(async () => context.observables.onMainKeyPointMoved.notifyObservers({ x: 150, y: 120 }));
        expect(rotation.getKeys().map((key) => key.value.asArray())).toEqual([
            [0, 0, 0, 1],
            [0, 1, 0, 0],
        ]);
        await act(async () => root.unmount());
    });

    it.each([
        ["positive", (gradient: number) => gradient + 0.8 * Math.sin(Math.PI * gradient), 13],
        ["negative", (gradient: number) => gradient - 0.8 * Math.sin(Math.PI * gradient), -3],
    ] as const)("fits %s easing overshoot in the graph", async (_direction, easing, midpoint) => {
        const { source } = CreateEasedLiteSource(easing);
        let context!: ReturnType<typeof useCurveEditor>;
        const Probe = () => {
            context = useCurveEditor();
            return null;
        };
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <CurveEditorProvider source={source}>
                    <Probe />
                    <Graph width={300} height={200} />
                </CurveEditorProvider>
            )
        );
        await act(async () => context.actions.prepare());
        const path = container.querySelector("svg svg path")?.getAttribute("d");
        expect(path).toBeDefined();
        const points = Array.from(path!.matchAll(/[ML]\s*([-+\d.eE]+)\s+([-+\d.eE]+)/g), ([, , value]) => Number(value));
        expect(points.length).toBeGreaterThan(2);
        expect(source.animations[0].evaluate(15)[0]).toBeCloseTo(midpoint);
        expect(Math.min(...points)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...points)).toBeLessThanOrEqual(200);
        await act(async () => root.unmount());
    });

    it("refits eased curves after editing a key", async () => {
        const { source } = CreateEasedLiteSource((gradient) => gradient + 0.8 * Math.sin(Math.PI * gradient));
        let context!: ReturnType<typeof useCurveEditor>;
        const Probe = () => {
            context = useCurveEditor();
            return null;
        };
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <CurveEditorProvider source={source}>
                    <Probe />
                    <Graph width={300} height={200} />
                </CurveEditorProvider>
            )
        );
        await act(async () => context.actions.prepare());
        await act(async () => context.observables.onSelectAllKeys.notifyObservers());
        const point = context.state.activeKeyPoints?.find((key) => key.keyId === 1);
        expect(point).toBeDefined();
        await act(async () => point!.curve.updateKeyValue(1, 100));

        const values = () =>
            Array.from(
                container
                    .querySelector("svg svg path")!
                    .getAttribute("d")!
                    .matchAll(/[ML]\s*([-+\d.eE]+)\s+([-+\d.eE]+)/g),
                ([, , value]) => Number(value)
            );
        expect(Math.min(...values())).toBeLessThan(0);
        await act(async () => context.observables.onFrameRequired.notifyObservers());
        expect(Math.min(...values())).toBeGreaterThanOrEqual(0);
        expect(Math.max(...values())).toBeLessThanOrEqual(200);
        await act(async () => root.unmount());
    });

    it("inserts a key using the current eased Lite value", async () => {
        const { target, group, source } = CreateEasedLiteSource((gradient) => gradient * gradient, 15);
        let context!: ReturnType<typeof useCurveEditor>;
        const Probe = () => {
            context = useCurveEditor();
            return null;
        };
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <CurveEditorProvider source={source}>
                    <Probe />
                    <Graph width={300} height={200} />
                </CurveEditorProvider>
            )
        );
        await act(async () => context.actions.prepare());
        await act(async () => context.observables.onCreateOrUpdateKeyPointRequired.notifyObservers());
        const keys = getAnimationGroupTracks(group)[0].keys;
        expect(keys.map((key) => key.time)).toEqual([0, 0.5, 1]);
        expect(keys[1].value[0]).toBeCloseTo(2.5);
        expect(target.value).toBeCloseTo(2.5);
        await act(async () => root.unmount());
    });

    it("keeps end-of-range insertion in the clip and updates key markers", async () => {
        const native = new Animation("track", "value", 30, Animation.ANIMATIONTYPE_FLOAT);
        native.setKeys([
            { frame: 0, value: 0 },
            { frame: 20, value: 20 },
        ]);
        const animation = CreateBabylonCurveEditorAnimation(native)!;
        const source: ICurveEditorSource = {
            animations: [animation],
            initialActiveAnimations: [animation],
            playback: { play: () => {}, stop: () => {}, moveToFrame: () => {}, getCurrentFrame: () => 0 },
            clipDuration: 30.75,
            capabilities: {
                canEditClipLength: false,
                canDeleteBoundaryKeys: true,
                canEditBoundaryKeyFrames: true,
                canDeleteLastKey: false,
                constrainKeyFrames: true,
            },
        };
        let context!: ReturnType<typeof useCurveEditor>;
        const Probe = () => {
            context = useCurveEditor();
            return null;
        };
        const root = createRoot(container);
        const widthDescriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, "clientWidth");
        Object.defineProperty(SVGElement.prototype, "clientWidth", { configurable: true, get: () => 300 });
        try {
            await act(async () =>
                root.render(
                    <CurveEditorProvider source={source}>
                        <Probe />
                        <RangeFrameBar width={300} />
                        <Graph width={300} height={200} />
                    </CurveEditorProvider>
                )
            );
            await act(async () => context.actions.prepare());
            const svg = container.querySelector("svg")!;
            const bar = svg.parentElement!;
            bar.setPointerCapture = () => {};
            const markerPositions = () => [...svg.querySelectorAll('line[y1="0"][y2="40"]')].map((line) => Number(line.getAttribute("x1")));
            expect(markerPositions()).toHaveLength(3);
            const event = new MouseEvent("pointerdown", { bubbles: true });
            Object.defineProperty(event, "offsetX", { value: 300 });
            await act(async () => bar.dispatchEvent(event));
            expect(context.state.activeFrame).toBe(30.75);
            await act(async () => context.observables.onCreateOrUpdateKeyPointRequired.notifyObservers());
            const inserted = native.getKeys().at(-1)!.frame;
            expect(inserted).toBeLessThanOrEqual(30.75);
            expect(Math.fround(inserted / 30)).toBeLessThanOrEqual(30.75 / 30);
            expect(markerPositions()).toHaveLength(4);
            const keys = animation.getKeys();
            keys[1].frame = 10;
            animation.setKeys(keys);
            await act(async () => context.observables.onActiveKeyDataChanged.notifyObservers(1));
            expect(markerPositions()).toContain((10 / 30.75) * 300);
            keys.splice(1, 1);
            animation.setKeys(keys);
            await act(async () => context.observables.onActiveAnimationChanged.notifyObservers({}));
            expect(markerPositions()).toHaveLength(3);
        } finally {
            await act(async () => root.unmount());
            if (widthDescriptor) {
                Object.defineProperty(SVGElement.prototype, "clientWidth", widthDescriptor);
            } else {
                Reflect.deleteProperty(SVGElement.prototype, "clientWidth");
            }
        }
    });
});
