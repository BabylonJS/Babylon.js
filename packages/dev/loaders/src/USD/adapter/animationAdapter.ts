import { Animation } from "core/Animations/animation.pure";
import { AnimationGroup } from "core/Animations/animationGroup.pure";
import { AnimationKeyInterpolation, type IAnimationKey } from "core/Animations/animationKey";
import { Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { type TransformNode } from "core/Meshes/transformNode.pure";
import { type Scene } from "core/scene";
import { type IResolvedAnimation, type IResolvedAnimationTrack, type ResolvedAnimationTargetKind } from "../resolution/resolvedStage";

type AnimationValue = Vector3 | Quaternion | number;

interface ITrackDescriptor {
    target: ResolvedAnimationTargetKind;
    targetProperty: string;
    dataType: number;
    stride: number;
    createValue: (values: Float32Array, offset: number) => AnimationValue;
}

const SplineBakeFrameStep = 2;
const MaxSplineBakeSubdivisions = 32;

/**
 * Creates Babylon animations for a resolved USD prim animation.
 *
 * The resolution layer is expected to have already evaluated USD time samples, value clips, and
 * spline sample values. This adapter only converts seconds to Babylon frames and maps resolved
 * values to Babylon animation value types. Held tracks use step interpolation. Linear tracks use
 * Babylon's default interpolation. Bezier and Hermite tracks are baked into denser linear keys using
 * supplied tangents as an approximation; if tangents are unavailable, the resolved samples are used
 * as linear keys.
 *
 * Visibility tracks target `AbstractMesh.visibility`. They are skipped for non-mesh transform nodes because
 * `TransformNode` has no visibility property.
 * @param animation the resolved per-prim animation
 * @param node the Babylon node the animation will target
 * @param fps the Babylon frames per second used to convert sample times from seconds to frames
 * @returns one Babylon animation for each supported resolved track
 */
export function CreateAnimationsForPrim(animation: IResolvedAnimation, node: TransformNode, fps: number): Animation[] {
    const animations: Animation[] = [];

    for (const track of animation.tracks) {
        const descriptor = GetTrackDescriptor(track.target, node);
        if (!descriptor) {
            continue;
        }

        const keys = CreateKeys(track, descriptor, fps);
        if (keys.length === 0) {
            continue;
        }

        const babylonAnimation = new Animation(
            `${node.name}.${descriptor.targetProperty}`,
            descriptor.targetProperty,
            fps,
            descriptor.dataType,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        babylonAnimation.setKeys(keys);
        animations.push(babylonAnimation);
    }

    return animations;
}

/**
 * Creates a Babylon animation group from resolved animation entries.
 *
 * The returned group is only assembled; it is not started or played automatically. Empty entries and
 * animations without keys are ignored so callers may pass partially populated adapter results.
 * @param name the animation group name
 * @param scene the scene that will own the animation group
 * @param entries the target nodes and animations to add to the group
 * @returns the assembled animation group
 */
export function BuildAnimationGroup(name: string, scene: Scene, entries: { node: TransformNode; animations: Animation[] }[]): AnimationGroup {
    const group = new AnimationGroup(name, scene);

    for (const entry of entries) {
        for (const animation of entry.animations) {
            if (animation.getKeys().length > 0) {
                group.addTargetedAnimation(animation, entry.node);
            }
        }
    }

    return group;
}

function GetTrackDescriptor(target: ResolvedAnimationTargetKind, node: TransformNode): ITrackDescriptor | undefined {
    switch (target) {
        case "translation":
            return {
                target,
                targetProperty: "position",
                dataType: Animation.ANIMATIONTYPE_VECTOR3,
                stride: 3,
                createValue: (values, offset) => new Vector3(values[offset], values[offset + 1], values[offset + 2]),
            };
        case "rotation":
            return {
                target,
                targetProperty: "rotationQuaternion",
                dataType: Animation.ANIMATIONTYPE_QUATERNION,
                stride: 4,
                createValue: (values, offset) => new Quaternion(values[offset], values[offset + 1], values[offset + 2], values[offset + 3]),
            };
        case "scale":
            return {
                target,
                targetProperty: "scaling",
                dataType: Animation.ANIMATIONTYPE_VECTOR3,
                stride: 3,
                createValue: (values, offset) => new Vector3(values[offset], values[offset + 1], values[offset + 2]),
            };
        case "visibility":
            if (!(node instanceof AbstractMesh)) {
                return undefined;
            }

            return {
                target,
                targetProperty: "visibility",
                dataType: Animation.ANIMATIONTYPE_FLOAT,
                stride: 1,
                createValue: (values, offset) => values[offset],
            };
    }
}

function CreateKeys(track: IResolvedAnimationTrack, descriptor: ITrackDescriptor, fps: number): IAnimationKey[] {
    if (track.interpolation === "bezier" || track.interpolation === "hermite") {
        return CreateBakedSplineKeys(track, descriptor, fps);
    }

    const sampleCount = GetSampleCount(track, descriptor.stride);
    const keys: IAnimationKey[] = [];

    for (let index = 0; index < sampleCount; index++) {
        keys.push(CreateSampleKey(track, descriptor, index, fps, track.interpolation === "held"));
    }

    return keys;
}

function CreateBakedSplineKeys(track: IResolvedAnimationTrack, descriptor: ITrackDescriptor, fps: number): IAnimationKey[] {
    const sampleCount = GetSampleCount(track, descriptor.stride);
    if (sampleCount === 0) {
        return [];
    }

    if (
        !track.inTangents ||
        !track.outTangents ||
        GetSampleCount({ ...track, values: track.inTangents }, descriptor.stride) < sampleCount ||
        GetSampleCount({ ...track, values: track.outTangents }, descriptor.stride) < sampleCount
    ) {
        return CreateLinearSampleKeys(track, descriptor, fps);
    }

    const keys: IAnimationKey[] = [CreateSampleKey(track, descriptor, 0, fps, false)];

    for (let index = 0; index < sampleCount - 1; index++) {
        const startTime = track.times[index];
        const endTime = track.times[index + 1];
        const startFrame = startTime * fps;
        const endFrame = endTime * fps;
        const segmentFrameLength = Math.abs(endFrame - startFrame);
        const subdivisions = Math.max(1, Math.min(MaxSplineBakeSubdivisions, Math.ceil(segmentFrameLength / SplineBakeFrameStep)));

        for (let step = 1; step <= subdivisions; step++) {
            const gradient = step / subdivisions;
            keys.push({
                frame: startFrame + (endFrame - startFrame) * gradient,
                value: EvaluateHermiteValue(track, descriptor, index, gradient),
            });
        }
    }

    return keys;
}

function CreateLinearSampleKeys(track: IResolvedAnimationTrack, descriptor: ITrackDescriptor, fps: number): IAnimationKey[] {
    const sampleCount = GetSampleCount(track, descriptor.stride);
    const keys: IAnimationKey[] = [];

    for (let index = 0; index < sampleCount; index++) {
        keys.push(CreateSampleKey(track, descriptor, index, fps, false));
    }

    return keys;
}

function CreateSampleKey(track: IResolvedAnimationTrack, descriptor: ITrackDescriptor, sampleIndex: number, fps: number, step: boolean): IAnimationKey {
    const key: IAnimationKey = {
        frame: track.times[sampleIndex] * fps,
        value: descriptor.createValue(track.values, sampleIndex * descriptor.stride),
    };

    if (step) {
        key.interpolation = AnimationKeyInterpolation.STEP;
    }

    return key;
}

function EvaluateHermiteValue(track: IResolvedAnimationTrack, descriptor: ITrackDescriptor, startIndex: number, gradient: number): AnimationValue {
    const startOffset = startIndex * descriptor.stride;
    const endOffset = (startIndex + 1) * descriptor.stride;
    const duration = track.times[startIndex + 1] - track.times[startIndex];

    if (descriptor.target === "visibility") {
        return EvaluateHermiteScalar(
            track.values[startOffset],
            track.outTangents![startOffset] * duration,
            track.values[endOffset],
            track.inTangents![endOffset] * duration,
            gradient
        );
    }

    if (descriptor.target === "rotation") {
        return new Quaternion(
            EvaluateHermiteScalar(
                track.values[startOffset],
                track.outTangents![startOffset] * duration,
                track.values[endOffset],
                track.inTangents![endOffset] * duration,
                gradient
            ),
            EvaluateHermiteScalar(
                track.values[startOffset + 1],
                track.outTangents![startOffset + 1] * duration,
                track.values[endOffset + 1],
                track.inTangents![endOffset + 1] * duration,
                gradient
            ),
            EvaluateHermiteScalar(
                track.values[startOffset + 2],
                track.outTangents![startOffset + 2] * duration,
                track.values[endOffset + 2],
                track.inTangents![endOffset + 2] * duration,
                gradient
            ),
            EvaluateHermiteScalar(
                track.values[startOffset + 3],
                track.outTangents![startOffset + 3] * duration,
                track.values[endOffset + 3],
                track.inTangents![endOffset + 3] * duration,
                gradient
            )
        ).normalize();
    }

    return new Vector3(
        EvaluateHermiteScalar(track.values[startOffset], track.outTangents![startOffset] * duration, track.values[endOffset], track.inTangents![endOffset] * duration, gradient),
        EvaluateHermiteScalar(
            track.values[startOffset + 1],
            track.outTangents![startOffset + 1] * duration,
            track.values[endOffset + 1],
            track.inTangents![endOffset + 1] * duration,
            gradient
        ),
        EvaluateHermiteScalar(
            track.values[startOffset + 2],
            track.outTangents![startOffset + 2] * duration,
            track.values[endOffset + 2],
            track.inTangents![endOffset + 2] * duration,
            gradient
        )
    );
}

function EvaluateHermiteScalar(startValue: number, outTangent: number, endValue: number, inTangent: number, gradient: number): number {
    const squared = gradient * gradient;
    const cubed = squared * gradient;
    const startWeight = 2 * cubed - 3 * squared + 1;
    const outTangentWeight = cubed - 2 * squared + gradient;
    const endWeight = -2 * cubed + 3 * squared;
    const inTangentWeight = cubed - squared;

    return startWeight * startValue + outTangentWeight * outTangent + endWeight * endValue + inTangentWeight * inTangent;
}

function GetSampleCount(track: Pick<IResolvedAnimationTrack, "times" | "values">, stride: number): number {
    return Math.min(track.times.length, Math.floor(track.values.length / stride));
}
