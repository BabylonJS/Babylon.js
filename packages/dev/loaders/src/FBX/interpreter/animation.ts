/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode, findChildByName, getPropertyValue, cleanFBXName } from "../types/fbxTypes";

import { type FBXObjectMap, getChildren } from "./connections";

/** FBX time units: 46186158000 ticks per second */
const FBX_TIME_UNIT = 46186158000;
const KEY_ATTR_DATA_STRIDE = 4;
const SAMPLED_CURVE_MIN_KEY_COUNT = 8;
const SAMPLED_CURVE_MAX_INTERVAL_SECONDS = 1 / 23;
const SAMPLED_CURVE_UNIFORM_TOLERANCE_RATIO = 0.05;
const SAMPLED_CURVE_LINEAR_DEVIATION_RATIO = 0.01;
const SAMPLED_CURVE_LINEAR_DEVIATION_ABSOLUTE = 1e-4;
const SAMPLED_CURVE_DEGENERATE_SLOPE_ABSOLUTE = 1e-5;
const SAMPLED_CURVE_COMMON_FPS = [24, 25, 30, 48, 50, 60, 100, 120];

export type FBXInterpolationType = "constant" | "linear" | "cubic";

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
    /** Cubic outgoing slope in value units per second */
    rightSlope?: number;
    /** Cubic incoming slope for the next key, in value units per second */
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
}

/** An animation curve node (T/R/S for one bone) */
export interface FBXCurveNodeData {
    /** Property type: "T" (translation), "R" (rotation), "S" (scale) */
    type: string;
    /** Target model (bone) ID */
    targetModelId: number;
    /** Curves for each axis */
    curves: FBXCurveData[];
}

/** Unsupported animation curve node preserved for diagnostics and future support. */
export interface FBXUnsupportedCurveNodeData {
    /** Raw AnimationCurveNode property type/name */
    type: string;
    /** CurveNode object ID */
    id: number;
    /** Target object ID if the curve node is connected to an object/property */
    targetId: number | null;
    /** OP connection property name on the target, e.g. Visibility */
    propertyName?: string;
    /** Number of connected animation curves that were ignored */
    curveCount: number;
    /** Connected curves preserved for diagnostics and future runtime support */
    curves: FBXCurveData[];
    /** Local default values stored on the unsupported curve node */
    defaultValues: Record<string, number>;
}

/** Recoverable animation import issue. */
export interface FBXAnimationDiagnostic {
    /** Diagnostic category. */
    type: "multiple-animation-layers" | "unsupported-layer-blend-mode" | "partial-layer-weight" | "unsupported-curve-node";
    /** Human-readable diagnostic message. */
    message: string;
    /** Animation layer name associated with the diagnostic, if applicable. */
    layerName?: string;
    /** AnimationCurveNode object ID associated with the diagnostic, if applicable. */
    curveNodeId?: number;
    /** AnimationCurveNode type/name associated with the diagnostic, if applicable. */
    curveNodeType?: string;
    /** Target object ID associated with the diagnostic, if applicable. */
    targetId?: number | null;
    /** Target property name associated with the diagnostic, if applicable. */
    propertyName?: string;
}

/** Animation layer with blend mode info */
export interface FBXAnimationLayerData {
    /** Layer name */
    name: string;
    /** Layer weight (0-100, default 100) */
    weight: number;
    /** Layer weight normalized to 0-1 */
    normalizedWeight: number;
    /** Blend mode: 0=Additive, 1=Override, 2=OverridePassthrough */
    blendMode: number;
    /** Curve nodes in this layer */
    curveNodes: FBXCurveNodeData[];
    /** Unsupported/non-TRS curve nodes preserved for diagnostics */
    unsupportedCurveNodes: FBXUnsupportedCurveNodeData[];
    /** Recoverable layer diagnostics */
    diagnostics: FBXAnimationDiagnostic[];
}

