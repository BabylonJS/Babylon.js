import { Animation } from "core/Animations/animation";
import { AnimationKeyInterpolation } from "core/Animations/animationKey";
import type { CompactAnimation } from "core/Animations/compactAnimation";
import { FloatCompactAnimation } from "core/Animations/compactAnimation";
import { _GLTFUtilities } from "./glTFUtilities";
import type { IAccessor, IAnimation, IBufferView } from "babylonjs-gltf2interface";
import { AccessorComponentType, AccessorType, AnimationChannelTargetPath, AnimationSamplerInterpolation } from "babylonjs-gltf2interface";
import type { Node } from "core/node";
import type { _BinaryWriter } from "./glTFExporter";
import type { Nullable } from "core/types";
import type { MorphTarget } from "core/Morph/morphTarget";

// eslint-disable-next-line @typescript-eslint/naming-convention
type _IAnimationInfo = import("./glTFAnimation")._IAnimationInfo;

/**
 * The in-memory auto-expending float32 writing buffer without reallocating on writing
 * @internal
 */
class _Float32Buffer {
    /**
     * Size of next auto-expending memory block
     */
    blockSize: number;
    /**
     * Last written value
     */
    lastValue: number;
    /**
     * Written length
     */
    length: number;
    /**
     * Allocated memory size
     */
    capacity: number;
    /**
     * Write offset of current buffer
     * @internal
     */
    _offset: number;
    /**
     * Allocated memory buffers
     */
    buf: Float32Array[];

    /**
     * Creates a new buffer
     * Note no memory blocks are allocated here
     *
     * @param blockSize Initial block size
     */
    constructor(blockSize = 1024) {
        this.blockSize = blockSize;
        this.lastValue = 0;
        this.length = 0;
        this.capacity = 0;
        this._offset = 0;
        this.buf = [];
    }

    /**
     * Get next buffer writable for specified size
     * @internal
     * @param size
     */
    _nextBuf(size: number): Float32Array {
        const capacity = this.capacity;
        const length = this.length;
        const buf = this.buf;
        if (capacity >= length + size) {
            // buf.at(-1);
            return buf[buf.length - 1];
        }
        const blockSize = this.blockSize;
        const newBuf = new Float32Array(blockSize);
        buf.push(newBuf);
        this.capacity += blockSize;
        this._offset = 0;
        return newBuf;
    }

    /**
     * Append a value to buffer
     * @param value the value to append
     */
    append(value: number): void {
        const buf = this._nextBuf(1);
        const offset = this._offset;
        buf[offset] = value;
        this._offset++;
        this.lastValue = value;
        this.length++;
    }

    /**
     * Concat all written values to a Float32Array
     */
    toArray(): Float32Array {
        const length = this.length;
        const f32a = new Float32Array(length);
        let offset = 0;
        const buf = this.buf;
        let remaining = length;
        let index = 0;
        while (remaining > 0) {
            let curr = buf[index++];
            if (remaining < curr.length) {
                curr = curr.subarray(0, remaining);
            }
            f32a.set(curr, offset);
            offset += curr.length;
            remaining -= curr.length;
        }
        return f32a;
    }
}

function getFrame<T>(animation: CompactAnimation<T>, index: number) {
    return animation.frames![index * animation.frameStride];
}

function getValue<T>(animation: CompactAnimation<T>, index: number): T {
    return animation._startValueAt(index, animation.stride);
}

/**
 * Holder for info needed for merging CompactAnimation for morph target
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface _MergeMorphTargetCompactAnimationInfo {
    /**
     * Current frame
     */
    frame: number;
    /**
     * Index of {@link _MergeMorphTargetCompactAnimationInfo#frame}
     */
    index: number;
    /**
     * The CompactAnimation
     */
    animation: CompactAnimation<any>;
}

/**
 * Find next morph target animation with next frame
 * @param mergeInfos array containing info of all animations
 * @returns The next animation info or null
 */
function findNext(mergeInfos: _MergeMorphTargetCompactAnimationInfo[]): Nullable<_MergeMorphTargetCompactAnimationInfo> {
    let min = Infinity,
        next = null;
    for (let i = 0, length = mergeInfos.length, info; i < length; i++) {
        info = mergeInfos[i];
        if (info.frame < min) {
            min = info.frame;
            next = info;
        }
    }
    return next;
}

/**
 * Seek to next frame of morph target animation
 */
function nextFrame(next: _MergeMorphTargetCompactAnimationInfo): void {
    const nextFrame = getFrame(next.animation, next.index + 1);
    if (nextFrame === undefined) {
        next.frame = Infinity;
    } else {
        next.frame = nextFrame;
        next.index++;
    }
}

/**
 * Build a dummy FloatCompactAnimation for merging morph target animations
 * @param target The provided morph target
 * @param frame The specified frame, defaults to 0
 * @returns a dummy FloatCompactAnimation with one frame and one value
 */
