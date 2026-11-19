import { Animation } from "core/Animations/animation";
import { AnimationKeyInterpolation, type IAnimationKey } from "core/Animations/animationKey";
import { type TargetedAnimation, type AnimationGroup } from "core/Animations/animationGroup";
import { type Scene } from "core/scene";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { type Nullable } from "core/types";
import { Color3, Color4 } from "core/Maths/math.color";
import { Quaternion, Vector2, Vector3 } from "core/Maths/math.vector";

import { ChannelColors, ColorChannelColors, DefaultCurveColor } from "./curveEditorColors";
import {
    CurveEditorInterpolation,
    type CurveEditorAnimationKind,
    type CurveEditorComponent,
    type CurveEditorKey,
    type ICurveEditorAnimation,
    type ICurveEditorPlayback,
    type ICurveEditorSource,
} from "./curveEditorModel";

const AnimationComponents: Record<Exclude<CurveEditorAnimationKind, "components">, readonly CurveEditorComponent[]> = {
    float: [{ name: "Value", color: DefaultCurveColor }],
    vector2: [
        { name: "X", color: ChannelColors.X },
        { name: "Y", color: ChannelColors.Y },
    ],
    vector3: [
        { name: "X", color: ChannelColors.X },
        { name: "Y", color: ChannelColors.Y },
        { name: "Z", color: ChannelColors.Z },
    ],
    quaternion: [
        { name: "X", color: ChannelColors.X },
        { name: "Y", color: ChannelColors.Y },
        { name: "Z", color: ChannelColors.Z },
        { name: "W", color: ChannelColors.W },
    ],
    color3: [
        { name: "Red", color: ColorChannelColors.R },
        { name: "Green", color: ColorChannelColors.G },
        { name: "Blue", color: ColorChannelColors.B },
    ],
    color4: [
        { name: "Red", color: ColorChannelColors.R },
        { name: "Green", color: ColorChannelColors.G },
        { name: "Blue", color: ColorChannelColors.B },
        { name: "Alpha", color: ColorChannelColors.A },
    ],
};

function GetAnimationKind(animation: Animation): CurveEditorAnimationKind | undefined {
    switch (animation.dataType) {
        case Animation.ANIMATIONTYPE_FLOAT:
            return "float";
        case Animation.ANIMATIONTYPE_VECTOR2:
            return "vector2";
        case Animation.ANIMATIONTYPE_VECTOR3:
            return "vector3";
        case Animation.ANIMATIONTYPE_QUATERNION:
            return "quaternion";
        case Animation.ANIMATIONTYPE_COLOR3:
            return "color3";
        case Animation.ANIMATIONTYPE_COLOR4:
            return "color4";
        default:
            return undefined;
    }
}

function GetComponentNames(kind: CurveEditorAnimationKind): readonly string[] {
    switch (kind) {
        case "float":
            return [];
        case "vector2":
            return ["x", "y"];
        case "vector3":
            return ["x", "y", "z"];
        case "quaternion":
            return ["x", "y", "z", "w"];
        case "color3":
            return ["r", "g", "b"];
        case "color4":
            return ["r", "g", "b", "a"];
        case "components":
            return [];
    }
}

function ToComponents(value: unknown, kind: CurveEditorAnimationKind): number[] {
    if (kind === "float") {
        if (typeof value !== "number") {
            throw new Error("Expected a scalar animation value.");
        }
        return [value];
    }

    if (typeof value !== "object" || value === null) {
        throw new Error("Expected a multi-component animation value.");
    }

    const source = value as Record<string, unknown>;
    return GetComponentNames(kind).map((component) => {
        const componentValue = source[component];
        if (typeof componentValue !== "number") {
            throw new Error(`Expected numeric animation component '${component}'.`);
        }
        return componentValue;
    });
}

function FromComponents(values: readonly number[], kind: CurveEditorAnimationKind): number | Vector2 | Vector3 | Quaternion | Color3 | Color4 {
    switch (kind) {
        case "float":
            return values[0];
        case "vector2":
            return new Vector2(values[0], values[1]);
        case "vector3":
            return new Vector3(values[0], values[1], values[2]);
        case "quaternion":
            return new Quaternion(values[0], values[1], values[2], values[3]);
        case "color3":
            return new Color3(values[0], values[1], values[2]);
        case "color4":
            return new Color4(values[0], values[1], values[2], values[3]);
        case "components":
            throw new Error("Native animation values do not support generic components.");
    }
}

function ToCurveEditorKey(key: IAnimationKey, kind: CurveEditorAnimationKind): CurveEditorKey {
    return {
        frame: key.frame,
        value: ToComponents(key.value, kind),
        inTangent: key.inTangent === undefined ? undefined : ToComponents(key.inTangent, kind),
        outTangent: key.outTangent === undefined ? undefined : ToComponents(key.outTangent, kind),
        lockedTangent: key.lockedTangent ?? true,
        interpolation: key.interpolation === AnimationKeyInterpolation.STEP ? CurveEditorInterpolation.Step : CurveEditorInterpolation.Linear,
    };
}

/**
 * Creates a normalized curve-editor view over a Babylon.js Animation.
 * @param animation The native animation to expose.
 * @returns The normalized animation, or undefined when its value type is unsupported by the editor.
 */