/** One animation clip (AnimationStack) */
export interface FBXAnimationStackData {
    /** Animation name */
    name: string;
    /** Clip start in seconds after any keyframe rebasing */
    startTime: number;
    /** Clip stop in seconds after any keyframe rebasing */
    stopTime: number;
    /** Duration in seconds */
    duration: number;
    /** Per-bone curve nodes (flattened from all layers for backward compat) */
    curveNodes: FBXCurveNodeData[];
    /** Animation layers (preserves blend mode info) */
    layers: FBXAnimationLayerData[];
    /** Unsupported/non-TRS curve nodes preserved for diagnostics */
    unsupportedCurveNodes: FBXUnsupportedCurveNodeData[];
    /** Recoverable animation diagnostics */
    diagnostics: FBXAnimationDiagnostic[];
}

/**
 * Extract all animation stacks from the FBX scene.
 */
export function extractAnimations(objectMap: FBXObjectMap): FBXAnimationStackData[] {
    const stacks: FBXAnimationStackData[] = [];

    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "AnimationStack") {
            const stack = extractAnimStack(id, node, objectMap);
            if (stack) {
                stacks.push(stack);
            }
        }
    }

    return stacks;
}

function extractAnimStack(stackId: number, stackNode: FBXNode, objectMap: FBXObjectMap): FBXAnimationStackData | null {
    const name = cleanFBXName(getPropertyValue<string>(stackNode, 1) ?? "Animation");
    const declaredTimeSpan = extractAnimationStackTimeSpan(stackNode);

    // Find AnimationLayer children of this stack
    const layerEntries = getChildren(objectMap, stackId, "AnimationLayer");
    if (layerEntries.length === 0) {
        return null;
    }

    // Collect all CurveNodes from all layers
    const allCurveNodes: FBXCurveNodeData[] = [];
    const allUnsupportedCurveNodes: FBXUnsupportedCurveNodeData[] = [];
    const layers: FBXAnimationLayerData[] = [];
    const diagnostics: FBXAnimationDiagnostic[] = [];
    let minTime = Infinity;
    let maxTime = 0;

    for (const { id: layerId, node: layerNode } of layerEntries) {
        // Extract layer properties
        const layerName = cleanFBXName(getPropertyValue<string>(layerNode, 1) ?? "Layer");
        let weight = 100;
        let blendMode = 0;

        const props70 = findChildByName(layerNode, "Properties70");
        if (props70) {
            for (const p of props70.children) {
                if (p.name !== "P") {
                    continue;
                }
                const pName = getPropertyValue<string>(p, 0);
                if (pName === "Weight") {
                    const v = p.properties[4]?.value;
                    if (typeof v === "number") {
                        weight = v;
                    }
                } else if (pName === "BlendMode") {
                    const v = p.properties[4]?.value;
                    if (typeof v === "number") {
                        blendMode = v;
                    }
                }
            }
        }

        // AnimationCurveNodes are children of the layer
        const curveNodeEntries = getChildren(objectMap, layerId, "AnimationCurveNode");
        const layerCurveNodes: FBXCurveNodeData[] = [];
        const layerUnsupportedCurveNodes: FBXUnsupportedCurveNodeData[] = [];
        const layerDiagnostics: FBXAnimationDiagnostic[] = [];

        for (const { id: curveNodeId, node: curveNodeNode } of curveNodeEntries) {
            const curveNodeData = extractCurveNode(curveNodeId, curveNodeNode, objectMap);
            if (!curveNodeData) {
                const unsupported = extractUnsupportedCurveNode(curveNodeId, curveNodeNode, objectMap);
                if (unsupported) {
                    scanCurveTimes(unsupported.curves, (time) => {
                        if (time < minTime) {
                            minTime = time;
                        }
                        if (time > maxTime) {
                            maxTime = time;
                        }
                    });
                    layerUnsupportedCurveNodes.push(unsupported);
                    allUnsupportedCurveNodes.push(unsupported);
                    const diagnostic: FBXAnimationDiagnostic = {
                        type: "unsupported-curve-node",
                        message: `AnimationCurveNode '${unsupported.type}' is preserved as diagnostic data but not evaluated at runtime.`,
                        layerName,
                        curveNodeId,
                        curveNodeType: unsupported.type,
                        targetId: unsupported.targetId,
                        propertyName: unsupported.propertyName,
                    };
                    layerDiagnostics.push(diagnostic);
                    diagnostics.push(diagnostic);
                }
                continue;
            }

            for (const curve of curveNodeData.curves) {
                for (const key of curve.keys) {
                    if (key.time < minTime) {
                        minTime = key.time;
                    }
                    if (key.time > maxTime) {
                        maxTime = key.time;
                    }
                }
            }

            layerCurveNodes.push(curveNodeData);
            allCurveNodes.push(curveNodeData);
        }

        layers.push({
            name: layerName,
            weight,
            normalizedWeight: weight / 100,
            blendMode,
            curveNodes: layerCurveNodes,
            unsupportedCurveNodes: layerUnsupportedCurveNodes,
            diagnostics: layerDiagnostics,
        });
    }

    if (allCurveNodes.length === 0 && allUnsupportedCurveNodes.length === 0) {
        return null;
    }

    if (layers.length > 1) {
        diagnostics.push({
            type: "multiple-animation-layers",
            message: "Multiple animation layers are preserved, but runtime blending is not yet evaluated.",
        });
    }
    for (const layer of layers) {
        if (layer.blendMode !== 0) {
            const diagnostic: FBXAnimationDiagnostic = {
                type: "unsupported-layer-blend-mode",
                message: `Animation layer blend mode ${layer.blendMode} is preserved but not yet blended at runtime.`,
                layerName: layer.name,
            };
            layer.diagnostics.push(diagnostic);
            diagnostics.push(diagnostic);
        }
        if (layer.weight !== 100) {
            const diagnostic: FBXAnimationDiagnostic = {
                type: "partial-layer-weight",
                message: `Animation layer weight ${layer.weight} is preserved but not yet applied at runtime.`,
                layerName: layer.name,
            };
            layer.diagnostics.push(diagnostic);
            diagnostics.push(diagnostic);
        }
    }

    const timeOffset = minTime > 0 && isFinite(minTime) ? minTime : 0;

    // Rebase all keyframe times so the animation starts at 0
    if (timeOffset > 0) {
        for (const cn of allCurveNodes) {
            for (const curve of cn.curves) {
                for (const key of curve.keys) {
                    key.time -= timeOffset;
                }
            }
        }
        for (const cn of allUnsupportedCurveNodes) {
            for (const curve of cn.curves) {
                for (const key of curve.keys) {
                    key.time -= timeOffset;
                }
            }
        }
        maxTime -= timeOffset;
    }

    const declaredStart = declaredTimeSpan ? Math.max(declaredTimeSpan.start - timeOffset, 0) : 0;
    const declaredStop = declaredTimeSpan ? Math.max(declaredTimeSpan.stop - timeOffset, declaredStart) : 0;
    const hasDeclaredDuration = declaredStop > declaredStart;
    const startTime = hasDeclaredDuration ? declaredStart : 0;
    const stopTime = hasDeclaredDuration ? declaredStop : maxTime;

    return {
        name,
        startTime,
        stopTime,
        duration: Math.max(stopTime - startTime, 0),
        curveNodes: allCurveNodes,
        layers,
        unsupportedCurveNodes: allUnsupportedCurveNodes,
        diagnostics,
    };
}

