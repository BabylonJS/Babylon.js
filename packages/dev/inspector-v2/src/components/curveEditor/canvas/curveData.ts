import { CurveEditorInterpolation, type CurveEditorKey, type ICurveEditorAnimation } from "../curveEditorModel";
import { type KeyPoint } from "../normalizedCurveEditorContext";
import { Observable } from "core/Misc/observable";

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface KeyEntry {
    frame: number;
    value: number;
    inTangent?: number;
    outTangent?: number;
    lockedTangent: boolean;
    interpolation?: CurveEditorInterpolation;
}

const Float32Value = new Float32Array(1);
const Float32Bits = new Uint32Array(Float32Value.buffer);

function AdjacentFloat32(value: number, direction: 1 | -1): number {
    Float32Value[0] = value;
    if ((direction > 0 && Float32Value[0] > value) || (direction < 0 && Float32Value[0] < value)) {
        return Float32Value[0];
    }
    if (Float32Value[0] === 0) {
        Float32Bits[0] = direction > 0 ? 1 : 0x80000001;
    } else {
        Float32Bits[0] += Float32Value[0] > 0 ? direction : -direction;
    }
    return Float32Value[0];
}

function FrameBounds(
    keys: readonly { frame: number }[],
    index: number,
    minFrame: number,
    maxFrame: number,
    spacing: number,
    frameRate: number | undefined,
    selected?: ReadonlySet<number>
): [number, number] {
    let min = minFrame;
    let max = maxFrame;
    if (frameRate !== undefined && Number.isFinite(max)) {
        const time = max / frameRate;
        if (Math.fround(time) > time) {
            max = AdjacentFloat32(time, -1) * frameRate;
        }
    }
    if (index > 0 && !selected?.has(index - 1)) {
        const previous = keys[index - 1].frame;
        min = Math.max(min, previous + spacing, frameRate === undefined ? -Infinity : AdjacentFloat32(previous / frameRate, 1) * frameRate);
    }
    if (index < keys.length - 1 && !selected?.has(index + 1)) {
        const next = keys[index + 1].frame;
        max = Math.min(max, next - spacing, frameRate === undefined ? Infinity : AdjacentFloat32(next / frameRate, -1) * frameRate);
    }
    return [min, max];
}

/**
 * Clamps a frame to a clip whose key times are stored as Float32 seconds.
 * @param frame Requested frame.
 * @param maxFrame Clip end frame.
 * @param frameRate Frames per second.
 * @returns A representable frame within the clip.
 */
export function ClampFrameToClip(frame: number, maxFrame: number, frameRate: number): number {
    const time = maxFrame / frameRate;
    const lastTime = Math.fround(time) > time ? AdjacentFloat32(time, -1) : time;
    return Math.max(0, Math.min(frame, maxFrame, lastTime * frameRate));
}

/**
 * Clamps a single key retime to the clip and its neighbors.
 * @param curve The curve containing the key.
 * @param index The key index.
 * @param frame Requested frame.
 * @param minFrame Minimum allowed frame.
 * @param maxFrame Maximum allowed frame.
 * @param spacing Minimum frame spacing.
 * @param float32Time Whether the host stores key times as Float32 seconds.
 * @returns A valid frame, or the original frame if no valid interval exists.
 */
export function ClampKeyFrame(curve: CurveData, index: number, frame: number, minFrame: number, maxFrame: number, spacing: number, float32Time: boolean): number {
    const [min, max] = FrameBounds(curve.keys, index, minFrame, maxFrame, spacing, float32Time ? curve.animation.framePerSecond : undefined);
    return min <= max ? Math.max(min, Math.min(max, frame)) : curve.keys[index].frame;
}

/**
 * Moves selected keys together, keeping each track ordered and within the clip.
 * @param points Selected curve points.
 * @param delta Requested frame delta.
 * @param minFrame Minimum clip frame.
 * @param maxFrame Maximum clip frame.
 * @param spacing Minimum frame distance from unselected keys.
 * @param lockBoundaryFrames Whether the first and last keys are fixed.
 * @param lockLastFrame Whether the last key is fixed.
 * @returns The applied frame delta.
 */
