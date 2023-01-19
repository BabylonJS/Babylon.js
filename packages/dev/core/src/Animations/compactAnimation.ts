import type { _IAnimationState } from "./animation";
import type { IAnimationKey } from "./animationKey";
import type { DeepImmutable } from "../types";
import { Animation } from "./animation";
import { AnimationKeyInterpolation } from "./animationKey";
import { Matrix, Quaternion, Vector2, Vector3 } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import { Size } from "../Maths/math.size";
import { DecodeBase64ToBinary, EncodeArrayBufferToBase64 } from "../Misc/stringTools";
import { RegisterClass } from "../Misc/typeStore";

export const strideMap: DeepImmutable<Record<number, number>> = {
    [Animation.ANIMATIONTYPE_FLOAT]: 1,
    [Animation.ANIMATIONTYPE_VECTOR3]: 3,
    [Animation.ANIMATIONTYPE_QUATERNION]: 4,
    [Animation.ANIMATIONTYPE_MATRIX]: 16,
    [Animation.ANIMATIONTYPE_COLOR3]: 3,
    [Animation.ANIMATIONTYPE_COLOR4]: 4,
    [Animation.ANIMATIONTYPE_VECTOR2]: 2,
    [Animation.ANIMATIONTYPE_SIZE]: 2,
};

type TypedArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Float32Array | Float64Array;

type TypedArrayConstructor =
    | typeof Int8Array
    | typeof Int16Array
    | typeof Int32Array
    | typeof Uint8Array
    | typeof Uint8ClampedArray
    | typeof Uint16Array
    | typeof Uint32Array
    | typeof Float32Array
    | typeof Float64Array;

const typedArrayMap: Record<string, TypedArrayConstructor> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Int8Array,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Int16Array,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Int32Array,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Uint8Array,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Uint8ClampedArray,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Uint16Array,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Uint32Array,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Float32Array,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Float64Array,
};

type CompactAnimationTypes =
    | typeof FloatCompactAnimation
    | typeof Vector3CompactAnimation
    | typeof QuaternionCompactAnimation
    | typeof MatrixCompactAnimation
    | typeof Color3CompactAnimation
    | typeof Color4CompactAnimation
    | typeof Vector2CompactAnimation
    | typeof SizeCompactAnimation;

/**
 * The base class for animation with keyframes stored as typed array.
 */
export abstract class CompactAnimation<T> extends Animation {
    /**
     * Whether to clone frames and values on {@link CompactAnimation#clone}
     * Defaults to false
     */
    public static DeepCloneBuffers: boolean;

    /**
     * Set this to true to serialize frames and values to base64.
     * Set this to false to get TypedArrays in serialized result.
     * Defaults to true
     */
    public static SerializeBuffersToBase64: boolean;

    /**
     * Whether to compact buffers for frames and values on {@link CompactAnimation#serialize}
     * Note this would clone the CompactAnimation and return serialized compacted clone
     * Defaults to false
     */
    public static SerializeCompactBuffers: boolean;

    /**
     * The `input` of GLTF animation sampler
     */
    protected _frames: null | TypedArray;
    /**
     * The `output` of GLTF animation sampler
     */
    protected _values: null | TypedArray;
    /**
     * The stride for {@link CompactAnimation#frames}, not byte stride
     */
    public frameStride: number;
    /**
     * The stride for {@link CompactAnimation#values}, not byte stride
     */
    public stride: number;
    /**
     * The initial offset for {@link CompactAnimation#values}, not byte offset
     */
    public valueOffset: number;
    /**
     * The scalar for {@link CompactAnimation#values},
     * mainly for normalized values, 0 to not use a scalar
     */
    public normalizeScalar: number;

