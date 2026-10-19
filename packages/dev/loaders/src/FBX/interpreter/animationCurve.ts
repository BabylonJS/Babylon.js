/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
/**
 * FBX animation curve model and evaluator.
 *
 * Keys carry cubic Bezier tangents expressed the way the FBX SDK stores them: a left and right tangent with a time
 * extent (dx, as a fraction of the segment scaled by the tangent weight) and a value extent (dy). Linear and constant
 * segments are represented the same way so that a single evaluator handles every case, including the weighted
 * tangents Maya and MotionBuilder write, TCB keys, and the pre/post extrapolation modes.
 */

/** FBX time units: 46186158000 ticks per second */
export const FBX_TIME_UNIT = 46186158000;

export type FBXInterpolationType = "constant" | "linear" | "cubic";

export type FBXExtrapolationMode = "constant" | "repeat" | "mirror" | "slope" | "repeatRelative";

export interface FBXExtrapolation {
    mode: FBXExtrapolationMode;
    /** Number of repetitions, or -1 for infinite */
    repeatCount: number;
}

/** A single keyframe */
export interface FBXKeyframe {
    /** Time in seconds */
    time: number;
    /** Value at this keyframe */
    value: number;
    /** Interpolation used from this key to the next key */
    interpolation: FBXInterpolationType;
    /** Constant interpolation variant */
    constantMode?: "standard" | "next";
    /** Left (incoming) tangent: time extent in seconds and value extent */
    leftDx: number;
    leftDy: number;
    /** Right (outgoing) tangent: time extent in seconds and value extent */
    rightDx: number;
    rightDy: number;
    /** Cubic outgoing slope in value units per second (derived, kept for consumers that export hermite keys) */
    rightSlope?: number;
    /** Cubic incoming slope for the next key, in value units per second (derived) */
    nextLeftSlope?: number;
}

/** An animation curve (one axis of one property) */
export interface FBXCurveData {
    /** Channel: "d|X", "d|Y", "d|Z" */
    channel: string;
    /** Keyframes */
    keys: FBXKeyframe[];
    /** True for baked sample curves that should be connected as linear samples */
    isSampled?: boolean;
    preExtrapolation?: FBXExtrapolation;
    postExtrapolation?: FBXExtrapolation;
}

// Key attribute flags (KeyAttrFlags), as written by the FBX SDK.
const KEY_INTERPOLATION_CONSTANT = 0x2;
const KEY_INTERPOLATION_CUBIC = 0x8;
const KEY_TANGENT_TCB = 0x200;
const KEY_TANGENT_USER = 0x400;
const KEY_TANGENT_BROKEN = 0x800;
const KEY_CONSTANT_NEXT = 0x100;
const KEY_CLAMP = 0x1000;
const KEY_TIME_INDEPENDENT = 0x2000;
const KEY_CLAMP_PROGRESSIVE = 0x4000;
const KEY_WEIGHTED_RIGHT = 0x1000000;
const KEY_WEIGHTED_NEXT_LEFT = 0x2000000;

const DEFAULT_WEIGHT = 0.333333;
const KEY_CLAMP_THRESHOLD = 0.00001;

/** Raw key attribute data for one key, after run-length decoding. */
export interface FBXKeyAttributes {
    flags: number;
    data: [number, number, number, number];
}

/**
 * Builds keyframes from parallel time/value arrays and their (run-length encoded) attributes, resolving every
 * tangent mode the FBX SDK writes: user, broken, auto (with clamp / progressive clamp / time-independent flags and
 * auto bias), TCB, weighted, linear and constant.
 */
