import { goToFrame, pauseAnimation, playAnimation, type AnimationCurveKey, type AnimationCurveTrack, type AnimationGroup, type EngineContext } from "@babylonjs/lite";
import { ChannelColors, DefaultCurveColor } from "../../../components/curveEditor/curveEditorColors";
import {
    CurveEditorInterpolation,
    type CurveEditorComponent,
    type CurveEditorKey,
    type ICurveEditorAnimation,
    type ICurveEditorPlayback,
    type ICurveEditorSource,
} from "../../../components/curveEditor/curveEditorModel";
import { GetAnimationFrameRate, GetTargetedAnimationDisplayName } from "../../animationUtils";

/** Supported interpolation modes exposed by Lite animation tracks. */
export type LiteCurveInterpolation = "linear" | "step" | "cubicSpline";

/** Lite track key shape accepted by the public key-editing API. */
export type LiteCurveKey = AnimationCurveKey;
/** Track shape with interpolation narrowed to modes handled by the adapter. */
export type LiteCurveTrack = AnimationCurveTrack & { readonly interpolation: LiteCurveInterpolation };

export type LiteCurveApi = {
    /** Returns detached snapshots of a group's tracks. */
    getAnimationGroupTracks(group: AnimationGroup): readonly AnimationCurveTrack[];
    /** Replaces keys for one track. */
    setAnimationTrackKeys(group: AnimationGroup, trackIndex: number, keys: readonly LiteCurveKey[]): void;
};

function GetSupportedTrack(track: AnimationCurveTrack): LiteCurveTrack {
    const interpolation = track.interpolation;
    if (interpolation !== "linear" && interpolation !== "step" && interpolation !== "cubicSpline") {
        throw new Error(`Unsupported animation interpolation: ${interpolation}`);
    }
    return { ...track, interpolation };
}

function NormalizeQuaternion(value: readonly number[]): number[] {
    const length = Math.hypot(value[0], value[1], value[2], value[3]);
    return length > 0 ? [value[0] / length, value[1] / length, value[2] / length, value[3] / length] : [...value];
}

function SlerpQuaternion(left: readonly number[], right: readonly number[], amount: number): number[] {
    let dot = left[0] * right[0] + left[1] * right[1] + left[2] * right[2] + left[3] * right[3];
    let target = right;
    if (dot < 0) {
        dot = -dot;
        target = [-right[0], -right[1], -right[2], -right[3]];
    }

    if (dot > 0.9995) {
        return NormalizeQuaternion(left.map((value, index) => value + amount * (target[index] - value)));
    }

    const theta = Math.acos(Math.min(1, dot));
    const sinTheta = Math.sin(theta);
    const leftWeight = Math.sin((1 - amount) * theta) / sinTheta;
    const rightWeight = Math.sin(amount * theta) / sinTheta;
    return NormalizeQuaternion(left.map((value, index) => value * leftWeight + target[index] * rightWeight));
}

function EvaluateTrack(track: LiteCurveTrack, time: number): readonly number[] {
    const keys = track.keys;
    if (keys.length === 0) {
        return new Array<number>(track.componentCount).fill(0);
    }
    if (time <= keys[0].time) {
        return keys[0].value;
    }
    const lastKey = keys[keys.length - 1];
    if (time >= lastKey.time) {
        return lastKey.value;
    }

    let rightIndex = 1;
    while (keys[rightIndex].time <= time) {
        rightIndex++;
    }
    const left = keys[rightIndex - 1];
    const right = keys[rightIndex];
    if (track.interpolation === "step") {
        return left.value;
    }

    const duration = right.time - left.time;
    const amount = (time - left.time) / duration;
    if (track.interpolation === "cubicSpline") {
        const t2 = amount * amount;
        const t3 = t2 * amount;
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + amount;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        const value = left.value.map(
            (component, index) => h00 * component + h10 * duration * (left.outTangent?.[index] ?? 0) + h01 * right.value[index] + h11 * duration * (right.inTangent?.[index] ?? 0)
        );
        return track.quaternion ? NormalizeQuaternion(value) : value;
    }

    if (track.quaternion) {
        return SlerpQuaternion(left.value, right.value, amount);
    }
    return left.value.map((value, index) => value + amount * (right.value[index] - value));
}

function GetComponents(track: LiteCurveTrack): readonly CurveEditorComponent[] {
    const colors = [ChannelColors.X, ChannelColors.Y, ChannelColors.Z, ChannelColors.W];
    return Array.from({ length: track.componentCount }, (_, index) => ({
        name: track.componentCount === 1 ? "Value" : (["X", "Y", "Z", "W"][index] ?? `Component ${index + 1}`),
        color: track.componentCount === 1 ? DefaultCurveColor : (colors[index] ?? DefaultCurveColor),
    }));
}

/**
 * Adapts the Lite group sampler API to the shared curve-editor model.
 * @param group The Lite animation group.
 * @param engine The engine used to refresh paused poses after edits.
 * @param api The public Lite curve API functions.
 * @returns One normalized curve animation for each targeted track.
 */