    /**
     * The animation key frame interpolation type, can not be set per-frame
     */
    public interpolation: AnimationKeyInterpolation;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._frames = null;
        this.frameStride = 1;
        this._values = null;
        this.stride = strideMap[dataType] || 1;
        this.valueOffset = 0;
        this.normalizeScalar = 0;
        this.interpolation = AnimationKeyInterpolation.NONE;
    }

    /**
     * Gets the frames
     */
    public get frames() {
        return this._frames;
    }

    /**
     * Sets the frames
     * @param value Array of frame numbers multiplied by {@link Animation#framePerSecond}
     */
    public set frames(value) {
        this._frames = value;
    }

    /**
     * Gets the values
     */
    public get values() {
        return this._values;
    }

    /**
     * Sets the values
     * @param value Array of values
     */
    public set values(value) {
        this._values = value;
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.CompactAnimation";
    }

    /**
     * Converts the animation to a string
     * @param fullDetails support for multiple levels of logging within scene loading
     * @returns String form of the animation
     */
    public toString(fullDetails: boolean): string {
        let ret = "Name: " + this.name + ", property: " + this.targetProperty;
        ret += ", datatype: " + ["Float", "Vector3", "Quaternion", "Matrix", "Color3", "Vector2"][this.dataType];
        ret += ", nKeys: " + (this._frames ? this._frames.length / this.frameStride : "none");
        ret += ", nRanges: " + (this._ranges ? Object.keys(this._ranges).length : "none");
        if (fullDetails) {
            ret += ", Ranges: {";
            let first = true;
            for (const name in this._ranges) {
                if (first) {
                    ret += ", ";
                    first = false;
                }
                ret += name;
            }
            ret += "}";
        }
        return ret;
    }

    /**
     * Deletes an animation range by name
     * @param name Name of the animation range to delete
     * @param deleteFrames Specifies if the key frames for the range should also be deleted (true) or not (false)
     */
    public deleteRange(name: string, deleteFrames = true): void {
        const range = this._ranges[name];
        if (!range) {
            return;
        }
        if (deleteFrames) {
            const from = range.from;
            const to = range.to;
            let keepFrames = 0;

            const frames = this._frames;
            const values = this._values;
            if (frames && values) {
                const frameStride = this.frameStride;
                // this should be faster that double allocations
                for (let key = 0, frame = 0, nKeys = frames.length; key < nKeys; key += frameStride) {
                    frame = frames[key];
                    // why not math.max?
                    if (frame >= from && frame <= to) {
                        continue;
                    }
                    keepFrames++;
                }
                const writeFrames = new (frames.constructor as TypedArrayConstructor)(keepFrames);
                let writeFrameIndex = writeFrames.length - 1;

                const stride = this.stride;
                const writeStride = strideMap[this.dataType] || stride;
                const valueOffset = this.valueOffset;
                const writeValues = new (frames.constructor as TypedArrayConstructor)(keepFrames * writeStride);
                let writeValueIndex = writeValues.length - 1;
                let readIndex = 0;

                for (let key = 0, frame = 0, nKeys = frames.length; key < nKeys; key += frameStride) {
                    frame = frames[key];
                    // why not math.max?
                    if (frame >= from && frame <= to) {
                        continue;
                    }
                    readIndex = (key + 1) * stride - 1 + valueOffset;
                    writeFrames[writeFrameIndex--] = frame;
                    for (let i = writeStride - 1; i >= 0; i--) {
                        writeValues[writeValueIndex--] = values[readIndex--];
                    }
                }
                this._frames = writeFrames;
                this.frameStride = 1;
                this._values = writeValues;
                this.stride = writeStride;
                this.valueOffset = 0;
                // recalculate keys if removed first or last key
                this.recalculateKeys();
            }
        }
        this._ranges[name] = null; // said much faster than 'delete this._range[name]'
    }

    /**
     * Gets the highest frame rate of the animation
     * @returns Highest frame rate of the animation
     */
    public getHighestFrame(): number {
        let ret = 0;
        const frames = this._frames;
        if (frames) {
            const frameStride = this.frameStride;
            for (let key = 0, frame = 0, nKeys = frames.length; key < nKeys; key += frameStride) {
                frame = frames[key];
                // why not math.max?
                if (ret < frame) {
                    ret = frame;
                }
            }
            return ret;
        } else {
            return super.getHighestFrame();
        }
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public abstract _cloneValueAt(offset: number, stride: number): T;

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public abstract _startValueAt(offset: number, stride: number): T;

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public abstract _endValueAt(offset: number, stride: number): T;

    /**
     * Recalculate this._keys with the first and last frame
     * for compatibility with AnimationGroup after frames or values changed
     */
    public recalculateKeys(): void {
        const frames = this._frames;
        const values = this._values;
        if (!frames || !values) {
            return;
        }
        const framePerSecond = this.framePerSecond;
        const firstFrameIndex = 0;
        const frameStride = this.frameStride;
        const stride = this.stride;
        const lastFrameIndex = Math.floor(frames.length / frameStride) - 1;
        const newKeys: IAnimationKey[] = [
            {
                frame: frames[firstFrameIndex] * framePerSecond,
                value: this._cloneValueAt(firstFrameIndex, stride),
                interpolation: this.interpolation,
            },
            {
                frame: frames[lastFrameIndex * frameStride] * framePerSecond,
                value: this._cloneValueAt(lastFrameIndex, stride),
                interpolation: this.interpolation,
            },
        ];
        this.setKeys(newKeys);
    }

    /**
     * @internal Internal use only
     */
    public _interpolate(currentFrame: number, state: _IAnimationState): T {
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_CONSTANT && state.repeatCount > 0) {
            return state.highLimitValue.clone ? state.highLimitValue.clone() : state.highLimitValue;
        }
        const frames = this._frames;
        if (!frames) {
            throw new TypeError("CompactAnimation: frames is required for _interpolate");
        }
        const frameStride = this.frameStride;
        const framesLength = frames.length / frameStride;
        let key = state.key;
        currentFrame /= this.framePerSecond;

        // would binary search works better here?
        while (key >= 0 && currentFrame < frames[key * frameStride]) {
            --key;
        }
        while (key + 1 <= framesLength - 1 && currentFrame >= frames[(key + 1) * frameStride]) {
            ++key;
        }

        state.key = key;
        const valueStride = this.stride;
        if (key < 0) {
            return this._startValueAt(0, valueStride);
        } else if (key + 1 > framesLength - 1) {
            return this._startValueAt(framesLength - 1, valueStride);
        }
        const startFrame = frames[key * frameStride];
        const endFrame = frames[(key + 1) * frameStride];
        const startValue = this._startValueAt(key, valueStride);
        const endValue = this._endValueAt(key + 1, valueStride);
        if (this.interpolation === AnimationKeyInterpolation.STEP) {
            if (endFrame > currentFrame) {
                return startValue;
            } else {
                return endValue;
            }
        }
        const frameDelta = endFrame - startFrame;
        // gradient : percent of currentFrame between the frame inf and the frame sup
        let gradient = (currentFrame - startFrame) / frameDelta;
        // check for easingFunction and correction of gradient
        const easingFunction = this.getEasingFunction();
        if (easingFunction !== null) {
            gradient = easingFunction.ease(gradient);
        }
        return this._interpolateInternal(startValue, endValue, gradient, state);
    }

    /**
     * Interpolates a value linearly, could write result to endValue
     * @internal Internal use only
     */
    public abstract _interpolateInternal(startValue: T, endValue: T, gradient: number, state: _IAnimationState): T;

    /**
     * Makes a copy of the animation
     * @returns Cloned animation
     */
    public clone(): this {
        const clone: this = new (this.constructor as any)(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);

        // implicitly clones the keys
        clone.setKeys(this.getKeys());

        clone.enableBlending = this.enableBlending;
        clone.blendingSpeed = this.blendingSpeed;
        clone.frameStride = this.frameStride;
        clone.stride = this.stride;
        clone.valueOffset = this.valueOffset;

        if (this._frames && this._values) {
            if (CompactAnimation.DeepCloneBuffers) {
                clone._frames = this._frames.slice();
                clone._values = this._values.slice();
            } else {
                clone._frames = this._frames;
                clone._values = this._values;
            }
        }

        if (this._ranges) {
            clone._ranges = {};
            for (const name in this._ranges) {
                const range = this._ranges[name];
                if (!range) {
                    continue;
                }
                clone._ranges[name] = range.clone();
            }
        }

        return clone;
    }

    /**
     * Interpolates a quaternion using a spherical linear interpolation
     * In CompactAnimation is is rewritten to write the result to `endValue`
     * to reduce memory allocations.
     *
     * @param startValue Start value of the animation curve
     * @param endValue End value of the animation curve
     * @param gradient Scalar amount to interpolate
     * @returns Interpolated quaternion value
     */
    public quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion {
        Quaternion.SlerpToRef(startValue, endValue, gradient, endValue);
        return endValue;
    }

    /**
     * Interpolates a Vector3 linearly
     * In CompactAnimation is is rewritten to write the result to `endValue`
     * to reduce memory allocations.
     *
     * @param startValue Start value of the animation curve
     * @param endValue End value of the animation curve
     * @param gradient Scalar amount to interpolate (value between 0 and 1)
     * @returns Interpolated scalar value
     */
    public vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3 {
        Vector3.LerpToRef(startValue, endValue, gradient, endValue);
        return endValue;
    }
    /**
     * Interpolates a Color3 linearly
     * In CompactAnimation is is rewritten to write the result to `endValue`
     * to reduce memory allocations.
     *
     * @param startValue Start value of the animation curve
     * @param endValue End value of the animation curve
     * @param gradient Scalar amount to interpolate
     * @returns Interpolated Color3 value
     */
    public color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3 {
        Color3.LerpToRef(startValue, endValue, gradient, endValue);
        return endValue;
    }

    /**
     * Interpolates a Color4 linearly
     * In CompactAnimation is is rewritten to write the result to `endValue`
     * to reduce memory allocations.
     *
     * @param startValue Start value of the animation curve
     * @param endValue End value of the animation curve
     * @param gradient Scalar amount to interpolate
     * @returns Interpolated Color3 value
     */
    public color4InterpolateFunction(startValue: Color4, endValue: Color4, gradient: number): Color4 {
        Color4.LerpToRef(startValue, endValue, gradient, endValue);
        return endValue;
    }

    /**
     * Keep the first key and last key for AnimationGroup
     * Note in CompactAnimation this is only kept to be compatible with AnimationGroups
     * @param values The animation key frames to set
     */
    public setKeys(values: IAnimationKey[]): void {
        if (values.length > 2) {
            values = [values[0], values[values.length - 1]];
            super.setKeys(values);
            return;
        }
        super.setKeys(values);
    }

    /**
     * Check if the buffers is compact
     */
    public isBuffersCompact(): boolean {
        return this.frameStride === 1 && strideMap[this.dataType] === this.stride;
    }

    /**
     * Compact the frames and values buffers
     * TODO: compact for gltf with 4-bytes alignment for each item for quantized values
     * @returns success or not
     */
    public compactBuffers(): boolean {
        const compactFrames = this.compactFrames();
        const compactValues = this.compactValues();
        return compactFrames || compactValues;
    }

    /**
     * Compact the frames buffer
     * @returns success or not
     */
    public compactFrames(): boolean {
        const frameStride = this.frameStride;
        if (frameStride === 1) {
            return false;
        }
        let writeIndex = 0;
        const frames = this._frames;
        if (!frames) {
            return false;
        }
        const length = frames.length;
        const writeFrames = new (frames.constructor as TypedArrayConstructor)(length / frameStride);

        for (let i = 0; i < length; i += frameStride) {
            writeFrames[writeIndex++] = frames[i];
        }

        this._frames = writeFrames;
        this.frameStride = 1;
        return true;
    }

    /**
     * Compact the values buffer
     * @returns success or not
     */
    public compactValues(): boolean {
        const stride = this.stride;
        const compactStride = strideMap[this.dataType] || stride;
        if (compactStride === stride) {
            return false;
        }
        let writeIndex = 0;
        const values = this._values;
        if (!values) {
            return false;
        }
        const length = values.length;
        const valueOffset = this.valueOffset;
        const compactLength = (length * compactStride) / stride;
        const writeValues = new (values.constructor as TypedArrayConstructor)(compactLength);

        for (let i = 0; i < length; i += stride) {
            for (let j = 0; j < compactStride; j++) {
                writeValues[writeIndex++] = values[i + j + valueOffset];
            }
        }

        this._values = writeValues;
        this.stride = compactStride;
        this.valueOffset = 0;
        return true;
    }

    /**
     * Serializes the animation to an object
     * @returns Serialized object
     */
    public serialize(): any {
        if (CompactAnimation.SerializeCompactBuffers && !this.isBuffersCompact()) {
            const clone = this.clone();
            clone.compactBuffers();
            return clone.serialize();
        }
        const serializationObject = super.serialize();
        serializationObject.customType = this.getClassName();
        serializationObject.frameStride = this.frameStride;
        serializationObject.stride = this.stride;
        serializationObject.interpolation = this.interpolation;
        serializationObject.normalizeScalar = this.normalizeScalar;
        serializationObject.valueOffset = this.valueOffset;
        if (this._frames) {
            // The name of TypedArray constructor is defined is spec
            // https://262.ecma-international.org/13.0/#table-the-typedarray-constructors
            serializationObject._framesType = this._frames.constructor.name;
        }
        if (this._values) {
            serializationObject._valuesType = this._values.constructor.name;
        }
        if (CompactAnimation.SerializeBuffersToBase64) {
            if (this._frames) {
                serializationObject._frames = EncodeArrayBufferToBase64(this._frames);
            }
            if (this._values) {
                serializationObject._values = EncodeArrayBufferToBase64(this._values);
            }
        } else {
            if (this._frames) {
                serializationObject._frames = this._frames;
            }
            if (this._values) {
                serializationObject._values = this._values;
            }
        }
        return serializationObject;
    }

    /**
     * This is a copy of {@link Animation.Parse}, removed tangent related code,
     * for parsing data from serialized subclasses of CompactAnimation
     *
     * @param parsedAnimation The serialized animation object
     * @param animation The instance of {@link Animation} to write parsed data to
     * @internal
     */
    public static _ParseAnimation(parsedAnimation: any, animation: Animation): Animation {
        const dataType = parsedAnimation.dataType;
        const keys: IAnimationKey[] = [];
        let data;
        let index: number;
        if (parsedAnimation.enableBlending) {
            animation.enableBlending = parsedAnimation.enableBlending;
        }
        if (parsedAnimation.blendingSpeed) {
            animation.blendingSpeed = parsedAnimation.blendingSpeed;
        }
        for (index = 0; index < parsedAnimation.keys.length; index++) {
            const key = parsedAnimation.keys[index];
            let interpolation: any = undefined;
            switch (dataType) {
                case Animation.ANIMATIONTYPE_FLOAT:
                    data = key.values[0];
                    if (key.values.length >= 4) {
                        interpolation = key.values[3];
                    }
                    break;
                case Animation.ANIMATIONTYPE_QUATERNION:
                    data = Quaternion.FromArray(key.values);
                    if (key.values.length >= 13) {
                        interpolation = key.values[12];
                    }
                    break;
                case Animation.ANIMATIONTYPE_MATRIX:
                    data = Matrix.FromArray(key.values);
                    if (key.values.length >= 17) {
                        interpolation = key.values[16];
                    }
                    break;
                case Animation.ANIMATIONTYPE_COLOR3:
                    data = Color3.FromArray(key.values);
                    if (key.values[5]) {
                        interpolation = key.values[5];
                    }
                    break;
                case Animation.ANIMATIONTYPE_COLOR4:
                    data = Color4.FromArray(key.values);
                    if (key.values[6]) {
                        interpolation = Color4.FromArray(key.values[6]);
                    }
                    break;
                case Animation.ANIMATIONTYPE_VECTOR3:
                default:
                    data = Vector3.FromArray(key.values);
                    if (key.values[5]) {
                        interpolation = key.values[5];
                    }
                    break;
            }
            const keyData: IAnimationKey = {
                frame: key.frame,
                value: data,
            };
            if (interpolation != undefined) {
                keyData.interpolation = interpolation;
            }
            keys.push(keyData);
        }
        animation.setKeys(keys);
        if (parsedAnimation.ranges) {
            for (index = 0; index < parsedAnimation.ranges.length; index++) {
                data = parsedAnimation.ranges[index];
                animation.createRange(data.name, data.from, data.to);
            }
        }
        return animation;
    }

    /**
     * Parses serialized animation object and creates an instance of CompactAnimation
     *
     * @param parsedAnimation The serialized animation object
     * @param constructor The constructor of type of CompactAnimation
     * @internal
     */
    public static ParseInternal<T>(parsedAnimation: any, constructor: CompactAnimationTypes): CompactAnimation<T> {
        const animation: CompactAnimation<T> = new (constructor as any)(
            parsedAnimation.name,
            parsedAnimation.property,
            parsedAnimation.framePerSecond,
            parsedAnimation.dataType,
            parsedAnimation.loopBehavior
        );
        CompactAnimation._ParseAnimation(parsedAnimation, animation);

        animation.frameStride = parsedAnimation.frameStride || 1;
        animation.stride = parsedAnimation.stride || strideMap[parsedAnimation.dataType];
        animation.interpolation = parsedAnimation.interpolation;
        animation.normalizeScalar = parsedAnimation.normalizeScalar;
        animation.valueOffset = parsedAnimation.valueOffset;

        if (typeof parsedAnimation._frames === "string") {
            const arrayBuffer = DecodeBase64ToBinary(parsedAnimation._frames);
            animation._frames = new typedArrayMap[parsedAnimation._framesType](arrayBuffer);
        } else {
            animation._frames = parsedAnimation._frames;
        }
        if (typeof parsedAnimation._values === "string") {
            const arrayBuffer = DecodeBase64ToBinary(parsedAnimation._values);
            animation._values = new typedArrayMap[parsedAnimation._valuesType](arrayBuffer);
        } else {
            animation._values = parsedAnimation._values;
        }
        return animation;
    }
}