export function MoveSelectedKeyFrames(
    points: readonly KeyPoint[],
    delta: number,
    minFrame: number,
    maxFrame: number,
    spacing: number,
    lockBoundaryFrames: boolean,
    lockLastFrame: boolean
): number {
    const groups = new Map<object, { animation: ICurveEditorAnimation; keys: CurveEditorKey[]; indices: Set<number>; curves: Set<CurveData> }>();
    for (const point of points) {
        const animation = point.curve.animation;
        let group = groups.get(animation.source);
        if (!group) {
            group = { animation, keys: animation.getKeys(), indices: new Set(), curves: new Set() };
            groups.set(animation.source, group);
        }
        group.indices.add(point.keyId);
        for (const sibling of point.curve.siblings.length ? point.curve.siblings : [point.curve]) {
            group.curves.add(sibling);
        }
    }

    let minDelta = -Infinity;
    let maxDelta = Infinity;
    for (const { animation, keys, indices } of groups.values()) {
        for (const index of indices) {
            const frame = keys[index].frame;
            if ((lockBoundaryFrames && (index === 0 || index === keys.length - 1)) || (lockLastFrame && index === keys.length - 1)) {
                minDelta = Math.max(minDelta, 0);
                maxDelta = Math.min(maxDelta, 0);
            }
            const [min, max] = FrameBounds(keys, index, minFrame, maxFrame, spacing, animation.framePerSecond, indices);
            minDelta = Math.max(minDelta, min - frame);
            maxDelta = Math.min(maxDelta, max - frame);
        }
    }

    const appliedDelta = minDelta <= maxDelta ? Math.max(minDelta, Math.min(maxDelta, delta)) : 0;
    if (appliedDelta === 0) {
        return 0;
    }
    for (const { animation, keys, indices } of groups.values()) {
        let previousTime = -Infinity;
        for (let index = 0; index < keys.length; index++) {
            const frame = keys[index].frame + (indices.has(index) ? appliedDelta : 0);
            const time = Math.fround(frame / animation.framePerSecond);
            if (time <= previousTime || frame < minFrame || frame > maxFrame || time > maxFrame / animation.framePerSecond) {
                return 0;
            }
            previousTime = time;
        }
    }
    for (const { animation, keys, indices, curves } of groups.values()) {
        for (const index of indices) {
            keys[index].frame += appliedDelta;
        }
        animation.setKeys(keys);
        for (const curve of curves) {
            for (const index of indices) {
                curve.keys[index].frame = keys[index].frame;
            }
            curve.onDataUpdatedObservable.notifyObservers();
        }
    }
    return appliedDelta;
}

export class CurveData {
    public static readonly SampleRate = 50;
    public keys: KeyEntry[] = [];
    public animation: ICurveEditorAnimation;
    public color: string;
    public onDataUpdatedObservable = new Observable<void>();
    public componentIndex?: number;
    public siblings: CurveData[] = [];

    public static readonly TangentLength = 50;

    public constructor(color: string, animation: ICurveEditorAnimation, componentIndex?: number) {
        this.color = color;
        this.animation = animation;
        this.componentIndex = componentIndex;
    }