function extractAnimationStackTimeSpan(stackNode: FBXNode): { start: number; stop: number } | null {
    const props70 = findChildByName(stackNode, "Properties70");
    if (!props70) {
        return null;
    }

    let start = 0;
    let stop: number | null = null;

    for (const p of props70.children) {
        if (p.name !== "P") {
            continue;
        }
        const pName = getPropertyValue<string>(p, 0);
        if (pName === "LocalStart" || pName === "ReferenceStart") {
            start = fbxTimeToSeconds(p.properties[4]?.value) ?? start;
        } else if (pName === "LocalStop" || pName === "ReferenceStop") {
            stop = fbxTimeToSeconds(p.properties[4]?.value) ?? stop;
        }
    }

    return stop !== null ? { start, stop } : null;
}

function extractCurveNode(curveNodeId: number, curveNodeNode: FBXNode, objectMap: FBXObjectMap): FBXCurveNodeData | null {
    const typeName = cleanFBXName(getPropertyValue<string>(curveNodeNode, 1) ?? "");

    // Handle T (translation), R (rotation), S (scale) targeting Models
    if (typeName === "T" || typeName === "R" || typeName === "S") {
        const targetModelId = findCurveNodeTarget(curveNodeId, objectMap);
        if (targetModelId === null) {
            return null;
        }

        const curves = extractCurves(curveNodeId, objectMap);
        if (curves.length === 0) {
            return null;
        }

        return {
            type: typeName,
            targetModelId,
            curves,
        };
    }

    // Handle DeformPercent targeting BlendShapeChannels
    if (typeName === "DeformPercent") {
        const targetId = findCurveNodeBlendShapeTarget(curveNodeId, objectMap);
        if (targetId === null) {
            return null;
        }

        const curves = extractCurves(curveNodeId, objectMap);
        if (curves.length === 0) {
            return null;
        }

        return {
            type: "DeformPercent",
            targetModelId: targetId,
            curves,
        };
    }

    return null;
}