/**
 * Set this to true to serialize frames and values to base64.
 * Set this to false to get TypedArrays in serialized result.
 */
CompactAnimation.SerializeBuffersToBase64 = true;

/**
 * Whether to clone frames and values on {@link CompactAnimation#clone}
 */
CompactAnimation.DeepCloneBuffers = false;

/**
 * Whether to compact buffers for frames and values on {@link CompactAnimation#serialize}
 * Note this would clone the CompactAnimation and return serialized compacted clone
 * Defaults to false
 */
CompactAnimation.SerializeCompactBuffers = false;

RegisterClass("BABYLON.CompactAnimation", CompactAnimation);

/**
 * Float number based {@link CompactAnimation}
 */
export class FloatCompactAnimation extends CompactAnimation<number> {
    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.FloatCompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): number {
        return this._startValueAt(offset, stride);
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): number {
        const valueOffset = this.valueOffset;
        let val = this._values![offset * stride + valueOffset];
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val *= normalizeScalar;
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): number {
        const valueOffset = this.valueOffset;
        let val = this._values![offset * stride + valueOffset];
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val *= normalizeScalar;
        }
        return val;
    }

    /**
     * Interpolates a float value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: number, endValue: number, gradient: number, state: _IAnimationState): number {
        const floatValue = this.floatInterpolateFunction(startValue, endValue, gradient);
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            return state.offsetValue * state.repeatCount + floatValue;
        }
        return floatValue;
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized FloatCompactAnimation
     * @returns Animation object
     */
    public static Parse(parsedAnimation: any): FloatCompactAnimation {
        return CompactAnimation.ParseInternal(parsedAnimation, FloatCompactAnimation);
    }
}

