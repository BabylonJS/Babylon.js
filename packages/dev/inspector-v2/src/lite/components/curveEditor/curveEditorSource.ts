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
    /** Evaluates a track in seconds through Lite's playback sampler. */
    evaluateAnimationTrack(group: AnimationGroup, trackIndex: number, time: number): readonly number[];
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
            requiresSampling: initialTrack.interpolation === "linear" && initialTrack.easing !== undefined,
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
            evaluate: (frame) => api.evaluateAnimationTrack(group, trackIndex, frame / frameRate),
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
    let appliedSpeedRatio: number | undefined;
    const restoreSpeedRatio = () => {
        if (originalSpeedRatio !== undefined && group.speedRatio === appliedSpeedRatio) {
            group.speedRatio = originalSpeedRatio;
        }
        originalSpeedRatio = undefined;
        appliedSpeedRatio = undefined;
    };
    return {
        play: (forward, _fromFrame, _toFrame, currentFrame) => {
            if (originalSpeedRatio === undefined || group.speedRatio !== appliedSpeedRatio) {
                originalSpeedRatio = group.speedRatio;
            }
            appliedSpeedRatio = Math.abs(originalSpeedRatio) * (forward ? 1 : -1);
            group.speedRatio = appliedSpeedRatio;
            goToFrame(group, currentFrame, engine);
            playAnimation(group);
        },
        stop: () => {
            pauseAnimation(group);
            restoreSpeedRatio();
        },
        moveToFrame: (frame) => {
            const wasPlaying = group.isPlaying;
            goToFrame(group, frame, engine);
            if (wasPlaying) {
                playAnimation(group);
            }
        },
        getCurrentFrame: () => group.currentTime * frameRate,
        dispose: restoreSpeedRatio,
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
