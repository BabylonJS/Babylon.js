import {
    createAnimationGroups,
    createAnimationManager,
    createPropertyAnimationClip,
    createPropertyAnimationGroup,
    createTransformNode,
    evaluateAnimationTrack,
    getAnimationGroupTracks,
    goToFrame,
    pauseAnimation,
    setAnimationTrackKeys,
    type AnimationEasing,
    type AnimationGroup,
    type EngineContext,
} from "@babylonjs/lite";
import { describe, expect, it, vi } from "vitest";

import { ClampFrameToClip, ClampKeyFrame, CurveData, MoveSelectedKeyFrames } from "../../src/components/curveEditor/canvas/curveData";
import { CreateLiteCurveEditorAnimations, CreateLiteCurveEditorPlayback, type LiteCurveKey } from "../../src/lite/components/curveEditor/curveEditorSource";

const engine = {} as EngineContext;
const LiteApi = { evaluateAnimationTrack, getAnimationGroupTracks, setAnimationTrackKeys };

function CreateAdapter(
    interpolation: "linear" | "step" | "cubicSpline",
    values: {
        time: number;
        value: readonly number[];
        inTangent?: readonly number[];
        outTangent?: readonly number[];
    }[],
    options: { frameRate?: number; quaternion?: boolean; isPlaying?: boolean; easing?: AnimationEasing } = {}
) {
    const frameRate = options.frameRate ?? 30;
    let group: AnimationGroup;
    if (options.easing && interpolation !== "cubicSpline") {
        const clip = createPropertyAnimationClip(
            "Test",
            [
                {
                    path: "value",
                    interpolation,
                    quaternion: options.quaternion,
                    easing: options.easing,
                    keys: values.map(({ time, value }) => ({ time, value: value.length === 1 ? value[0] : value })),
                },
            ],
            { frameRate }
        );
        group = createPropertyAnimationGroup(createAnimationManager(), { value: 0 }, clip, clip.duration === 0 ? { toTime: 1 } : undefined);
    } else {
        const output = values.flatMap(({ value, inTangent, outTangent }) =>
            interpolation === "cubicSpline" ? [...(inTangent ?? value.map(() => 0)), ...value, ...(outTangent ?? value.map(() => 0))] : [...value]
        );
        [group] = createAnimationGroups({
            clips: [
                {
                    name: "Test",
                    duration: Math.max(2, values[values.length - 1]?.time ?? 0),
                    frameRate,
                    channels: [{ samplerIdx: 0, nodeIdx: 0, path: options.quaternion ? 1 : 0 }],
                    samplers: [
                        {
                            input: new Float32Array(values.map(({ time }) => time)),
                            output: new Float32Array(output),
                            interpolation: interpolation === "step" ? 1 : interpolation === "cubicSpline" ? 2 : 0,
                        },
                    ],
                },
            ],
            nodes: [{ parentIdx: -1, tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, rw: 1, sx: 1, sy: 1, sz: 1 }],
            skeletons: [],
            morphBindings: [],
            nodeTargets: [createTransformNode("Track")],
            nodeNames: ["Track"],
            excludedNodeIndices: new Set<number>(),
        });
    }
    group.isPlaying = options.isPlaying ?? true;
    const getTracks = vi.fn(getAnimationGroupTracks);
    const setKeys = vi.fn((group: AnimationGroup, trackIndex: number, nextKeys: readonly LiteCurveKey[]) => setAnimationTrackKeys(group, trackIndex, nextKeys));
    const animations = CreateLiteCurveEditorAnimations(group, engine, {
        evaluateAnimationTrack,
        getAnimationGroupTracks: getTracks,
        setAnimationTrackKeys: setKeys,
    });
    return { animation: animations[0], getTracks, setAnimationTrackKeys: setKeys };
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
            getAnimationGroupTracks: () =>
                [{ target: { path: "value" }, source: "property", sharedSampler: false, interpolation: "unknown", componentCount: 1, quaternion: false, keys: [] }] as const,
            evaluateAnimationTrack: vi.fn(() => []),
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
        const engineData = { surfaces: [] as object[], _renderingContexts: [scene] };
        engineData.surfaces.push(engineData);
        const realEngine = engineData as unknown as EngineContext;
        goToFrame(group, 30, realEngine);
        pauseAnimation(group);

        const [animation] = CreateLiteCurveEditorAnimations(group, realEngine, LiteApi);
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

    it("matches Lite property easing for scalar, vector, quaternion, and step tracks", () => {
        const receivers: unknown[] = [];
        function easing(this: unknown, gradient: number) {
            receivers.push(this);
            return gradient * gradient;
        }
        const stepEasing = vi.fn(easing);
        const target = { value: 0, vector: { x: 0, y: 0, z: 0 }, rotationQuaternion: { x: 0, y: 0, z: 0, w: 1 }, stepped: 0 };
        const clip = createPropertyAnimationClip(
            "Eased",
            [
                {
                    path: "value",
                    easing,
                    keys: [
                        { frame: 0, value: 0 },
                        { frame: 30, value: 10 },
                        { frame: 60, value: 20 },
                    ],
                },
                {
                    path: "vector",
                    easing,
                    keys: [
                        { frame: 0, value: [0, 2, 4] },
                        { frame: 30, value: [4, 10, 12] },
                        { frame: 60, value: [8, 18, 20] },
                    ],
                },
                {
                    path: "rotationQuaternion",
                    easing,
                    keys: [
                        { frame: 0, value: [0, 0, 0, 1] },
                        { frame: 30, value: [0, 0, Math.SQRT1_2, Math.SQRT1_2] },
                        { frame: 60, value: [0, 0, 1, 0] },
                    ],
                },
                {
                    path: "stepped",
                    interpolation: "step",
                    easing: stepEasing,
                    keys: [
                        { frame: 0, value: 0 },
                        { frame: 30, value: 10 },
                        { frame: 60, value: 20 },
                    ],
                },
            ],
            { frameRate: 30 }
        );
        const group = createPropertyAnimationGroup(createAnimationManager(), target, clip);
        const scene = { _kind: "scene", animationGroups: [group] };
        const engineData = { surfaces: [] as object[], _renderingContexts: [scene] };
        engineData.surfaces.push(engineData);
        const realEngine = engineData as unknown as EngineContext;
        const tracks = getAnimationGroupTracks(group);
        expect(tracks[0].easing).toBe(easing);
        expect(tracks[3].easing).toBe(stepEasing);
        const [scalar, vector, quaternion, step] = CreateLiteCurveEditorAnimations(group, realEngine, LiteApi);

        for (const frame of [15, 45, (1 - 2 ** -26) * 30, 0, 60]) {
            goToFrame(group, frame, realEngine);
            expect(scalar.evaluate(frame)[0]).toBeCloseTo(target.value);
            expect(vector.evaluate(frame)).toEqual([expect.closeTo(target.vector.x), expect.closeTo(target.vector.y), expect.closeTo(target.vector.z)]);
            expect(quaternion.evaluate(frame)).toEqual([
                expect.closeTo(target.rotationQuaternion.x),
                expect.closeTo(target.rotationQuaternion.y),
                expect.closeTo(target.rotationQuaternion.z),
                expect.closeTo(target.rotationQuaternion.w),
            ]);
            expect(step.evaluate(frame)[0]).toBe(target.stepped);
        }
        expect(stepEasing).not.toHaveBeenCalled();
        expect(receivers.length).toBeGreaterThan(0);
        expect(receivers.every((receiver) => receiver === undefined)).toBe(true);
    });

    it("preserves easing overshoot for scalar and near-aligned quaternion tracks", () => {
        const easing = (gradient: number) => gradient * 200;
        const target = { value: 0, rotationQuaternion: { x: 0, y: 0, z: 0, w: 1 }, otherRotation: { x: 0, y: 0, z: 0, w: 1.1 } };
        const clip = createPropertyAnimationClip(
            "Overshoot",
            [
                {
                    path: "value",
                    easing,
                    keys: [
                        { frame: 0, value: 0 },
                        { frame: 30, value: 10 },
                    ],
                },
                {
                    path: "rotationQuaternion",
                    easing,
                    keys: [
                        { frame: 0, value: [0, 0, 0, 1] },
                        { frame: 30, value: [0, 0, -Math.sin(0.01), -Math.cos(0.01)] },
                    ],
                },
                {
                    path: "otherRotation",
                    easing,
                    quaternion: true,
                    keys: [
                        { frame: 0, value: [0, 0, 0, 1.1] },
                        { frame: 30, value: [0, 0, 0.001, 1.1] },
                    ],
                },
            ],
            { frameRate: 30 }
        );
        const group = createPropertyAnimationGroup(createAnimationManager(), target, clip);
        const scene = { _kind: "scene", animationGroups: [group] };
        const engineData = { surfaces: [] as object[], _renderingContexts: [scene] };
        engineData.surfaces.push(engineData);
        const realEngine = engineData as unknown as EngineContext;
        const [scalar, quaternion, otherQuaternion] = CreateLiteCurveEditorAnimations(group, realEngine, LiteApi);
        goToFrame(group, 15, realEngine);

        expect(target.value).toBe(1000);
        expect(scalar.evaluate(15)[0]).toBeCloseTo(target.value);
        expect(quaternion.evaluate(15)[2]).toBeCloseTo(target.rotationQuaternion.z);
        expect(quaternion.evaluate(15)[3]).toBeCloseTo(target.rotationQuaternion.w);
        expect(otherQuaternion.evaluate(15)[2]).toBeCloseTo(target.otherRotation.z);
        expect(otherQuaternion.evaluate(15)[3]).toBeCloseTo(target.otherRotation.w);
    });

    it("matches playback for non-eased property quaternion tracks", () => {
        const target = { rotationQuaternion: { x: 0, y: 0, z: 0, w: 1.1 } };
        const clip = createPropertyAnimationClip(
            "Quaternion",
            [
                {
                    path: "rotationQuaternion",
                    quaternion: true,
                    keys: [
                        { frame: 0, value: [0, 0, 0, 1.1] },
                        { frame: 30, value: [0, 0, 0.001, 1.1] },
                    ],
                },
            ],
            { frameRate: 30 }
        );
        const group = createPropertyAnimationGroup(createAnimationManager(), target, clip);
        const scene = { _kind: "scene", animationGroups: [group] };
        const engineData = { surfaces: [] as object[], _renderingContexts: [scene] };
        engineData.surfaces.push(engineData);
        const realEngine = engineData as unknown as EngineContext;
        const [animation] = CreateLiteCurveEditorAnimations(group, realEngine, LiteApi);
        goToFrame(group, 15, realEngine);

        expect(animation.evaluate(15)).toEqual([
            expect.closeTo(target.rotationQuaternion.x),
            expect.closeTo(target.rotationQuaternion.y),
            expect.closeTo(target.rotationQuaternion.z),
            expect.closeTo(target.rotationQuaternion.w),
        ]);
        expect(target.rotationQuaternion.w).toBeCloseTo(1.1);
    });

    it("samples eased linear paths and ignores easing for step and cubic segments", () => {
        const easing = vi.fn((gradient: number) => gradient * gradient);
        const values = [
            { time: 0, value: [0] },
            { time: 1, value: [10] },
        ];
        const { animation } = CreateAdapter("linear", values, { easing });
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation.getKeys().map((key) => ({ frame: key.frame, value: key.value[0], lockedTangent: key.lockedTangent }));
        const path = curve.getPathData(
            (frame) => frame,
            (value) => value
        );
        const points = Array.from(path.matchAll(/[ML]\s*([-+\d.eE]+)\s+([-+\d.eE]+)/g), ([, frame, value]) => [Number(frame), Number(value)]);
        const midpoint = points.find(([frame]) => Math.abs(frame - 15) < 0.0001);
        expect(midpoint?.[1]).toBeCloseTo(2.5);

        easing.mockClear();
        expect(animation.evaluate(0)).toEqual([0]);
        expect(animation.evaluate(30)).toEqual([10]);
        expect(CreateAdapter("linear", [values[0]], { easing }).animation.evaluate(15)).toEqual([0]);
        expect(CreateAdapter("step", values, { easing }).animation.evaluate(15)).toEqual([0]);
        expect(CreateAdapter("cubicSpline", values).animation.evaluate(15)).toEqual([5]);
        expect(easing).not.toHaveBeenCalled();
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

    it("samples through Lite without repeatedly snapshotting tracks and reflects edits", () => {
        const { animation, getTracks } = CreateAdapter("cubicSpline", [
            { time: 0, value: [0], inTangent: [0], outTangent: [0] },
            { time: 1, value: [10], inTangent: [0], outTangent: [0] },
        ]);
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation.getKeys().map((key) => ({
            frame: key.frame,
            value: key.value[0],
            inTangent: key.inTangent?.[0],
            outTangent: key.outTangent?.[0],
            lockedTangent: key.lockedTangent,
        }));
        getTracks.mockClear();
        const before = curve.getPathData(
            (value) => value,
            (value) => value
        );
        expect(getTracks).not.toHaveBeenCalled();

        const edited = animation.getKeys();
        edited[1].value = [20];
        animation.setKeys(edited);
        curve.keys[1].value = 20;
        getTracks.mockClear();
        const after = curve.getPathData(
            (value) => value,
            (value) => value
        );
        expect(getTracks).not.toHaveBeenCalled();
        expect(after).not.toBe(before);
        expect(animation.evaluate(15)[0]).toBeCloseTo(10);
    });

    it("samples long tracks without rebuilding track snapshots", () => {
        const { animation, getTracks } = CreateAdapter(
            "cubicSpline",
            Array.from({ length: 300 }, (_, index) => ({ time: index, value: [index], inTangent: [1], outTangent: [1] }))
        );
        const curve = new CurveData("#fff", animation, 0);
        curve.keys = animation
            .getKeys()
            .map((key) => ({ frame: key.frame, value: key.value[0], inTangent: key.inTangent?.[0], outTangent: key.outTangent?.[0], lockedTangent: true }));
        getTracks.mockClear();
        curve.getPathData(
            (frame) => frame,
            (value) => value
        );
        expect(getTracks).not.toHaveBeenCalled();
        expect(animation.evaluate(123.5 * 30)[0]).toBeCloseTo(123.5);
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
        expect(animation.getKeys().map((key) => key.frame)).toEqual([0, expect.closeTo(10.99), expect.closeTo(20.99), expect.closeTo(21), 30]);
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
        expect(animation.getKeys().map((key) => key.frame)).toEqual([0, expect.closeTo(15), expect.closeTo(25), expect.closeTo(26), 30]);
    });

    it("moves adjacent keys through the real Lite track validation", () => {
        const manager = createAnimationManager();
        const clip = createPropertyAnimationClip("Test", [{ path: "value", keys: [0, 10, 20, 21, 30].map((frame) => ({ frame, value: frame })) }], { frameRate: 30 });
        const group = createPropertyAnimationGroup(manager, { value: 0 }, clip);
        const scene = { _kind: "scene", animationGroups: [group] };
        const engineData = { surfaces: [] as object[], _renderingContexts: [scene] };
        engineData.surfaces.push(engineData);
        const realEngine = engineData as unknown as EngineContext;
        const [animation] = CreateLiteCurveEditorAnimations(group, realEngine, LiteApi);
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