export function buildDummyMorphTargetCompactAnimation(target: MorphTarget, frame: number): FloatCompactAnimation {
    const animation = new FloatCompactAnimation(`${target.name}_MorphWeightAnimation`, "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_RELATIVE);
    animation.stride = 1;
    animation.frames = new Float32Array(1);
    animation.frames[0] = frame || 0;
    animation.values = new Float32Array(1);
    animation.values[0] = target.influence;
    return animation;
}

/**
 * Merge morph target CompactAnimations for GLTF serializing
 * @param animations Array of CompactAnimations to merge
 * @returns the exported data of CompactAnimation for {@link gltfAddCompactAnimation}, null for fail
 */
export function mergeMorphTargetCompactAnimations(animations: CompactAnimation<any>[]): Nullable<_ICompactAnimationData> {
    const targetSize = animations.length;
    const mergeInfos: _MergeMorphTargetCompactAnimationInfo[] = [];
    let interpolation = undefined;
    for (let i = 0; i < targetSize; i++) {
        const animation = animations[i];
        if (animation.dataType !== Animation.ANIMATIONTYPE_FLOAT || !animation.frames || !animation.values) {
            return null;
        }
        if (interpolation === undefined) {
            interpolation = animation.interpolation;
        } else if (interpolation !== animation.interpolation) {
            return null;
        }
        mergeInfos[i] = {
            frame: getFrame(animation, 0),
            index: 0,
            animation,
        };
    }
    const inputWriter = new _Float32Buffer();
    const outputWriter = new _Float32Buffer();
    let min = Infinity,
        max = -Infinity;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const next = findNext(mergeInfos);
        if (!next) {
            break;
        }
        const frame = next.frame;
        if (frame === Infinity) {
            break;
        }
        if (inputWriter.lastValue === frame) {
            nextFrame(next);
            continue;
        }
        min = Math.min(min, frame);
        max = Math.max(max, frame);
        inputWriter.append(frame);

        for (let i = 0; i < targetSize; i++) {
            const info = mergeInfos[i];
            outputWriter.append(getValue(info.animation, info.index));
        }
        nextFrame(next);
    }
    return {
        dataAccessorType: AccessorType.SCALAR,
        animationChannelTargetPath: AnimationChannelTargetPath.WEIGHTS,
        useQuaternion: false,
        samplerInterpolation: interpolation === AnimationKeyInterpolation.NONE ? AnimationSamplerInterpolation.LINEAR : AnimationSamplerInterpolation.STEP,
        inputs: inputWriter.toArray(),
        inputsMin: min,
        inputsMax: max,
        outputs: outputWriter.toArray(),
    };
}

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface _ICompactAnimationData extends _IAnimationInfo {
    samplerInterpolation: AnimationSamplerInterpolation;
    inputs: NonNullable<CompactAnimation<any>["frames"]>;
    inputsMin: number;
    inputsMax: number;
    outputs: NonNullable<CompactAnimation<any>["values"]>;
}

/**
 * The _GLTFAnimation._AddAnimation for CompactAnimation
 * @internal
 */
export function gltfAddCompactAnimation(
    name: string,
    glTFAnimation: IAnimation,
    babylonTransformNode: Node,
    animationData: _ICompactAnimationData,
    nodeMap: { [key: number]: number },
    binaryWriter: _BinaryWriter,
    bufferViews: IBufferView[],
    accessors: IAccessor[]
): void {
    let bufferView;
    let accessor;
    let keyframeAccessorIndex;
    let dataAccessorIndex;
    let outputLength;
    let animationSampler;
    let animationChannel;
    if (animationData) {
        const { dataAccessorType, animationChannelTargetPath } = animationData;
        const nodeIndex = nodeMap[babylonTransformNode.uniqueId];
        // Creates buffer view and accessor for key frames.
        let byteLength = animationData.inputs.length * 4;
        bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, `${name}  keyframe data view`);
        bufferViews.push(bufferView);
        animationData.inputs.forEach(function (input) {
            // Note: this is benchmarked to be slow, should there be some kind of bulk writing method?
            binaryWriter.setFloat32(input);
        });

        accessor = _GLTFUtilities._CreateAccessor(
            bufferViews.length - 1,
            `${name}  keyframes`,
            AccessorType.SCALAR,
            AccessorComponentType.FLOAT,
            animationData.inputs.length,
            null,
            [animationData.inputsMin],
            [animationData.inputsMax]
        );
        accessors.push(accessor);
        keyframeAccessorIndex = accessors.length - 1;
        // create bufferview and accessor for keyed values.
        outputLength = animationData.outputs.length;
        byteLength = animationData.outputs.length * 4;
        // check for in and out tangents
        bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, `${name}  data view`);
        bufferViews.push(bufferView);
        animationData.outputs.forEach(function (output) {
            // Note: this is benchmarked to be slow, should there be some kind of bulk writing method?
            binaryWriter.setFloat32(output);
        });
        accessor = _GLTFUtilities._CreateAccessor(
            bufferViews.length - 1,
            `${name}  data`,
            dataAccessorType,
            AccessorComponentType.FLOAT,
            outputLength / _GLTFUtilities._GetDataAccessorElementCount(dataAccessorType),
            null,
            null,
            null
        );

        accessors.push(accessor);
        dataAccessorIndex = accessors.length - 1;
        // create sampler
        animationSampler = {
            interpolation: animationData.samplerInterpolation,
            input: keyframeAccessorIndex,
            output: dataAccessorIndex,
        };
        glTFAnimation.samplers.push(animationSampler);
        // create channel
        animationChannel = {
            sampler: glTFAnimation.samplers.length - 1,
            target: {
                node: nodeIndex,
                path: animationChannelTargetPath,
            },
        };
        glTFAnimation.channels.push(animationChannel);
    }
}