RegisterClass("BABYLON.FloatCompactAnimation", FloatCompactAnimation);

/**
 * {@link Quaternion} based {@link CompactAnimation}
 */
export class QuaternionCompactAnimation extends CompactAnimation<Quaternion> {
    /** @internal */
    public _tmpVal0: Quaternion;
    /** @internal */
    public _tmpVal1: Quaternion;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._tmpVal0 = new Quaternion();
        this._tmpVal1 = new Quaternion();
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.QuaternionCompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): Quaternion {
        return this._startValueAt(offset, stride).clone();
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns Quaternion at offset and stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): Quaternion {
        const val = this._tmpVal0;
        const valueOffset = this.valueOffset;
        Quaternion.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning Quaternion must be writable and may be written to
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): Quaternion {
        const val = this._tmpVal1;
        const valueOffset = this.valueOffset;
        Quaternion.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Interpolates a value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: Quaternion, endValue: Quaternion, gradient: number, state: _IAnimationState): Quaternion {
        const quaternion = this.quaternionInterpolateFunction(startValue, endValue, gradient);
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            state.offsetValue.scaleAndAddToRef(state.repeatCount, quaternion);
        }
        return quaternion;
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized QuaternionCompactAnimation
     * @returns Animation object
     */
    public static Parse(parsedAnimation: any): QuaternionCompactAnimation {
        return CompactAnimation.ParseInternal(parsedAnimation, QuaternionCompactAnimation) as QuaternionCompactAnimation;
    }
}