function extractUnsupportedCurveNode(curveNodeId: number, curveNodeNode: FBXNode, objectMap: FBXObjectMap): FBXUnsupportedCurveNodeData | null {
    const typeName = cleanFBXName(getPropertyValue<string>(curveNodeNode, 1) ?? "");
    const curves = extractCurves(curveNodeId, objectMap);
    const defaultValues = extractCurveNodeDefaultValues(curveNodeNode);
    if (curves.length === 0 && Object.keys(defaultValues).length === 0) {
        return null;
    }

    let targetId: number | null = null;
    let propertyName: string | undefined;
    for (const conn of objectMap.connections) {
        if (conn.childId === curveNodeId && conn.type === "OP") {
            targetId = conn.parentId;
            propertyName = conn.propertyName;
            break;
        }
    }

    return {
        type: typeName,
        id: curveNodeId,
        targetId,
        propertyName,
        curveCount: curves.length,
        curves,
        defaultValues,
    };
}

function scanCurveTimes(curves: FBXCurveData[], visit: (time: number) => void): void {
    for (const curve of curves) {
        for (const key of curve.keys) {
            visit(key.time);
        }
    }
}

/**
 * Find the Model that an AnimationCurveNode targets.
 * The CurveNode connects to the Model via OP connection with a property name.
 */
function findCurveNodeTarget(curveNodeId: number, objectMap: FBXObjectMap): number | null {
    // Look for connections where this curveNode is a child (going up to parent)
    // The OP connection from curveNode → Model has the property name (e.g. "Lcl Translation")
    for (const conn of objectMap.connections) {
        if (conn.childId === curveNodeId && conn.type === "OP") {
            const parentNode = objectMap.objects.get(conn.parentId);
            if (parentNode && parentNode.name === "Model") {
                return conn.parentId;
            }
        }
    }
    return null;
}

/**
 * Find the BlendShapeChannel that a DeformPercent AnimationCurveNode targets.
 */
function findCurveNodeBlendShapeTarget(curveNodeId: number, objectMap: FBXObjectMap): number | null {
    for (const conn of objectMap.connections) {
        if (conn.childId === curveNodeId && conn.type === "OP") {
            const parentNode = objectMap.objects.get(conn.parentId);
            if (parentNode && parentNode.name === "Deformer") {
                const subType = getPropertyValue<string>(parentNode, 2);
                if (subType === "BlendShapeChannel") {
                    return conn.parentId;
                }
            }
        }
    }
    // Also check OO connections
    for (const conn of objectMap.connections) {
        if (conn.childId === curveNodeId && conn.type === "OO") {
            const parentNode = objectMap.objects.get(conn.parentId);
            if (parentNode && parentNode.name === "Deformer") {
                const subType = getPropertyValue<string>(parentNode, 2);
                if (subType === "BlendShapeChannel") {
                    return conn.parentId;
                }
            }
        }
    }
    return null;
}

/**
 * Extract AnimationCurves connected to a CurveNode.
 * Each curve connects via OP with channel "d|X", "d|Y", or "d|Z".
 */