export function buildKeyframes(times: ArrayLike<number>, values: ArrayLike<number>, attributes: (index: number) => FBXKeyAttributes): FBXKeyframe[] {
    const numKeys = Math.min(times.length, values.length);
    const keys: FBXKeyframe[] = [];
    if (numKeys === 0) {
        return keys;
    }

    let slopeLeft = 0;
    let weightLeft = DEFAULT_WEIGHT;
    let prevTime = 0;
    let nextTime = Number(times[0]) / FBX_TIME_UNIT;

    for (let i = 0; i < numKeys; i++) {
        const time = nextTime;
        const value = values[i];
        if (i + 1 < numKeys) {
            nextTime = Number(times[i + 1]) / FBX_TIME_UNIT;
        }
        const prevValue = i > 0 ? values[i - 1] : value;
        const nextValue = i + 1 < numKeys ? values[i + 1] : value;

        const attr = attributes(i);
        const flags = attr.flags;
        let slopeRight = attr.data[0];
        let weightRight = DEFAULT_WEIGHT;
        let nextSlopeLeft = attr.data[1];
        let nextWeightLeft = DEFAULT_WEIGHT;

        if ((flags & (KEY_WEIGHTED_RIGHT | KEY_WEIGHTED_NEXT_LEFT)) !== 0) {
            // Two 0.4 decimal fixed point weights packed into the bit pattern of the third float.
            const packed = floatToUint32Bits(attr.data[2]);
            if (flags & KEY_WEIGHTED_RIGHT) {
                weightRight = (packed & 0xffff) * 0.0001;
            }
            if (flags & KEY_WEIGHTED_NEXT_LEFT) {
                nextWeightLeft = (packed >>> 16) * 0.0001;
            }
        }

        let interpolation: FBXInterpolationType;
        let constantMode: "standard" | "next" = "standard";

        if (flags & KEY_INTERPOLATION_CONSTANT) {
            interpolation = "constant";
            constantMode = flags & KEY_CONSTANT_NEXT ? "next" : "standard";
            weightRight = nextWeightLeft = DEFAULT_WEIGHT;
            slopeRight = nextSlopeLeft = 0;
        } else if (flags & KEY_INTERPOLATION_CUBIC) {
            interpolation = "cubic";
            if (flags & KEY_TANGENT_TCB) {
                let tcbSlopeLeft = 0;
                let tcbSlopeRight = 0;
                let edge = false;
                if (i > 0 && time > prevTime) {
                    tcbSlopeLeft = (value - prevValue) / (time - prevTime);
                } else {
                    edge = true;
                }
                if (i + 1 < numKeys && nextTime > time) {
                    tcbSlopeRight = (nextValue - value) / (nextTime - time);
                } else {
                    edge = true;
                }
                const tcb = solveTcb(attr.data[0], attr.data[1], attr.data[2], tcbSlopeLeft, tcbSlopeRight, edge);
                slopeLeft = tcb.left;
                slopeRight = tcb.right;
                nextSlopeLeft = 0;
                nextWeightLeft = DEFAULT_WEIGHT;
            } else if (flags & KEY_TANGENT_USER) {
                // User tangents: slopes are stored explicitly. Unified vs broken makes no difference to evaluation.
                void KEY_TANGENT_BROKEN;
            } else {
                // Auto tangents
                if (i > 0 && i + 1 < numKeys && time > prevTime && nextTime > time) {
                    if (Math.abs(slopeLeft + slopeRight) <= 0.0001) {
                        slopeLeft = slopeRight = solveAutoTangent(prevTime, time, nextTime, prevValue, value, nextValue, weightLeft, weightRight, slopeRight, flags);
                    } else {
                        slopeLeft = solveAutoTangent(prevTime, time, nextTime, prevValue, value, nextValue, weightLeft, weightRight, -slopeLeft, flags);
                        slopeRight = solveAutoTangent(prevTime, time, nextTime, prevValue, value, nextValue, weightLeft, weightRight, slopeRight, flags);
                    }
                } else if (i > 0 && time > prevTime) {
                    slopeLeft = slopeRight = solveAutoTangentOneSided(prevTime, time, prevValue, value, -slopeLeft, flags);
                } else if (i + 1 < numKeys && nextTime > time) {
                    slopeLeft = slopeRight = solveAutoTangentOneSided(time, nextTime, value, nextValue, slopeRight, flags);
                } else {
                    slopeLeft = slopeRight = 0;
                }
            }
        } else {
            // Linear or unknown interpolation: tangents match the linear segment with 1/3 weights.
            interpolation = "linear";
            weightRight = DEFAULT_WEIGHT;
            nextWeightLeft = DEFAULT_WEIGHT;
            const deltaTime = nextTime - time;
            slopeRight = nextSlopeLeft = deltaTime > 0 ? (nextValue - value) / deltaTime : 0;
        }

        const key: FBXKeyframe = { time, value, interpolation, constantMode, leftDx: 0, leftDy: 0, rightDx: 0, rightDy: 0 };
        if (time > prevTime) {
            key.leftDx = weightLeft * (time - prevTime);
            key.leftDy = key.leftDx * slopeLeft;
        }
        if (nextTime > time) {
            key.rightDx = weightRight * (nextTime - time);
            key.rightDy = key.rightDx * slopeRight;
        }
        key.rightSlope = slopeRight;
        keys.push(key);

        slopeLeft = nextSlopeLeft;
        weightLeft = nextWeightLeft;
        prevTime = time;
    }

    for (let i = 0; i + 1 < keys.length; i++) {
        const next = keys[i + 1];
        keys[i].nextLeftSlope = next.leftDx > 0 ? next.leftDy / next.leftDx : 0;
    }
    return keys;
}