RegisterClass("BABYLON.QuaternionCompactAnimation", QuaternionCompactAnimation);

/**
 * {@link Vector3} based {@link CompactAnimation}
 */
export class Vector3CompactAnimation extends CompactAnimation<Vector3> {
    /** @internal */
    public _tmpVal0: Vector3;
    /** @internal */
    public _tmpVal1: Vector3;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._tmpVal0 = new Vector3();
        this._tmpVal1 = new Vector3();
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.Vector3CompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): Vector3 {
        return this._startValueAt(offset, stride).clone();
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): Vector3 {
        const val = this._tmpVal0;
        const valueOffset = this.valueOffset;
        Vector3.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): Vector3 {
        const val = this._tmpVal1;
        const valueOffset = this.valueOffset;
        Vector3.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Interpolates a Vector3 value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: Vector3, endValue: Vector3, gradient: number, state: _IAnimationState): Vector3 {
        const vec3Value = this.vector3InterpolateFunction(startValue, endValue, gradient);
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            state.offsetValue.scaleAndAddToRef(state.repeatCount, vec3Value);
        }
        return vec3Value;
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized Vector3CompactAnimation
     * @returns Animation object
     */
    static Parse(parsedAnimation: any): Vector3CompactAnimation {
        return CompactAnimation.ParseInternal(parsedAnimation, Vector3CompactAnimation) as Vector3CompactAnimation;
    }
}