export function CreateBabylonCurveEditorAnimation(animation: Animation): ICurveEditorAnimation | undefined {
    const kind = GetAnimationKind(animation);
    if (!kind || kind === "components") {
        return undefined;
    }

    return {
        uniqueId: animation.uniqueId.toString(),
        name: animation.name,
        framePerSecond: animation.framePerSecond,
        kind,
        components: AnimationComponents[kind],
        supportsTangents: kind !== "quaternion",
        supportsInterpolationEditing: true,
        source: animation,
        getKeys: () => (animation.getKeys() ?? []).map((key) => ToCurveEditorKey(key, kind)),
        setKeys: (keys) => {
            const nativeKeys: IAnimationKey[] = keys.map((key) => ({
                frame: key.frame,
                value: FromComponents(key.value, kind),
                inTangent: key.inTangent === undefined ? undefined : FromComponents(key.inTangent, kind),
                outTangent: key.outTangent === undefined ? undefined : FromComponents(key.outTangent, kind),
                lockedTangent: key.lockedTangent,
                interpolation: key.interpolation === CurveEditorInterpolation.Step ? AnimationKeyInterpolation.STEP : AnimationKeyInterpolation.NONE,
            }));
            animation.setKeys(nativeKeys);
        },
        evaluate: (frame) => ToComponents(animation.evaluate(frame), kind),
    };
}

/**
 * Normalizes Babylon.js animations that can be displayed by the shared editor.
 * @param animations - Native animations to convert
 * @returns The supported normalized animations in input order
 */
export function CreateBabylonCurveEditorAnimations(animations: readonly Animation[]): ICurveEditorAnimation[] {
    return animations.map((animation) => CreateBabylonCurveEditorAnimation(animation)).filter((animation): animation is ICurveEditorAnimation => !!animation);
}

export type BabylonCurveEditorSourceOptions = {
    /** Scene used for native playback. */
    scene: Scene;
    /** Target used for native playback and animation application. */
    target: Nullable<IAnimatable>;
    /** Native animations to normalize and edit. */
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    /** Optional animation group used in place of scene playback. */
    rootAnimationGroup?: Nullable<AnimationGroup>;
    /** Whether entries are targeted animations. */
    useTargetAnimations?: boolean;
};

function GetNativeAnimations(options: BabylonCurveEditorSourceOptions): Animation[] {
    return (options.animations ?? []).map((entry) => (options.useTargetAnimations ? (entry as TargetedAnimation).animation : (entry as Animation)));
}

function CreateBabylonCurveEditorPlayback(options: BabylonCurveEditorSourceOptions): ICurveEditorPlayback {
    const { scene, target, rootAnimationGroup } = options;
    let isPlaying = GetNativeAnimations(options).some((animation) => animation.hasRunningRuntimeAnimations);
    let currentFrame = 0;
    const stop = () => {
        if (rootAnimationGroup) {
            rootAnimationGroup.stop();
        } else {
            scene.stopAnimation(target);
        }
        isPlaying = false;
    };

    return {
        play: (forward, fromFrame, toFrame, frame) => {
            if (isPlaying) {
                stop();
            }

            currentFrame = frame;
            if (rootAnimationGroup) {
                rootAnimationGroup.start(true, 1.0, forward ? fromFrame : toFrame, forward ? toFrame : fromFrame);
                rootAnimationGroup.goToFrame(frame);
            } else {
                scene.beginAnimation(target, forward ? fromFrame : toFrame, forward ? toFrame : fromFrame, true);
            }
            isPlaying = true;
        },
        stop,
        moveToFrame: (frame, fromFrame, toFrame, wasPlaying) => {
            currentFrame = frame;
            if (!wasPlaying) {
                if (rootAnimationGroup) {
                    rootAnimationGroup.start(false, 1.0, fromFrame, toFrame);
                } else {
                    scene.beginAnimation(target, fromFrame, toFrame, false);
                }
            }

            if (rootAnimationGroup) {
                rootAnimationGroup.goToFrame(frame);
            } else {
                for (const animation of GetNativeAnimations(options)) {
                    for (const runtimeAnimation of animation.runtimeAnimations) {
                        runtimeAnimation.goToFrame(frame);
                    }
                }
            }

            if (!wasPlaying) {
                stop();
            }
        },
        getCurrentFrame: () => {
            const runtimeAnimation = GetNativeAnimations(options).find((animation) => animation.hasRunningRuntimeAnimations)?.runtimeAnimations[0];
            return runtimeAnimation?.currentFrame ?? currentFrame;
        },
    };
}

/**
 * Creates the common curve-editor source for Babylon.js animations.
 * @param options - Native scene, target, animation, and animation-group inputs
 * @returns Normalized animation data, native playback, duration, and host capabilities
 */
export function CreateBabylonCurveEditorSource(options: BabylonCurveEditorSourceOptions): ICurveEditorSource {
    const animations = CreateBabylonCurveEditorAnimations(GetNativeAnimations(options));
    const nativeAnimations = GetNativeAnimations(options);
    const initialAnimation = animations[0];
    const initialNativeAnimation = nativeAnimations.find((animation) => initialAnimation?.source === animation);
    const keys = initialAnimation?.getKeys() ?? [];
    return {
        animations,
        initialActiveAnimations: initialAnimation ? [initialAnimation] : [],
        initiallyPlaying: initialNativeAnimation?.hasRunningRuntimeAnimations ?? false,
        playback: CreateBabylonCurveEditorPlayback(options),
        clipDuration: keys[keys.length - 1]?.frame ?? 0,
        capabilities: {
            canEditClipLength: true,
            canDeleteBoundaryKeys: false,
            canEditBoundaryKeyFrames: false,
            canDeleteLastKey: false,
            constrainKeyFrames: false,
        },
    };
}