export function CreateLiteCurveEditorAnimations(group: AnimationGroup, engine: EngineContext, api: LiteCurveApi): ICurveEditorAnimation[] {
    const frameRate = GetAnimationFrameRate(group);
    return api.getAnimationGroupTracks(group).map((track, trackIndex) => {
        const initialTrack = GetSupportedTrack(track);
        let lockedTangentByKey = initialTrack.keys.map(() => true);
        const readTrack = () => GetSupportedTrack(api.getAnimationGroupTracks(group)[trackIndex]);
        const readKeys = (): CurveEditorKey[] => {
            const track = readTrack();
            lockedTangentByKey = track.keys.map((_, index) => lockedTangentByKey[index] ?? true);
            return track.keys.map((key, index) => ({
                frame: key.time * frameRate,
                value: [...key.value],
                inTangent: key.inTangent?.map((value) => value / frameRate),
                outTangent: key.outTangent?.map((value) => value / frameRate),
                lockedTangent: lockedTangentByKey[index],
                interpolation: track.interpolation === "step" ? CurveEditorInterpolation.Step : CurveEditorInterpolation.Linear,
            }));
        };

        return {
            uniqueId: `lite-animation-${trackIndex}`,
            name: GetTargetedAnimationDisplayName(initialTrack.target),
            framePerSecond: frameRate,
            kind: initialTrack.quaternion ? "quaternion" : "components",
            components: GetComponents(initialTrack),
            supportsTangents: initialTrack.interpolation === "cubicSpline",
            supportsInterpolationEditing: false,
            source: initialTrack.target,
            getKeys: readKeys,
            setKeys: (keys) => {
                lockedTangentByKey = keys.map((key) => key.lockedTangent);
                api.setAnimationTrackKeys(
                    group,
                    trackIndex,
                    keys.map((key) => ({
                        time: key.frame / frameRate,
                        value: [...key.value],
                        inTangent:
                            initialTrack.interpolation === "cubicSpline"
                                ? (key.inTangent ?? new Array<number>(initialTrack.componentCount).fill(0)).map((value) => value * frameRate)
                                : undefined,
                        outTangent:
                            initialTrack.interpolation === "cubicSpline"
                                ? (key.outTangent ?? new Array<number>(initialTrack.componentCount).fill(0)).map((value) => value * frameRate)
                                : undefined,
                    }))
                );
                if (!group.isPlaying) {
                    goToFrame(group, group.currentTime * frameRate, engine);
                }
            },
            evaluate: (frame) => EvaluateTrack(readTrack(), frame / frameRate),
            createEvaluator: () => {
                const track = readTrack();
                return (frame) => EvaluateTrack(track, frame / frameRate);
            },
        };
    });
}

/**
 * Creates Lite playback controls for the shared curve editor.
 * @param group The Lite animation group.
 * @param engine The engine used when seeking.
 * @returns Playback operations in the group's authored frame units.
 */
export function CreateLiteCurveEditorPlayback(group: AnimationGroup, engine: EngineContext): ICurveEditorPlayback {
    const frameRate = GetAnimationFrameRate(group);
    let originalSpeedRatio: number | undefined;
    return {
        play: (forward, _fromFrame, _toFrame, currentFrame) => {
            if (originalSpeedRatio === undefined) {
                originalSpeedRatio = group.speedRatio;
            }
            group.speedRatio = Math.abs(originalSpeedRatio) * (forward ? 1 : -1);
            goToFrame(group, currentFrame, engine);
            playAnimation(group);
        },
        stop: () => {
            pauseAnimation(group);
            if (originalSpeedRatio !== undefined) {
                group.speedRatio = originalSpeedRatio;
                originalSpeedRatio = undefined;
            }
        },
        moveToFrame: (frame) => {
            const wasPlaying = group.isPlaying;
            goToFrame(group, frame, engine);
            if (wasPlaying) {
                playAnimation(group);
            }
        },
        getCurrentFrame: () => group.currentTime * frameRate,
    };
}

/**
 * Creates the shared curve-editor source for a Lite animation group.
 * @param group The Lite animation group.
 * @param engine The engine used to refresh poses and play the group.
 * @param api The public Lite curve API functions.
 * @returns Normalized tracks, Lite playback, clip duration, and host capabilities.
 */
export function CreateLiteCurveEditorSource(group: AnimationGroup, engine: EngineContext, api: LiteCurveApi): ICurveEditorSource {
    const animations = CreateLiteCurveEditorAnimations(group, engine, api);
    const frameRate = GetAnimationFrameRate(group);
    return {
        animations,
        initialActiveAnimations: animations,
        initiallyPlaying: group.isPlaying,
        playback: CreateLiteCurveEditorPlayback(group, engine),
        clipDuration: group.duration * frameRate,
        capabilities: {
            canEditClipLength: false,
            canDeleteBoundaryKeys: true,
            canEditBoundaryKeyFrames: true,
            canDeleteLastKey: false,
            constrainKeyFrames: true,
        },
    };
}