RegisterClass("BABYLON.Vector3CompactAnimation", Vector3CompactAnimation);

/**
 * {@link Vector2} based {@link CompactAnimation}
 */
export class Vector2CompactAnimation extends CompactAnimation<Vector2> {
    /** @internal */
    public _tmpVal0: Vector2;
    /** @internal */
    public _tmpVal1: Vector2;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._tmpVal0 = new Vector2();
        this._tmpVal1 = new Vector2();
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.Vector2CompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): Vector2 {
        return this._startValueAt(offset, stride).clone();
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): Vector2 {
        const val = this._tmpVal0;
        const valueOffset = this.valueOffset;
        Vector2.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): Vector2 {
        const val = this._tmpVal1;
        const valueOffset = this.valueOffset;
        Vector2.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Interpolates a Vector2 value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: Vector2, endValue: Vector2, gradient: number, state: _IAnimationState): Vector2 {
        const vec2Value = this.vector2InterpolateFunction(startValue, endValue, gradient);
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            state.offsetValue.scaleAndAddToRef(state.repeatCount, vec2Value);
        }
        return vec2Value;
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized Vector2CompactAnimation
     * @returns Animation object
     */
    public static Parse(parsedAnimation: any): Animation {
        return CompactAnimation.ParseInternal(parsedAnimation, Vector2CompactAnimation);
    }
}