    public getPathData(convertX: (x: number) => number, convertY: (y: number) => number): string {
        const keys = this.keys;
        if (keys.length < 2) {
            return "";
        }
        let evaluate: ((frame: number) => readonly number[]) | undefined;
        let pathData = `M${convertX(keys[0].frame)} ${convertY(keys[0].value)}`;

        for (let keyIndex = 1; keyIndex < keys.length; keyIndex++) {
            const outTangent = keys[keyIndex - 1].outTangent;
            const inTangent = keys[keyIndex].inTangent;
            const currentFrame = keys[keyIndex].frame;
            const currentValue = keys[keyIndex].value;
            const prevFrame = keys[keyIndex - 1].frame;
            const prevValue = keys[keyIndex - 1].value;
            const frameDist = currentFrame - prevFrame;
            const prevInterpolation = keys[keyIndex - 1].interpolation;

            if (prevInterpolation === CurveEditorInterpolation.Step) {
                pathData += `L ${convertX(currentFrame)} ${convertY(prevValue)}`;
                pathData += `L ${convertX(currentFrame)} ${convertY(currentValue)}`;
                continue;
            }

            if (outTangent === undefined && inTangent === undefined && this.animation.kind !== "quaternion") {
                pathData += ` L${convertX(currentFrame)} ${convertY(currentValue)}`;
                continue;
            }

            evaluate ??= this.animation.createEvaluator?.() ?? ((frame: number) => this.animation.evaluate(frame));
            for (let frame = prevFrame; frame < currentFrame; frame += frameDist / CurveData.SampleRate) {
                const keyValue = evaluate(frame);
                pathData += ` L${convertX(frame)} ${convertY(keyValue[this._componentIndex()] ?? 0)}`;
            }
            pathData += ` L${convertX(currentFrame)} ${convertY(currentValue)}`;
        }

        return pathData;
    }

    public updateLockedTangentMode(keyIndex: number, enabled: boolean): void {
        this.keys[keyIndex].lockedTangent = enabled;
        const animationKeys = this.animation.getKeys();
        animationKeys[keyIndex].lockedTangent = enabled;
        this.animation.setKeys(animationKeys);
    }

    public updateInterpolationMode(keyIndex: number, interpolationMode: CurveEditorInterpolation): void {
        this.keys[keyIndex].interpolation = interpolationMode;

        const animationKeys = this.animation.getKeys();
        animationKeys[keyIndex].interpolation = interpolationMode;
        this.animation.setKeys(animationKeys);

        this.onDataUpdatedObservable.notifyObservers();
    }

    public getInControlPoint(keyIndex: number): number {
        if (keyIndex === 0) {
            return 0;
        }

        const key = this.keys[keyIndex];
        if (key.inTangent === undefined && this.hasDefinedInTangent(keyIndex)) {
            return this.evaluateInTangent(keyIndex);
        }

        return key.inTangent ?? 0;
    }

    public getOutControlPoint(keyIndex: number): number {
        if (keyIndex === this.keys.length - 1) {
            return 0;
        }

        const key = this.keys[keyIndex];
        if (key.outTangent === undefined && this.hasDefinedOutTangent(keyIndex)) {
            return this.evaluateOutTangent(keyIndex);
        }

        return key.outTangent ?? 0;
    }

    public hasDefinedOutTangent(keyIndex: number): boolean {
        if (keyIndex === this.keys.length - 1) {
            return false;
        }
        return this.keys[keyIndex].frame !== this.keys[keyIndex + 1].frame;
    }

    public evaluateOutTangent(keyIndex: number): number {
        const current = this.keys[keyIndex];
        const next = this.keys[keyIndex + 1];
        return (next.value - current.value) / (next.frame - current.frame);
    }

    public hasDefinedInTangent(keyIndex: number): boolean {
        if (keyIndex === 0) {
            return false;
        }
        return this.keys[keyIndex - 1].frame !== this.keys[keyIndex].frame;
    }

    public evaluateInTangent(keyIndex: number): number {
        const previous = this.keys[keyIndex - 1];
        const current = this.keys[keyIndex];
        return (current.value - previous.value) / (current.frame - previous.frame);
    }

    public storeDefaultInTangent(keyIndex: number): void {
        const keys = this.animation.getKeys();
        this._ensureTangent(keys, keyIndex, "inTangent");
        if (this.hasDefinedInTangent(keyIndex)) {
            this.keys[keyIndex].inTangent = this.evaluateInTangent(keyIndex);
        }
        this._setTangentComponent(keys, keyIndex, "inTangent", this.keys[keyIndex].inTangent ?? 0);
    }

