import {
    createAnimationManager,
    createPropertyAnimationClip,
    createPropertyAnimationGroup,
    getAnimationGroupTracks,
    goToFrame,
    pauseAnimation,
    setAnimationTrackKeys,
    type AnimationGroup,
    type EngineContext,
    type TargetedAnimation,
} from "@babylonjs/lite";
import { describe, expect, it, vi } from "vitest";

import { CreateLiteCurveEditorAnimations, type LiteCurveKey } from "../../src/lite/components/curveEditor/curveEditorSource";

const engine = {} as EngineContext;

function CreateAdapter(
    interpolation: "linear" | "step" | "cubicSpline",
    values: {
        time: number;
        value: readonly number[];
        inTangent?: readonly number[];
        outTangent?: readonly number[];
    }[],
    options: { frameRate?: number; quaternion?: boolean; isPlaying?: boolean } = {}
) {
    const group = {
        name: "Test",
        duration: 2,
        frameRate: options.frameRate ?? 30,
        currentTime: 0.5,
        isPlaying: options.isPlaying ?? true,
        speedRatio: 1,
        targetedAnimations: [{ path: "value" }],
    } as unknown as AnimationGroup;
    let keys: readonly LiteCurveKey[] = values;
    const setAnimationTrackKeys = vi.fn((_group: AnimationGroup, _trackIndex: number, nextKeys: readonly LiteCurveKey[]) => {
        keys = nextKeys;
    });
    const animations = CreateLiteCurveEditorAnimations(group, engine, {
        getAnimationGroupTracks: () => [
            {
                target: group.targetedAnimations[0] as TargetedAnimation,
                interpolation,
                componentCount: values[0]?.value.length ?? (options.quaternion ? 4 : 1),
                quaternion: options.quaternion ?? false,
                keys,
            },
        ],
        setAnimationTrackKeys,
    });
    return { animation: animations[0], setAnimationTrackKeys };
}

describe("Lite curve editor adapter", () => {
    it("rejects unsupported interpolation rather than displaying a linear curve", () => {
        const group = {} as AnimationGroup;
        const api = {
            getAnimationGroupTracks: () => [{ target: { path: "value" }, interpolation: "unknown", componentCount: 1, quaternion: false, keys: [] }],
            setAnimationTrackKeys: vi.fn(),
        };
        expect(() => CreateLiteCurveEditorAnimations(group, engine, api)).toThrow("Unsupported animation interpolation: unknown");
    });

    it("edits a real Lite property animation and refreshes its paused pose", () => {
        const manager = createAnimationManager();
        const target = { value: 0 };
        const clip = createPropertyAnimationClip(
            "Test",
            [
                {
                    path: "value",
                    keys: [
                        { frame: 0, value: 0 },
                        { frame: 60, value: 10 },
                    ],
                },
            ],
            { frameRate: 30 }
        );
        const group = createPropertyAnimationGroup(manager, target, clip);
        const scene = { _kind: "scene", animationGroups: [group] };
        const realEngine = { surfaces: [], _renderingContexts: [scene] } as unknown as EngineContext;
        (realEngine as { surfaces: readonly EngineContext[] }).surfaces = [realEngine];
        goToFrame(group, 30, realEngine);
        pauseAnimation(group);

        const [animation] = CreateLiteCurveEditorAnimations(group, realEngine, { getAnimationGroupTracks, setAnimationTrackKeys });
        const keys = animation.getKeys();
        keys[1].value = [20];
        animation.setKeys(keys);

        expect(getAnimationGroupTracks(group)[0].keys[1].value).toEqual([20]);
        expect(target.value).toBe(10);
        expect(group.isPlaying).toBe(false);
    });

    it("evaluates step and linear quaternion tracks using their track interpolation", () => {
        const step = CreateAdapter("step", [
            { time: 0, value: [1] },
            { time: 1, value: [3] },
        ]);
        expect(step.animation.evaluate(15)).toEqual([1]);

        const quaternion = CreateAdapter(
            "linear",
            [
                { time: 0, value: [0, 0, 0, 1] },
                { time: 1, value: [0, 0, 1, 0] },
            ],
            { quaternion: true }
        );
        const midpoint = quaternion.animation.evaluate(15);
        expect(midpoint[2]).toBeCloseTo(Math.SQRT1_2);
        expect(midpoint[3]).toBeCloseTo(Math.SQRT1_2);
    });

    it("converts cubic tangents between editor frames and seconds when replacing keys", () => {
        const { animation, setAnimationTrackKeys } = CreateAdapter("cubicSpline", [
            { time: 0, value: [0], inTangent: [2], outTangent: [2] },
            { time: 1, value: [10], inTangent: [2], outTangent: [2] },
        ]);

        expect(animation.supportsTangents).toBe(true);
        expect(animation.getKeys()[1].frame).toBe(30);
        expect(animation.getKeys()[0].outTangent?.[0]).toBeCloseTo(2 / 30);
        expect(animation.evaluate(15)[0]).toBeCloseTo(5);

        const editedKeys = animation.getKeys();
        editedKeys[0].outTangent = [1];
        animation.setKeys(editedKeys);

        expect(setAnimationTrackKeys).toHaveBeenCalledWith(expect.anything(), 0, expect.arrayContaining([expect.objectContaining({ time: 0, outTangent: [30], inTangent: [2] })]));
    });
});