const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);
function floatToUint32Bits(v: number): number {
    f32[0] = v;
    return u32[0];
}

function solveTcb(tension: number, continuity: number, bias: number, slopeLeft: number, slopeRight: number, edge: boolean): { left: number; right: number } {
    const factor = edge ? 1 : 0.5;
    const d00 = factor * (1 - tension) * (1 + bias) * (1 - continuity);
    const d01 = factor * (1 - tension) * (1 - bias) * (1 + continuity);
    const d10 = factor * (1 - tension) * (1 + bias) * (1 + continuity);
    const d11 = factor * (1 - tension) * (1 - bias) * (1 - continuity);
    return { left: d00 * slopeLeft + d01 * slopeRight, right: d10 * slopeLeft + d11 * slopeRight };
}

/** Auto tangent as the FBX SDK computes it, including clamping and auto bias. */
export function solveAutoTangent(
    prevTime: number,
    time: number,
    nextTime: number,
    prevValue: number,
    value: number,
    nextValue: number,
    weightLeft: number,
    weightRight: number,
    autoBias: number,
    flags: number
): number {
    if (flags & KEY_CLAMP) {
        if (Math.min(Math.abs(prevValue - value), Math.abs(nextValue - value)) <= KEY_CLAMP_THRESHOLD) {
            return 0;
        }
    }

    let slope = (nextValue - prevValue) / (nextTime - prevTime);

    if ((flags & KEY_TIME_INDEPENDENT) === 0) {
        const slopeLeft = (value - prevValue) / (time - prevTime);
        const slopeRight = (nextValue - value) / (nextTime - time);
        const delta = (time - prevTime) / (nextTime - prevTime);
        slope = slope * 0.5 + (slopeLeft * (1 - delta) + slopeRight * delta) * 0.5;

        const biasWeight = Math.abs(autoBias) / 100;
        if (biasWeight > 0.0001) {
            const biasTarget = autoBias > 0 ? slopeRight : slopeLeft;
            const biasDelta = biasTarget - slope;
            slope = slope * (1 - biasWeight) + biasTarget * biasWeight;
            const absBiasWeight = biasWeight - 5;
            if (absBiasWeight > 0) {
                let biasSign = Math.abs(biasDelta) > 0.00001 ? biasDelta : autoBias;
                biasSign = biasSign > 0 ? 1 : -1;
                slope += absBiasWeight * absBiasWeight * biasSign * 40;
            }
        }
    }

    if (flags & KEY_CLAMP_PROGRESSIVE) {
        const slopeSign = slope >= 0 ? 1 : -1;
        let absSlope = slopeSign * slope;
        const rangeLeft = weightLeft * (time - prevTime);
        const rangeRight = weightRight * (nextTime - time);
        let maxLeft = rangeLeft > 0 ? (slopeSign * (value - prevValue)) / rangeLeft : 0;
        let maxRight = rangeRight > 0 ? (slopeSign * (nextValue - value)) / rangeRight : 0;
        if (!(maxLeft > 0)) {
            maxLeft = 0;
        }
        if (!(maxRight > 0)) {
            maxRight = 0;
        }
        absSlope = Math.min(absSlope, maxLeft, maxRight);
        slope = slopeSign * absSlope;
    }

    return slope;
}