function extractCurves(curveNodeId: number, objectMap: FBXObjectMap): FBXCurveData[] {
    const curves: FBXCurveData[] = [];

    // Find AnimationCurve children of this CurveNode
    for (const conn of objectMap.connections) {
        if (conn.parentId === curveNodeId && conn.type === "OP") {
            const curveNode = objectMap.objects.get(conn.childId);
            if (!curveNode || curveNode.name !== "AnimationCurve") {
                continue;
            }

            const channel = conn.propertyName ?? "d|X";
            const keys = extractKeyframes(curveNode);
            if (keys.length > 0) {
                const isSampled = isSampledAnimationCurve(curveNode, keys);
                curves.push({ channel, keys: isSampled ? makeLinearSampleKeys(keys) : keys, isSampled });
            }
        }
    }

    // Also check OO connections (some exporters use OO for curve→curveNode)
    if (curves.length === 0) {
        const ooChildren = getChildren(objectMap, curveNodeId, "AnimationCurve");
        // For OO connections, infer channel from order (X, Y, Z)
        const channelNames = ["d|X", "d|Y", "d|Z"];
        for (let i = 0; i < ooChildren.length && i < 3; i++) {
            const keys = extractKeyframes(ooChildren[i].node);
            if (keys.length > 0) {
                const isSampled = isSampledAnimationCurve(ooChildren[i].node, keys);
                curves.push({ channel: channelNames[i], keys: isSampled ? makeLinearSampleKeys(keys) : keys, isSampled });
            }
        }
    }

    return curves;
}

function extractCurveNodeDefaultValues(curveNodeNode: FBXNode): Record<string, number> {
    const defaults: Record<string, number> = {};
    const props70 = findChildByName(curveNodeNode, "Properties70");
    for (const p of props70?.children ?? []) {
        if (p.name !== "P") {
            continue;
        }
        const propName = getPropertyValue<string>(p, 0);
        if (!propName?.startsWith("d|")) {
            continue;
        }
        const value = toNumber(p.properties[4]?.value);
        if (value !== null) {
            defaults[propName] = value;
        }
    }
    return defaults;
}

/**
 * Extract keyframes from an AnimationCurve node.
 */
function extractKeyframes(curveNode: FBXNode): FBXKeyframe[] {
    const keyTimeNode = findChildByName(curveNode, "KeyTime");
    const keyValueNode = findChildByName(curveNode, "KeyValueFloat");

    if (!keyTimeNode || !keyValueNode) {
        return [];
    }

    const keyTimes = toInt64Array(keyTimeNode.properties[0]?.value);
    const keyValues = toFloat32Array(keyValueNode.properties[0]?.value);
    const keyAttrFlags = toInt32Array(findChildByName(curveNode, "KeyAttrFlags")?.properties[0]?.value);
    const keyAttrData = toFloat32Array(findChildByName(curveNode, "KeyAttrDataFloat")?.properties[0]?.value);
    const keyAttrRefCount = toInt32Array(findChildByName(curveNode, "KeyAttrRefCount")?.properties[0]?.value);

    if (!keyTimes || !keyValues) {
        return [];
    }
    if (keyTimes.length !== keyValues.length) {
        return [];
    }

    const keyAttributeIndices = buildKeyAttributeIndices(keyTimes.length, keyAttrFlags, keyAttrRefCount);

    const keys: FBXKeyframe[] = [];
    for (let i = 0; i < keyTimes.length; i++) {
        const attrIndex = keyAttributeIndices[i];
        const flag = attrIndex >= 0 ? (keyAttrFlags?.[attrIndex] ?? 0) : 0;
        const dataOffset = attrIndex * KEY_ATTR_DATA_STRIDE;

        keys.push({
            time: Number(keyTimes[i]) / FBX_TIME_UNIT,
            value: keyValues[i],
            interpolation: getInterpolationType(flag),
            constantMode: (flag & 0x00000100) !== 0 ? "next" : "standard",
            rightSlope: getFiniteKeyAttrData(keyAttrData, dataOffset),
            nextLeftSlope: getFiniteKeyAttrData(keyAttrData, dataOffset + 1),
        });
    }

    return keys;
}