RegisterClass("BABYLON.Vector2CompactAnimation", Vector2CompactAnimation);

/**
 * {@link Size} based {@link CompactAnimation}
 */
export class SizeCompactAnimation extends CompactAnimation<Size> {
    /** @internal */
    public _tmpVal0: Size;
    /** @internal */
    public _tmpVal1: Size;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._tmpVal0 = new Size(0, 0);
        this._tmpVal1 = new Size(0, 0);
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.SizeCompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): Size {
        return this._startValueAt(offset, stride).clone();
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): Size {
        const val = this._tmpVal0;
        const array = this._values!;
        const valueOffset = this.valueOffset;
        let arrayOffset = stride * offset + valueOffset;
        val.width = array[arrayOffset++];
        val.height = array[arrayOffset];
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.width = val.width * normalizeScalar;
            val.height = val.height * normalizeScalar;
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): Size {
        const val = this._tmpVal1;
        const array = this._values!;
        const valueOffset = this.valueOffset;
        let arrayOffset = stride * offset + valueOffset;
        val.width = array[arrayOffset++];
        val.height = array[arrayOffset];
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.width = val.width * normalizeScalar;
            val.height = val.height * normalizeScalar;
        }
        return val;
    }

    /**
     * Interpolates a Size value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: Size, endValue: Size, gradient: number, state: _IAnimationState): Size {
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            return this.sizeInterpolateFunction(startValue, endValue, gradient).add(state.offsetValue.scale(state.repeatCount));
        }
        return this.sizeInterpolateFunction(startValue, endValue, gradient);
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized SizeCompactAnimation
     * @returns Animation object
     */
    public static Parse(parsedAnimation: any): SizeCompactAnimation {
        return CompactAnimation.ParseInternal(parsedAnimation, SizeCompactAnimation) as SizeCompactAnimation;
    }
}

RegisterClass("BABYLON.SizeCompactAnimation", SizeCompactAnimation);

/**
 * {@link Color3} based {@link CompactAnimation}
 */
export class Color3CompactAnimation extends CompactAnimation<Color3> {
    /** @internal */
    public _tmpVal0: Color3;
    /** @internal */
    public _tmpVal1: Color3;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._tmpVal0 = new Color3();
        this._tmpVal1 = new Color3();
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.Color3CompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): Color3 {
        return this._startValueAt(offset, stride).clone();
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): Color3 {
        const val = this._tmpVal0;
        const valueOffset = this.valueOffset;
        Color3.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): Color3 {
        const val = this._tmpVal1;
        const valueOffset = this.valueOffset;
        Color3.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Interpolates a Color3 value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: Color3, endValue: Color3, gradient: number, state: _IAnimationState): Color3 {
        const color3Value = this.color3InterpolateFunction(startValue, endValue, gradient);
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            state.offsetValue.scaleAndAddToRef(color3Value);
        }
        return color3Value;
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized Color3CompactAnimation
     * @returns Animation object
     */
    public static Parse(parsedAnimation: any): Color3CompactAnimation {
        return CompactAnimation.ParseInternal(parsedAnimation, Color3CompactAnimation) as Color3CompactAnimation;
    }
}

RegisterClass("BABYLON.Color3CompactAnimation", Color3CompactAnimation);

/**
 * {@link Color4} based {@link CompactAnimation}
 */
export class Color4CompactAnimation extends CompactAnimation<Color4> {
    /** @internal */
    public _tmpVal0: Color4;
    /** @internal */
    public _tmpVal1: Color4;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._tmpVal0 = new Color4();
        this._tmpVal1 = new Color4();
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.Color4CompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): Color4 {
        return this._startValueAt(offset, stride).clone();
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): Color4 {
        const val = this._tmpVal0;
        const valueOffset = this.valueOffset;
        Color4.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): Color4 {
        const val = this._tmpVal1;
        const valueOffset = this.valueOffset;
        Color4.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleInPlace(normalizeScalar);
        }
        return val;
    }

    /**
     * Interpolates a Color4 value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: Color4, endValue: Color4, gradient: number, state: _IAnimationState): Color4 {
        const color4Value = this.color4InterpolateFunction(startValue, endValue, gradient);
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            state.offsetValue.scaleAndAddToRef(state.repeatCount, color4Value);
        }
        return color4Value;
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized Color4CompactAnimation
     * @returns Animation object
     */
    public static Parse(parsedAnimation: any): Color4CompactAnimation {
        return CompactAnimation.ParseInternal(parsedAnimation, Color4CompactAnimation) as Color4CompactAnimation;
    }
}