function solveAutoTangentOneSided(t0: number, t1: number, v0: number, v1: number, autoBias: number, flags: number): number {
    if (flags & KEY_CLAMP_PROGRESSIVE) {
        return 0;
    }
    if (flags & KEY_CLAMP) {
        if (Math.abs(v1 - v0) <= KEY_CLAMP_THRESHOLD) {
            return 0;
        }
    }
    let slope = (v1 - v0) / (t1 - t0);
    if ((flags & KEY_TIME_INDEPENDENT) === 0) {
        const absBiasWeight = Math.abs(autoBias) / 100 - 5;
        if (absBiasWeight > 0) {
            slope += absBiasWeight * absBiasWeight * (autoBias > 0 ? 1 : -1) * 40;
        }
    }
    return slope;
}

/** Builds a keyframe list from explicit per-key slopes (legacy Takes and synthetic curves). */
export function keyframesFromSlopes(
    times: number[],
    values: number[],
    interpolation: FBXInterpolationType[],
    constantNext: boolean[],
    leftSlope: number[],
    rightSlope: number[],
    leftWeight?: number[],
    rightWeight?: number[]
): FBXKeyframe[] {
    const keys: FBXKeyframe[] = [];
    for (let i = 0; i < times.length; i++) {
        const key: FBXKeyframe = {
            time: times[i],
            value: values[i],
            interpolation: interpolation[i],
            constantMode: constantNext[i] ? "next" : "standard",
            leftDx: 0,
            leftDy: 0,
            rightDx: 0,
            rightDy: 0,
            rightSlope: rightSlope[i],
            nextLeftSlope: i + 1 < times.length ? leftSlope[i + 1] : undefined,
        };
        if (i > 0 && times[i] > times[i - 1]) {
            key.leftDx = (leftWeight?.[i] ?? DEFAULT_WEIGHT) * (times[i] - times[i - 1]);
            key.leftDy = key.leftDx * leftSlope[i];
        }
        if (i + 1 < times.length && times[i + 1] > times[i]) {
            key.rightDx = (rightWeight?.[i] ?? DEFAULT_WEIGHT) * (times[i + 1] - times[i]);
            key.rightDy = key.rightDx * rightSlope[i];
        }
        keys.push(key);
    }
    return keys;
}

/** Reads a `Pre-Extrapolation` / `Post-Extrapolation` block: `Type` is a character code, `Repetition` a count. */
export function parseExtrapolation(typeValue: unknown, repetitionValue: unknown): FBXExtrapolation {
    const code = typeof typeValue === "string" ? typeValue.charCodeAt(0) : typeof typeValue === "number" ? typeValue : 0;
    let mode: FBXExtrapolationMode;
    switch (String.fromCharCode(code)) {
        case "A":
            mode = "repeatRelative";
            break;
        case "K":
            mode = "slope";
            break;
        case "M":
            mode = "mirror";
            break;
        case "R":
            mode = "repeat";
            break;
        default:
            mode = "constant";
    }
    let repeatCount = typeof repetitionValue === "number" ? repetitionValue : -1;
    if (repeatCount < 0) {
        repeatCount = -1;
    }
    return { mode, repeatCount };
}