function isSampledAnimationCurve(curveNode: FBXNode, keys: readonly FBXKeyframe[]): boolean {
    const rawName = getPropertyValue<string>(curveNode, 1) ?? "";
    return cleanFBXName(rawName) === "FbxMayaSample Curve" || isFrameBakedSampledCurve(keys);
}

/**
 * Determines whether a key sequence appears to be a uniformly frame-baked sampled curve.
 * @param keys - Keyframes to inspect
 * @returns true if the keys look like sampled frame data rather than authored interpolation
 */
export function isFrameBakedSampledCurve(keys: readonly FBXKeyframe[]): boolean {
    if (keys.length < SAMPLED_CURVE_MIN_KEY_COUNT) {
        return false;
    }

    const deltas: number[] = [];
    for (let i = 1; i < keys.length; i++) {
        const delta = keys[i].time - keys[i - 1].time;
        if (!(delta > 0)) {
            return false;
        }
        deltas.push(delta);
    }

    const averageDelta = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
    if (averageDelta > SAMPLED_CURVE_MAX_INTERVAL_SECONDS) {
        return false;
    }

    const uniformTolerance = Math.max(1e-6, averageDelta * SAMPLED_CURVE_UNIFORM_TOLERANCE_RATIO);
    if (deltas.some((delta) => Math.abs(delta - averageDelta) > uniformTolerance)) {
        return false;
    }

    const sampledFps = 1 / averageDelta;
    const matchesCommonFps = SAMPLED_CURVE_COMMON_FPS.some((fps) => Math.abs(sampledFps - fps) <= Math.max(0.25, fps * 0.02));
    if (!matchesCommonFps) {
        return false;
    }

    return !hasMeaningfulCubicTangents(keys);
}

function makeLinearSampleKeys(keys: FBXKeyframe[]): FBXKeyframe[] {
    return keys.map((key) => ({
        time: key.time,
        value: key.value,
        interpolation: "linear",
    }));
}

function hasMeaningfulCubicTangents(keys: readonly FBXKeyframe[]): boolean {
    let hasCubicSegment = false;
    let hasCompleteTangents = true;
    let allSlopesDegenerate = true;
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;
    let maxLinearDeviation = 0;

    for (const key of keys) {
        minValue = Math.min(minValue, key.value);
        maxValue = Math.max(maxValue, key.value);
    }

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextKey = keys[i + 1];
        if (key.interpolation !== "cubic") {
            continue;
        }

        hasCubicSegment = true;
        const segmentDuration = nextKey.time - key.time;
        if (!(segmentDuration > 0)) {
            continue;
        }

        const linearSlope = (nextKey.value - key.value) / segmentDuration;
        const rightSlope = key.rightSlope;
        const nextLeftSlope = key.nextLeftSlope;
        if (rightSlope === undefined || nextLeftSlope === undefined) {
            hasCompleteTangents = false;
            continue;
        }

        if (Math.abs(rightSlope) > SAMPLED_CURVE_DEGENERATE_SLOPE_ABSOLUTE || Math.abs(nextLeftSlope) > SAMPLED_CURVE_DEGENERATE_SLOPE_ABSOLUTE) {
            allSlopesDegenerate = false;
        }

        for (const t of [0.25, 0.5, 0.75]) {
            const cubic = cubicHermite(key.value, nextKey.value, rightSlope, nextLeftSlope, segmentDuration, t);
            const linear = key.value + t * segmentDuration * linearSlope;
            maxLinearDeviation = Math.max(maxLinearDeviation, Math.abs(cubic - linear));
        }
    }

    if (!hasCubicSegment || !hasCompleteTangents || allSlopesDegenerate) {
        return false;
    }

    const range = maxValue - minValue;
    const deviationTolerance = Math.max(SAMPLED_CURVE_LINEAR_DEVIATION_ABSOLUTE, range * SAMPLED_CURVE_LINEAR_DEVIATION_RATIO);
    return maxLinearDeviation > deviationTolerance;
}

/**
 * Samples an FBX animation curve at a specific time.
 * @param curveData - Curve data to sample
 * @param time - Time in seconds
 * @returns The sampled value, or null when the curve has no keys
 */