    public storeDefaultOutTangent(keyIndex: number): void {
        const keys = this.animation.getKeys();
        this._ensureTangent(keys, keyIndex, "outTangent");
        if (this.hasDefinedOutTangent(keyIndex)) {
            this.keys[keyIndex].outTangent = this.evaluateOutTangent(keyIndex);
        }
        this._setTangentComponent(keys, keyIndex, "outTangent", this.keys[keyIndex].outTangent ?? 0);
    }

    public updateInTangentFromControlPoint(keyId: number, slope: number): void {
        this.keys[keyId].inTangent = slope;
        const keys = this.animation.getKeys();
        this._ensureTangent(keys, keyId, "inTangent");
        if (keys[keyId - 1].outTangent === undefined) {
            this._ensureTangent(keys, keyId - 1, "outTangent");
        }
        this._setTangentComponent(keys, keyId, "inTangent", slope);
        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateOutTangentFromControlPoint(keyId: number, slope: number): void {
        this.keys[keyId].outTangent = slope;
        const keys = this.animation.getKeys();
        this._ensureTangent(keys, keyId, "outTangent");
        if (keys[keyId + 1].inTangent === undefined) {
            this._ensureTangent(keys, keyId + 1, "inTangent");
        }
        this._setTangentComponent(keys, keyId, "outTangent", slope);
        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateKeyFrame(keyId: number, frame: number): void {
        const animationKeys = this.animation.getKeys();
        animationKeys[keyId].frame = frame;
        this.animation.setKeys(animationKeys);
        this.keys[keyId].frame = frame;

        for (const sibling of this.siblings) {
            if (sibling !== this && sibling.keys[keyId]) {
                sibling.keys[keyId].frame = frame;
                sibling.onDataUpdatedObservable.notifyObservers();
            }
        }

        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateKeyValue(keyId: number, value: number): void {
        this.keys[keyId].value = value;
        const animationKeys = this.animation.getKeys();
        const key = animationKeys[keyId];
        const values = Array.from(key.value);
        values[this._componentIndex()] = value;
        key.value = values;
        this.animation.setKeys(animationKeys);
        this.onDataUpdatedObservable.notifyObservers();
    }

    private _componentIndex(): number {
        return this.componentIndex ?? 0;
    }

    private _setTangentComponent(keys: CurveEditorKey[], keyIndex: number, tangent: "inTangent" | "outTangent", value: number): void {
        const key = keys[keyIndex];
        const tangentValues = Array.from(key[tangent] ?? new Array(this.animation.components.length).fill(0));
        tangentValues[this._componentIndex()] = value;
        key[tangent] = tangentValues;
        this.animation.setKeys(keys);
        for (const curve of this.siblings) {
            for (let index = 0; index < keys.length; index++) {
                curve.keys[index].inTangent = keys[index].inTangent?.[curve._componentIndex()];
                curve.keys[index].outTangent = keys[index].outTangent?.[curve._componentIndex()];
            }
            if (curve !== this) {
                curve.onDataUpdatedObservable.notifyObservers();
            }
        }
    }

    private _ensureTangent(keys: CurveEditorKey[], keyIndex: number, tangent: "inTangent" | "outTangent"): void {
        const key = keys[keyIndex];
        if (key[tangent] !== undefined) {
            return;
        }
        const tangentValues = new Array<number>(this.animation.components.length).fill(0);
        const neighbor = tangent === "inTangent" ? keys[keyIndex - 1] : keys[keyIndex + 1];
        if (neighbor) {
            const frameDelta = key.frame - neighbor.frame;
            if (frameDelta !== 0) {
                for (let component = 0; component < tangentValues.length; component++) {
                    tangentValues[component] = (key.value[component] - neighbor.value[component]) / frameDelta;
                }
            }
        }
        key[tangent] = tangentValues;
    }
}