function findCubicBezierT(p1: number, p2: number, x0: number): number {
    const p1_3 = p1 * 3;
    const p2_3 = p2 * 3;
    const a = p1_3 - p2_3 + 1;
    const b = p2_3 - p1_3 - p1_3;
    const c = p1_3;
    const a_3 = 3 * a;
    const b_2 = 2 * b;
    let t = x0;
    let x1: number;
    const eps = 8.881784197001252e-16;
    for (let i = 0; i < 11; i++) {
        const t2 = t * t;
        const t3 = t2 * t;
        x1 = a * t3 + b * t2 + c * t - x0;
        const d = a_3 * t2 + b_2 * t + c;
        if (d === 0) {
            break;
        }
        t -= x1 / d;
        if (i >= 2 && Math.abs(x1) <= eps) {
            break;
        }
    }
    return t;
}

/**
 * Evaluates a curve at a time in seconds, following the FBX SDK: constant/linear/cubic Bezier segments inside the
 * key range and the curve's pre/post extrapolation outside it.
 */
/**
 * Tangent handles of the segment between two keys. Keys built by the parsers carry explicit handles; keys that
 * only carry slopes (`rightSlope` / `nextLeftSlope`) get the SDK's default one-third weighting.
 */
function segmentTangents(prev: FBXKeyframe, next: FBXKeyframe): { rightDx: number; rightDy: number; leftDx: number; leftDy: number } {
    const dt = next.time - prev.time;
    const hasHandles =
        Number.isFinite(prev.rightDx) && Number.isFinite(prev.rightDy) && Number.isFinite(next.leftDx) && Number.isFinite(next.leftDy) && (prev.rightDx > 0 || next.leftDx > 0);
    if (hasHandles) {
        return { rightDx: prev.rightDx, rightDy: prev.rightDy, leftDx: next.leftDx, leftDy: next.leftDy };
    }
    const rightSlope = prev.rightSlope ?? 0;
    const leftSlope = prev.nextLeftSlope ?? (next.leftDx > 0 ? next.leftDy / next.leftDx : rightSlope);
    return { rightDx: dt / 3, rightDy: (dt / 3) * rightSlope, leftDx: dt / 3, leftDy: (dt / 3) * leftSlope };
}

export function evaluateCurve(curve: FBXCurveData | undefined, time: number, defaultValue: number, noExtrapolation = false): number {
    if (!curve || curve.keys.length === 0) {
        return defaultValue;
    }
    const keys = curve.keys;
    if (keys.length === 1) {
        return keys[0].value;
    }

    const minTime = keys[0].time;
    const maxTime = keys[keys.length - 1].time;
    if (!noExtrapolation && (time < minTime || time > maxTime)) {
        return extrapolateCurve(curve, time);
    }

    // Binary search for the first key with time > `time`.
    let begin = 0;
    let end = keys.length;
    while (end - begin >= 8) {
        const mid = (begin + end) >> 1;
        if (keys[mid].time <= time) {
            begin = mid + 1;
        } else {
            end = mid;
        }
    }
    end = keys.length;
    for (; begin < end; begin++) {
        const next = keys[begin];
        if (next.time <= time) {
            continue;
        }
        if (begin === 0) {
            return next.value;
        }
        const prev = keys[begin - 1];
        if (prev.time === time) {
            return prev.value;
        }
        const rcpDelta = 1 / (next.time - prev.time);
        let t = (time - prev.time) * rcpDelta;
        switch (prev.interpolation) {
            case "constant":
                return prev.constantMode === "next" ? next.value : prev.value;
            case "linear":
                return prev.value * (1 - t) + next.value * t;
            default: {
                const tangents = segmentTangents(prev, next);
                const x1 = tangents.rightDx * rcpDelta;
                const x2 = 1 - tangents.leftDx * rcpDelta;
                t = findCubicBezierT(x1, x2, t);
                const t2 = t * t;
                const t3 = t2 * t;
                const u = 1 - t;
                const u2 = u * u;
                const u3 = u2 * u;
                const y0 = prev.value;
                const y3 = next.value;
                const y1 = y0 + tangents.rightDy;
                const y2 = y3 - tangents.leftDy;
                return u3 * y0 + 3 * (u2 * t * y1 + u * t2 * y2) + t3 * y3;
            }
        }
    }
    return keys[keys.length - 1].value;
}

