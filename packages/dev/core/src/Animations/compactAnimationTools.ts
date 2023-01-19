import { Animation } from "./animation";
import type { IAnimationKey } from "./animationKey";
import { AnimationKeyInterpolation } from "./animationKey";
import { Matrix, Quaternion, Vector3 } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import { CompactAnimation, compactAnimationTypeMap, QuaternionCompactAnimation, strideMap } from "./compactAnimation";

/**
 * Clone range to another animation
 * @param src Animation
 * @param target Animation
 */
function cloneRanges(src: any, target: any): void {
    if (src._ranges) {
        target._ranges = {};
        for (const name in src._ranges) {
            const range = src._ranges[name];
            if (!range) {
                continue;
            }
            target._ranges[name] = range.clone();
        }
    }
}

/**
 * Convert {@link Animation} to {@link CompactAnimation}
 *
 * @param animation The animation to convert
 * @returns The converted CompactAnimation, false for failed
 */
export function animationToCompactAnimation(animation: Animation): CompactAnimation<any> | false {
    if (animation instanceof CompactAnimation) {
        return animation;
    }
    const dataType = animation.dataType;
    const stride = strideMap[dataType];
    if (!stride) {
        return false;
    }
    const constructor = compactAnimationTypeMap[dataType];
    if (!constructor) {
        return false;
    }
    const keys = animation.getKeys();
    let interpolation = undefined;
    for (let i = 0, length = keys.length, key; i < length; i++) {
        key = keys[i];
        if (key.interpolation !== undefined) {
            if (interpolation === undefined) {
                interpolation = key.interpolation;
            } else if (interpolation !== key.interpolation) {
                // per frame interpolation not supported
                return false;
            }
        }
        if (key.inTangent !== undefined || key.outTangent !== undefined || key.lockedTangent !== undefined) {
            // CUBICSPLINE not supported
            return false;
        }
    }
    const frames = new Float32Array(keys.length);
    const values = new Float32Array(frames.length * stride);
    let writeIndex = 0;
    const framePerSecond = animation.framePerSecond;

    for (let i = 0, length = keys.length, key; i < length; i++) {
        key = keys[i];
        frames[i] = key.frame / framePerSecond;
        if (dataType === Animation.ANIMATIONTYPE_FLOAT) {
            values[writeIndex++] = key.value;
        } else if (dataType === Animation.ANIMATIONTYPE_SIZE) {
            values[writeIndex++] = key.value.width;
            values[writeIndex++] = key.value.height;
        } else if (dataType === Animation.ANIMATIONTYPE_MATRIX) {
            values.set(key.value.toArray(), writeIndex);
            writeIndex += stride;
        } else {
            key.value.toArray(values, writeIndex);
            writeIndex += stride;
        }
    }
    const compact = new constructor(animation.name, animation.targetProperty, animation.framePerSecond, dataType, animation.loopMode, animation.enableBlending);

    if (animation.blendingSpeed) {
        compact.blendingSpeed = animation.blendingSpeed;
    }
    cloneRanges(animation, compact);
    // this would internally keep first and last keys
    compact.setKeys(keys);
    compact.frames = frames;
    compact.values = values;
    compact.stride = stride;
    compact.interpolation = interpolation || AnimationKeyInterpolation.NONE;
    return compact;
}

/**
 * Convert {@link CompactAnimation} to {@link Animation}
 * @param animation The CompactAnimation to convert
 * @returns The converted {@link Animation}
 */
