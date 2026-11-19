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

import { ClampFrameToClip, ClampKeyFrame, CurveData, MoveSelectedKeyFrames } from "../../src/components/curveEditor/canvas/curveData";
import { CreateLiteCurveEditorAnimations, CreateLiteCurveEditorPlayback, type LiteCurveKey } from "../../src/lite/components/curveEditor/curveEditorSource";

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
    it("retains a valid frame when neighbors leave no interval and clamps Float32 clip ends", () => {
        const { animation } = CreateAdapter(
            "linear",
            [0, 0.001, 0.002].map((time) => ({ time, value: [time] }))
        );
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation.getKeys().map((key) => ({ frame: key.frame, value: key.value[0], lockedTangent: true }));
        expect(ClampKeyFrame(curve, 1, 0, 0, 60, 0.1, true)).toBe(curve.keys[1].frame);
        const end = 30.75;
        const clamped = ClampFrameToClip(31, end, 30);
        expect(clamped).toBeLessThanOrEqual(end);
        expect(Math.fround(clamped / 30)).toBeLessThanOrEqual(end / 30);
    });

    it("restores only a playback speed override owned by the editor", () => {
        const group = { frameRate: 30, currentTime: 0, isPlaying: false, speedRatio: 2 } as unknown as AnimationGroup;
        const playback = CreateLiteCurveEditorPlayback(group, engine);
        playback.play(false, 0, 30, 0);
        expect(group.speedRatio).toBe(-2);
        playback.dispose?.();
        expect(group.speedRatio).toBe(2);
        playback.play(false, 0, 30, 0);
        group.speedRatio = 3;
        playback.dispose?.();
        expect(group.speedRatio).toBe(3);
    });

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
            { time: 2, value: [5] },
        ]);
        expect(step.animation.evaluate(15)).toEqual([1]);
        expect(step.animation.evaluate(30)).toEqual([3]);
        expect(step.animation.evaluate(45)).toEqual([3]);

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

    it("samples a curve from one snapshot and refreshes the snapshot after edits", () => {
        const group = {
            frameRate: 30,
            currentTime: 0,
            isPlaying: true,
            targetedAnimations: [{ path: "value" }],
        } as unknown as AnimationGroup;
        let keys: readonly LiteCurveKey[] = [
            { time: 0, value: [0], inTangent: [0], outTangent: [0] },
            { time: 1, value: [10], inTangent: [0], outTangent: [0] },
        ];
        const getAnimationGroupTracks = vi.fn(() => [{ target: group.targetedAnimations[0], interpolation: "cubicSpline", componentCount: 1, quaternion: false, keys }]);
        const [animation] = CreateLiteCurveEditorAnimations(group, engine, {
            getAnimationGroupTracks,
            setAnimationTrackKeys: (_group, _index, nextKeys) => {
                keys = nextKeys;
            },
        });
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation.getKeys().map((key) => ({
            frame: key.frame,
            value: key.value[0],
            inTangent: key.inTangent?.[0],
            outTangent: key.outTangent?.[0],
            lockedTangent: key.lockedTangent,
        }));
        getAnimationGroupTracks.mockClear();
        const before = curve.getPathData(
            (value) => value,
            (value) => value
        );
        expect(getAnimationGroupTracks).toHaveBeenCalledTimes(1);

        const edited = animation.getKeys();
        edited[1].value = [20];
        animation.setKeys(edited);
        const after = curve.getPathData(
            (value) => value,
            (value) => value
        );
        expect(after).not.toBe(before);
    });

    it("samples long tracks without rescanning preceding keys", () => {
        let accesses = 0;
        const keys = new Proxy(
            Array.from({ length: 300 }, (_, index) => ({ time: index, value: [index], inTangent: [1], outTangent: [1] })),
            {
                get: (target, property, receiver) => {
                    if (typeof property === "string" && /^\d+$/.test(property)) {
                        accesses++;
                    }
                    return Reflect.get(target, property, receiver);
                },
            }
        );
        const group = { frameRate: 30, targetedAnimations: [{ path: "a" }, { path: "b" }] } as unknown as AnimationGroup;
        const animations = CreateLiteCurveEditorAnimations(group, engine, {
            getAnimationGroupTracks: () => group.targetedAnimations.map((target) => ({ target, interpolation: "cubicSpline", componentCount: 1, quaternion: false, keys })),
            setAnimationTrackKeys: () => {},
        });
        const curves = animations.map((animation) => {
            const curve = new CurveData("#fff", animation, 0);
            curve.keys = animation
                .getKeys()
                .map((key) => ({ frame: key.frame, value: key.value[0], inTangent: key.inTangent?.[0], outTangent: key.outTangent?.[0], lockedTangent: true }));
            return curve;
        });
        accesses = 0;
        curves.forEach((curve) =>
            curve.getPathData(
                (frame) => frame,
                (value) => value
            )
        );
        expect(accesses).toBeLessThan(300 * CurveData.SampleRate * curves.length * 10);
        expect(animations[0].evaluate(123.5 * 30)[0]).toBeCloseTo(123.5);
    });

    it("clamps selected keys as a group and commits each track once", () => {
        const { animation, setAnimationTrackKeys } = CreateAdapter(
            "linear",
            [0, 10, 20, 21, 30].map((frame) => ({ time: frame / 30, value: [frame] }))
        );
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation.getKeys().map((key) => ({ frame: key.frame, value: key.value[0], lockedTangent: key.lockedTangent }));
        const delta = MoveSelectedKeyFrames(
            [
                { curve, keyId: 1 },
                { curve, keyId: 2 },
            ],
            5,
            0,
            60,
            0.01,
            false,
            false
        );

        expect(delta).toBeCloseTo(0.99);
        expect(setAnimationTrackKeys).toHaveBeenCalledTimes(1);
        expect(animation.getKeys().map((key) => key.frame)).toEqual([0, expect.closeTo(10.99), expect.closeTo(20.99), 21, 30]);
    });

    it("moves adjacent selected keys together without treating them as obstacles", () => {
        const { animation, setAnimationTrackKeys } = CreateAdapter(
            "linear",
            [0, 10, 20, 21, 30].map((frame) => ({ time: frame / 30, value: [frame] }))
        );
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation.getKeys().map((key) => ({ frame: key.frame, value: key.value[0], lockedTangent: key.lockedTangent }));
        const delta = MoveSelectedKeyFrames(
            [
                { curve, keyId: 1 },
                { curve, keyId: 2 },
                { curve, keyId: 3 },
            ],
            5,
            0,
            60,
            0.01,
            false,
            false
        );

        expect(delta).toBe(5);
        expect(setAnimationTrackKeys).toHaveBeenCalledTimes(1);
        expect(animation.getKeys().map((key) => key.frame)).toEqual([0, 15, 25, 26, 30]);
    });

    it("moves adjacent keys through the real Lite track validation", () => {
        const manager = createAnimationManager();
        const clip = createPropertyAnimationClip("Test", [{ path: "value", keys: [0, 10, 20, 21, 30].map((frame) => ({ frame, value: frame })) }], { frameRate: 30 });
        const group = createPropertyAnimationGroup(manager, { value: 0 }, clip);
        const scene = { _kind: "scene", animationGroups: [group] };
        const realEngine = { surfaces: [], _renderingContexts: [scene] } as unknown as EngineContext;
        (realEngine as { surfaces: readonly EngineContext[] }).surfaces = [realEngine];
        const [animation] = CreateLiteCurveEditorAnimations(group, realEngine, { getAnimationGroupTracks, setAnimationTrackKeys });
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation.getKeys().map((key) => ({ frame: key.frame, value: key.value[0], lockedTangent: key.lockedTangent }));

        const delta = MoveSelectedKeyFrames(
            [
                { curve, keyId: 1 },
                { curve, keyId: 2 },
                { curve, keyId: 3 },
            ],
            5,
            0,
            30,
            0.01,
            false,
            false
        );
        expect(delta).toBe(5);
        expect(animation.getKeys().map((key) => key.frame)).toEqual([0, expect.closeTo(15), expect.closeTo(25), expect.closeTo(26), 30]);
    });
});