function extrapolateCurve(curve: FBXCurveData, realTime: number): number {
    const keys = curve.keys;
    const minTime = keys[0].time;
    const maxTime = keys[keys.length - 1].time;
    const pre = realTime < minTime;
    const key = pre ? keys[0] : keys[keys.length - 1];
    const ext = (pre ? curve.preExtrapolation : curve.postExtrapolation) ?? { mode: "constant", repeatCount: -1 };

    if (ext.mode === "constant") {
        return key.value;
    }
    if (ext.mode === "slope") {
        const dx = pre ? key.rightDx : key.leftDx;
        const dy = pre ? key.rightDy : key.leftDy;
        return dx !== 0 ? key.value + dy * ((realTime - key.time) / dx) : key.value;
    }
    if (ext.repeatCount === 0) {
        return key.value;
    }

    // Work in KTime ticks to stay frame exact.
    const scale = FBX_TIME_UNIT;
    const min = Math.round(minTime * scale);
    const max = Math.round(maxTime * scale);
    const time = realTime * scale;
    const delta = pre ? min - time : time - max;
    const duration = max - min;
    if (!(duration >= 1)) {
        return key.value;
    }

    const rep = delta / duration;
    let repN = Math.floor(rep);
    let repD = delta - repN * duration;
    if (ext.repeatCount > 0 && repN >= ext.repeatCount) {
        repN = ext.repeatCount - 1;
        repD = duration;
    }
    if (ext.mode === "mirror") {
        const parity = repN * 0.5 - Math.floor(repN * 0.5);
        if (parity <= 0.25) {
            repD = duration - repD;
        }
    }
    if (pre) {
        repD = duration - repD;
    }
    const newTime = (min + repD) / scale;
    let value = evaluateCurve(curve, newTime, key.value, true);
    if (ext.mode === "repeatRelative") {
        let valueDelta = keys[keys.length - 1].value - keys[0].value;
        if (pre) {
            valueDelta = -valueDelta;
        }
        value += valueDelta * (repN + 1);
    }
    return value;
}

// ── Euler / quaternion helpers for layer blending ─────────────────────────────

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Euler angles in degrees with an FBX rotation order (0=XYZ ... 5=ZYX; spheric falls back to XYZ) to a quaternion. */
export function eulerToQuat(v: Vec3, order: number): Quat {
    const vx = v[0] * (DEG2RAD * 0.5);
    const vy = v[1] * (DEG2RAD * 0.5);
    const vz = v[2] * (DEG2RAD * 0.5);
    const cx = Math.cos(vx),
        sx = Math.sin(vx);
    const cy = Math.cos(vy),
        sy = Math.sin(vy);
    const cz = Math.cos(vz),
        sz = Math.sin(vz);
    switch (order) {
        case 1: // XZY
            return [cx * sy * sz + cy * cz * sx, cx * cz * sy + cy * sx * sz, cx * cy * sz - cz * sx * sy, cx * cy * cz - sx * sy * sz];
        case 2: // YZX
            return [-cx * sy * sz + cy * cz * sx, cx * cz * sy - cy * sx * sz, cx * cy * sz + cz * sx * sy, cx * cy * cz + sx * sy * sz];
        case 3: // YXZ
            return [-cx * sy * sz + cy * cz * sx, cx * cz * sy + cy * sx * sz, cx * cy * sz + cz * sx * sy, cx * cy * cz - sx * sy * sz];
        case 4: // ZXY
            return [cx * sy * sz + cy * cz * sx, cx * cz * sy - cy * sx * sz, cx * cy * sz - cz * sx * sy, cx * cy * cz + sx * sy * sz];
        case 5: // ZYX
            return [cx * sy * sz + cy * cz * sx, cx * cz * sy - cy * sx * sz, cx * cy * sz + cz * sx * sy, cx * cy * cz - sx * sy * sz];
        default: // XYZ
            return [-cx * sy * sz + cy * cz * sx, cx * cz * sy + cy * sx * sz, cx * cy * sz - cz * sx * sy, cx * cy * cz + sx * sy * sz];
    }
}