RegisterClass("BABYLON.Color4CompactAnimation", Color4CompactAnimation);

/**
 * {@link Matrix} based {@link CompactAnimation}
 */
export class MatrixCompactAnimation extends CompactAnimation<Matrix> {
    /** @internal */
    public _tmpVal0: Matrix;
    /** @internal */
    public _tmpVal1: Matrix;

    /**
     * Initializes the animation
     * @param name Name of the animation
     * @param targetProperty Property to animate
     * @param framePerSecond The frames per second of the animation
     * @param dataType The data type of the animation
     * @param loopMode The loop mode of the animation
     * @param enableBlending Specifies if blending should be enabled
     */
    constructor(
        /**Name of the animation */
        name: string,
        /**Property to animate */
        targetProperty: string,
        /**The frames per second of the animation */
        framePerSecond: number,
        /**The data type of the animation */
        dataType: number,
        /**The loop mode of the animation */
        loopMode?: number,
        /**Specifies if blending should be enabled */
        enableBlending?: boolean
    ) {
        super(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending);
        this._tmpVal0 = new Matrix();
        this._tmpVal1 = new Matrix();
    }

    /**
     * Get the current class name of the animation useful for serialization or dynamic coding.
     */
    public getClassName(): string {
        return "BABYLON.MatrixCompactAnimation";
    }

    /**
     * Gets and clone value at offset and stride for external usage
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _cloneValueAt(offset: number, stride: number): Matrix {
        return this._startValueAt(offset, stride).clone();
    }

    /**
     * Gets the start value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @internal Internal use only
     */
    public _startValueAt(offset: number, stride: number): Matrix {
        const val = this._tmpVal0;
        const valueOffset = this.valueOffset;
        Matrix.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleToRef(normalizeScalar, val);
        }
        return val;
    }

    /**
     * Gets the end value at offset and stride for interpolation
     * @param offset
     * @param stride
     * @returns The returning value must be writable and may be written
     * @internal Internal use only
     */
    public _endValueAt(offset: number, stride: number): Matrix {
        const val = this._tmpVal1;
        const valueOffset = this.valueOffset;
        Matrix.FromArrayToRef(this._values!, stride * offset + valueOffset, val);
        const normalizeScalar = this.normalizeScalar;
        if (normalizeScalar) {
            val.scaleToRef(normalizeScalar, val);
        }
        return val;
    }

    /**
     * Interpolates a value linearly, could write result to endValue
     * @internal Internal use only
     */
    public _interpolateInternal(startValue: Matrix, endValue: Matrix, gradient: number, state: _IAnimationState): Matrix {
        if (state.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE) {
            return startValue;
        }
        if (Animation.AllowMatricesInterpolation) {
            return this.matrixInterpolateFunction(startValue, endValue, gradient, state.workValue || endValue);
        }
        return startValue;
    }

    /**
     * Parses an animation object and creates an animation
     * @param parsedAnimation Parsed animation object of serialized MatrixCompactAnimation
     * @returns Animation object
     */
    public static Parse(parsedAnimation: any): MatrixCompactAnimation {
        return CompactAnimation.ParseInternal(parsedAnimation, MatrixCompactAnimation) as MatrixCompactAnimation;
    }
}

RegisterClass("BABYLON.MatrixCompactAnimation", MatrixCompactAnimation);

/**
 * Mapping from animation type to CompactAnimation classes
 */
export const compactAnimationTypeMap: Record<number, CompactAnimationTypes> = {
    [Animation.ANIMATIONTYPE_FLOAT]: FloatCompactAnimation,
    [Animation.ANIMATIONTYPE_VECTOR3]: Vector3CompactAnimation,
    [Animation.ANIMATIONTYPE_QUATERNION]: QuaternionCompactAnimation,
    [Animation.ANIMATIONTYPE_MATRIX]: MatrixCompactAnimation,
    [Animation.ANIMATIONTYPE_COLOR3]: Color3CompactAnimation,
    [Animation.ANIMATIONTYPE_COLOR4]: Color4CompactAnimation,
    [Animation.ANIMATIONTYPE_VECTOR2]: Vector2CompactAnimation,
    [Animation.ANIMATIONTYPE_SIZE]: SizeCompactAnimation,
};