export function compactAnimationToAnimation(animation: Animation | CompactAnimation<any>): Animation {
    if (!(animation instanceof CompactAnimation)) {
        return animation;
    }
    const dataType = animation.dataType;
    const framePerSecond = animation.framePerSecond;
    const result = new Animation(animation.name, animation.targetProperty, framePerSecond, dataType, animation.loopMode, animation.enableBlending);

    if (animation.blendingSpeed) {
        result.blendingSpeed = animation.blendingSpeed;
    }

    cloneRanges(animation, result);

    const frames = animation.frames;
    const values = animation.values;

    if (!frames || !values) {
        // empty animation supported
        result.setKeys([]);
        return result;
    }

    const stride = animation.stride;
    const frameStride = animation.frameStride;
    const frameLength = frames.length / frameStride;
    const keys: IAnimationKey[] = new Array(frameLength);
    const interpolation = animation.interpolation;

    let index = 0;
    let frameIndex = 0;
    let valueIndex = animation.valueOffset;
    if (dataType === Animation.ANIMATIONTYPE_FLOAT) {
        for (; index < frameLength; index++) {
            const keyData: IAnimationKey = {
                frame: frames[frameIndex] * framePerSecond,
                value: values[valueIndex],
            };
            if (interpolation) {
                keyData.interpolation = interpolation;
            }
            keys[index] = keyData;
            frameIndex += frameStride;
            valueIndex += stride;
        }
    } else {
        let valueClass;
        switch (dataType) {
            case Animation.ANIMATIONTYPE_QUATERNION:
                valueClass = Quaternion;
                break;
            case Animation.ANIMATIONTYPE_MATRIX:
                valueClass = Matrix;
                break;
            case Animation.ANIMATIONTYPE_COLOR3:
                valueClass = Color3;
                break;
            case Animation.ANIMATIONTYPE_COLOR4:
                valueClass = Color4;
                break;
            case Animation.ANIMATIONTYPE_VECTOR3:
            default:
                valueClass = Vector3;
                break;
        }
        for (; index < frameLength; index++) {
            const keyData: IAnimationKey = {
                frame: frames[frameIndex] * framePerSecond,
                value: valueClass.FromArray(values, valueIndex),
            };
            if (interpolation) {
                keyData.interpolation = interpolation;
            }
            keys[index] = keyData;
            frameIndex += frameStride;
            valueIndex += stride;
        }
    }

    result.setKeys(keys);
    return result;
}

/**
 * Convert rotation {@link CompactAnimation} to
 * {@link Quaternion}-based {@link CompactAnimation},
 * for gltf serializing
 * @param animation The CompactAnimation to convert
 * @returns the converted {@link CompactAnimation}, false for fail
 */
export function rotationCompactAnimationToQuaternion(animation: CompactAnimation<Vector3>): QuaternionCompactAnimation | false {
    if (animation.dataType === Animation.ANIMATIONTYPE_QUATERNION) {
        return animation as any;
    }
    if (animation.dataType !== Animation.ANIMATIONTYPE_VECTOR3 && animation.targetProperty !== "rotation") {
        return false;
    }
    if (!animation.frames || !animation.values) {
        return false;
    }
    const newAnimation = new QuaternionCompactAnimation(
        animation.name,
        "rotationQuaternion",
        animation.framePerSecond,
        Animation.ANIMATIONTYPE_QUATERNION,
        animation.loopMode,
        animation.enableBlending
    );
    newAnimation.blendingSpeed = animation.blendingSpeed;

    if (CompactAnimation.DeepCloneBuffers) {
        newAnimation.frames = animation.frames.slice();
    } else {
        newAnimation.frames = animation.frames;
    }
    newAnimation.frameStride = animation.frameStride;

    const values = new Float32Array(animation.frames.length / animation.frameStride);
    newAnimation.stride = 4;
    newAnimation.valueOffset = 0;
    newAnimation.normalizeScalar = 0;
    newAnimation.values = values;

    const source = animation.values;
    const tempQuaternion = Quaternion.Identity();
    let readOffset = animation.valueOffset;
    const readStride = animation.stride;
    let writeOffset = 0;
    for (; writeOffset < values.length; writeOffset += 4) {
        // Vector3#toQuaternion
        Quaternion.RotationYawPitchRollToRef(source[readOffset], source[readOffset + 1], source[readOffset + 2], tempQuaternion);
        tempQuaternion.toArray(values, writeOffset);
        readOffset += readStride;
        writeOffset += 4;
    }

    cloneRanges(animation, newAnimation);

    return newAnimation;
}