/** Quaternion to Euler angles in degrees for an FBX rotation order (inverse of eulerToQuat). */
export function quatToEuler(q: Quat, order: number): Vec3 {
    const eps = 0.999999999;
    const [qx, qy, qz, qw] = q;
    let vx = 0,
        vy = 0,
        vz = 0;
    let t: number;
    const halfPi = Math.PI * 0.5;
    switch (order) {
        case 1: // XZY
            t = 2 * (qw * qz + qx * qy);
            if (Math.abs(t) < eps) {
                vz = Math.asin(t);
                vy = Math.atan2(2 * (qw * qy - qx * qz), 2 * (qw * qw + qx * qx) - 1);
                vx = -Math.atan2(-2 * (qw * qx - qy * qz), 2 * (qw * qw + qy * qy) - 1);
            } else {
                vz = Math.sign(t) * halfPi;
                vy = Math.atan2(2 * t * (qw * qx + qy * qz), -t * (2 * qx * qy - 2 * qw * qz));
            }
            break;
        case 2: // YZX
            t = 2 * (qw * qz - qx * qy);
            if (Math.abs(t) < eps) {
                vz = Math.asin(t);
                vx = Math.atan2(2 * (qw * qx + qy * qz), 2 * (qw * qw + qy * qy) - 1);
                vy = -Math.atan2(-2 * (qw * qy + qx * qz), 2 * (qw * qw + qx * qx) - 1);
            } else {
                vz = Math.sign(t) * halfPi;
                vx = Math.atan2(-2 * t * (qw * qy - qx * qz), t * (2 * qw * qz + 2 * qx * qy));
            }
            break;
        case 3: // YXZ
            t = 2 * (qw * qx + qy * qz);
            if (Math.abs(t) < eps) {
                vx = Math.asin(t);
                vz = Math.atan2(2 * (qw * qz - qx * qy), 2 * (qw * qw + qy * qy) - 1);
                vy = -Math.atan2(-2 * (qw * qy - qx * qz), 2 * (qw * qw + qz * qz) - 1);
            } else {
                vx = Math.sign(t) * halfPi;
                vz = Math.atan2(2 * t * (qw * qy + qx * qz), -t * (2 * qy * qz - 2 * qw * qx));
            }
            break;
        case 4: // ZXY
            t = 2 * (qw * qx - qy * qz);
            if (Math.abs(t) < eps) {
                vx = Math.asin(t);
                vy = Math.atan2(2 * (qw * qy + qx * qz), 2 * (qw * qw + qz * qz) - 1);
                vz = -Math.atan2(-2 * (qw * qz + qx * qy), 2 * (qw * qw + qy * qy) - 1);
            } else {
                vx = Math.sign(t) * halfPi;
                vy = Math.atan2(-2 * t * (qw * qz - qx * qy), t * (2 * qw * qx + 2 * qy * qz));
            }
            break;
        case 5: // ZYX
            t = 2 * (qw * qy + qx * qz);
            if (Math.abs(t) < eps) {
                vy = Math.asin(t);
                vx = Math.atan2(2 * (qw * qx - qy * qz), 2 * (qw * qw + qz * qz) - 1);
                vz = -Math.atan2(-2 * (qw * qz - qx * qy), 2 * (qw * qw + qx * qx) - 1);
            } else {
                vy = Math.sign(t) * halfPi;
                vx = Math.atan2(2 * t * (qw * qz + qx * qy), -t * (2 * qx * qz - 2 * qw * qy));
            }
            break;
        default: // XYZ
            t = 2 * (qw * qy - qx * qz);
            if (Math.abs(t) < eps) {
                vy = Math.asin(t);
                vz = Math.atan2(2 * (qw * qz + qx * qy), 2 * (qw * qw + qx * qx) - 1);
                vx = -Math.atan2(-2 * (qw * qx + qy * qz), 2 * (qw * qw + qz * qz) - 1);
            } else {
                vy = Math.sign(t) * halfPi;
                vz = Math.atan2(-2 * t * (qw * qx - qy * qz), t * (2 * qw * qy + 2 * qx * qz));
            }
            break;
    }
    return [vx * RAD2DEG, vy * RAD2DEG, vz * RAD2DEG];
}