export function sampleFBXCurveAtTime(curveData: FBXCurveData | undefined, time: number): number | null {
    if (!curveData || curveData.keys.length === 0) {
        return null;
    }

    const keys = curveData.keys;

    if (time <= keys[0].time) {
        return keys[0].value;
    }
    if (time >= keys[keys.length - 1].time) {
        return keys[keys.length - 1].value;
    }

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextKey = keys[i + 1];
        if (time < key.time || time > nextKey.time) {
            continue;
        }

        if (nextKey.time === key.time) {
            return key.value;
        }
        if (key.interpolation === "constant") {
            return key.constantMode === "next" ? nextKey.value : key.value;
        }

        const segmentDuration = nextKey.time - key.time;
        const t = (time - key.time) / segmentDuration;

        if (key.interpolation === "cubic" && !curveData.isSampled) {
            const linearSlope = (nextKey.value - key.value) / segmentDuration;
            const rightSlope = key.rightSlope ?? linearSlope;
            const nextLeftSlope = key.nextLeftSlope ?? linearSlope;
            return cubicHermite(key.value, nextKey.value, rightSlope, nextLeftSlope, segmentDuration, t);
        }

        return key.value + t * (nextKey.value - key.value);
    }

    return keys[keys.length - 1].value;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function toInt64Array(value: unknown): Float64Array | null {
    if (value instanceof Float64Array) {
        return value;
    }
    return null;
}

function toInt32Array(value: unknown): Int32Array | null {
    if (value instanceof Int32Array) {
        return value;
    }
    if (value instanceof Float32Array || value instanceof Float64Array) {
        const result = new Int32Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = value[i];
        }
        return result;
    }
    return null;
}

function fbxTimeToSeconds(value: unknown): number | null {
    if (typeof value === "number") {
        return value / FBX_TIME_UNIT;
    }
    return null;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return value;
    }
    return null;
}

function toFloat32Array(value: unknown): Float32Array | null {
    if (value instanceof Float32Array) {
        return value;
    }
    if (value instanceof Float64Array) {
        const result = new Float32Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = value[i];
        }
        return result;
    }
    return null;
}

function buildKeyAttributeIndices(keyCount: number, keyAttrFlags: Int32Array | null, keyAttrRefCount: Int32Array | null): number[] {
    if (!keyAttrFlags || keyAttrFlags.length === 0) {
        return new Array(keyCount).fill(-1);
    }

    if (keyAttrRefCount && keyAttrRefCount.length > 0) {
        let total = 0;
        for (const count of keyAttrRefCount) {
            total += count;
        }

        if (total === keyCount) {
            const indices: number[] = [];
            for (let attrIndex = 0; attrIndex < keyAttrRefCount.length; attrIndex++) {
                const count = keyAttrRefCount[attrIndex];
                for (let i = 0; i < count; i++) {
                    indices.push(attrIndex);
                }
            }
            return indices;
        }
    }

    if (keyAttrFlags.length === keyCount) {
        return Array.from({ length: keyCount }, (_, i) => i);
    }

    if (keyAttrFlags.length === 1) {
        return new Array(keyCount).fill(0);
    }

    return Array.from({ length: keyCount }, (_, i) => Math.min(i, keyAttrFlags.length - 1));
}

function getInterpolationType(flag: number): FBXInterpolationType {
    if ((flag & 0x00000008) !== 0) {
        return "cubic";
    }
    if ((flag & 0x00000004) !== 0) {
        return "linear";
    }
    if ((flag & 0x00000002) !== 0) {
        return "constant";
    }
    return "linear";
}

function getFiniteKeyAttrData(keyAttrData: Float32Array | null, index: number): number | undefined {
    if (!keyAttrData || index < 0 || index >= keyAttrData.length) {
        return undefined;
    }
    const value = keyAttrData[index];
    return Number.isFinite(value) ? value : undefined;
}

function cubicHermite(value0: number, value1: number, slope0: number, slope1: number, segmentDuration: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return h00 * value0 + h10 * segmentDuration * slope0 + h01 * value1 + h11 * segmentDuration * slope1;
}