function quatMul(a: Quat, b: Quat): Quat {
    return [
        a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
    ];
}

function quatSlerp(a: Quat, b: Quat, t: number): Quat {
    let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    let bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];
    if (dot < 0) {
        dot = -dot;
        bx = -bx;
        by = -by;
        bz = -bz;
        bw = -bw;
    }
    let wa: number;
    let wb: number;
    if (dot > 0.9995) {
        wa = 1 - t;
        wb = t;
    } else {
        const omega = Math.acos(Math.min(1, dot));
        const rcpSin = 1 / Math.sin(omega);
        wa = Math.sin((1 - t) * omega) * rcpSin;
        wb = Math.sin(t * omega) * rcpSin;
    }
    const x = a[0] * wa + bx * wb;
    const y = a[1] * wa + by * wb;
    const z = a[2] * wa + bz * wb;
    const w = a[3] * wa + bw * wb;
    const len = Math.hypot(x, y, z, w) || 1;
    return [x / len, y / len, z / len, w / len];
}

function powAbs(v: number, e: number): number {
    return v >= 0 ? Math.pow(v, e) : -Math.pow(-v, e);
}

/** Blend semantics of an animation layer, derived from its BlendMode and accumulation modes. */
export interface FBXLayerBlend {
    /** Layer participates in blending (BlendMode Additive or Override Passthrough) */
    blended: boolean;
    /** Layer adds onto the result instead of replacing it (BlendMode Additive) */
    additive: boolean;
    /** Rotations compose as quaternions (RotationAccumulationMode ByLayer) */
    composeRotation: boolean;
    /** Scales compose multiplicatively (ScaleAccumulationMode Multiply) */
    composeScale: boolean;
    /** Layer weight in [0, 1] */
    weight: number;
}

/**
 * Combines one animation layer's value into the running result, exactly as the FBX SDK evaluator does.
 * `kind` selects the accumulation rule: "R" rotations (degrees, rotation order given), "S" scales, anything else linear.
 */
export function combineLayerValue(result: Vec3, value: Vec3, layer: FBXLayerBlend, kind: "T" | "R" | "S" | "other", rotationOrder: number): Vec3 {
    const w = layer.weight;
    if (layer.additive) {
        if (layer.composeScale && kind === "S") {
            return [result[0] * powAbs(value[0], w), result[1] * powAbs(value[1], w), result[2] * powAbs(value[2], w)];
        }
        if (layer.composeRotation && kind === "R") {
            const a = eulerToQuat(result, rotationOrder);
            const b = quatSlerp([0, 0, 0, 1], eulerToQuat(value, rotationOrder), w);
            return quatToEuler(quatMul(a, b), rotationOrder);
        }
        return [result[0] + value[0] * w, result[1] + value[1] * w, result[2] + value[2] * w];
    }
    if (layer.blended) {
        const rw = 1 - w;
        if (layer.composeScale && kind === "S") {
            return [powAbs(result[0], rw) * powAbs(value[0], w), powAbs(result[1], rw) * powAbs(value[1], w), powAbs(result[2], rw) * powAbs(value[2], w)];
        }
        if (layer.composeRotation && kind === "R") {
            return quatToEuler(quatSlerp(eulerToQuat(result, rotationOrder), eulerToQuat(value, rotationOrder), w), rotationOrder);
        }
        return [result[0] * rw + value[0] * w, result[1] * rw + value[1] * w, result[2] * rw + value[2] * w];
    }
    return [value[0], value[1], value[2]];
}
