/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXDocument, type FBXNode, findChildByName, findDocumentNode, getNodeArray, getPropertyValue, cleanFBXName } from "../types/fbxTypes";

import { type FBXObjectMap, getChildren } from "./connections";
import { getPropertyEntries } from "./propertyTemplates";
import {
    FBX_TIME_UNIT,
    buildKeyframes,
    evaluateCurve,
    keyframesFromSlopes,
    parseExtrapolation,
    combineLayerValue,
    type FBXCurveData,
    type FBXInterpolationType,
    type FBXKeyframe,
    type FBXLayerBlend,
} from "./animationCurve";

export { FBX_TIME_UNIT } from "./animationCurve";
export type { FBXCurveData, FBXExtrapolation, FBXExtrapolationMode, FBXInterpolationType, FBXKeyframe, FBXLayerBlend } from "./animationCurve";
export { combineLayerValue, evaluateCurve, eulerToQuat, quatToEuler } from "./animationCurve";

const KEY_ATTR_DATA_STRIDE = 4;

/** An animation curve node (T/R/S for one bone) */
export interface FBXCurveNodeData {
    /** Property type: "T" (translation), "R" (rotation), "S" (scale) */
    type: string;
    /** Target model (bone) ID */
    targetModelId: number;
    /** Curves for each axis */
    curves: FBXCurveData[];
    /** Index of the owning layer within the stack's layer list */
    layerIndex: number;
    /** Default channel values (`d|X`, `d|Y`, `d|Z`) used for channels without a curve */
    defaultValues?: [number, number, number];
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
    /** Resolved blend semantics used by the evaluator */
    blend: FBXLayerBlend;
    /** Animated layer weight (0-100), when the Weight property carries a curve */
    weightCurve?: FBXCurveData;
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
export function extractAnimations(objectMap: FBXObjectMap, doc?: FBXDocument): FBXAnimationStackData[] {
    const stacks: FBXAnimationStackData[] = [];

    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "AnimationStack") {
            const stack = extractAnimStack(id, node, objectMap);
            if (stack) {
                stacks.push(stack);
            }
        }
    }

    // Pre-7000 files have no AnimationStack objects; their animation lives in the top-level Takes block.
    if (stacks.length === 0 && doc) {
        stacks.push(...extractLegacyTakes(doc, objectMap));
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
        let rotationAccumulationMode = 0;
        let scaleAccumulationMode = 0;

        for (const entry of getPropertyEntries(layerNode)) {
            const v = entry.values[0];
            if (typeof v !== "number") {
                continue;
            }
            if (entry.name === "Weight") {
                weight = v;
            } else if (entry.name === "BlendMode") {
                blendMode = v;
            } else if (entry.name === "RotationAccumulationMode") {
                rotationAccumulationMode = v;
            } else if (entry.name === "ScaleAccumulationMode") {
                scaleAccumulationMode = v;
            }
        }
        const layerIndex = layers.length;

        // AnimationCurveNodes are children of the layer
        const curveNodeEntries = getChildren(objectMap, layerId, "AnimationCurveNode");
        const layerCurveNodes: FBXCurveNodeData[] = [];
        const layerUnsupportedCurveNodes: FBXUnsupportedCurveNodeData[] = [];
        const layerDiagnostics: FBXAnimationDiagnostic[] = [];
        let layerWeightCurve: FBXCurveData | undefined;

        for (const { id: curveNodeId, node: curveNodeNode } of curveNodeEntries) {
            const curveNodeData = extractCurveNode(curveNodeId, curveNodeNode, objectMap, layerIndex);
            if (!curveNodeData) {
                const unsupported = extractUnsupportedCurveNode(curveNodeId, curveNodeNode, objectMap);
                if (unsupported) {
                    // The layer's own Weight property can be animated; it drives blending rather than a target.
                    if (unsupported.targetId === layerId && unsupported.propertyName === "Weight" && unsupported.curves.length > 0) {
                        layerWeightCurve = unsupported.curves[0];
                        continue;
                    }
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
            blend: makeLayerBlend(blendMode, weight, rotationAccumulationMode, scaleAccumulationMode),
            weightCurve: layerWeightCurve,
            curveNodes: layerCurveNodes,
            unsupportedCurveNodes: layerUnsupportedCurveNodes,
            diagnostics: layerDiagnostics,
        });
    }

    if (allCurveNodes.length === 0 && allUnsupportedCurveNodes.length === 0) {
        return null;
    }

    return finalizeAnimStack(name, layers, allCurveNodes, allUnsupportedCurveNodes, diagnostics, minTime, maxTime, declaredTimeSpan);
}

/** Rebases key times to start at zero and resolves the clip span from the declared time span or the key range. */
function finalizeAnimStack(
    name: string,
    layers: FBXAnimationLayerData[],
    allCurveNodes: FBXCurveNodeData[],
    allUnsupportedCurveNodes: FBXUnsupportedCurveNodeData[],
    diagnostics: FBXAnimationDiagnostic[],
    minTime: number,
    maxTime: number,
    declaredTimeSpan: { start: number; stop: number } | null
): FBXAnimationStackData {
    // Keep FBX times as authored: frame N of the group is FBX time N / fps, so clips from the same file stay in sync
    // and callers can seek by FBX time. (Rebasing to zero was the previous behaviour; it is not the SDK's.)
    const timeOffset = 0;

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

    const declaredStart = declaredTimeSpan ? declaredTimeSpan.start - timeOffset : 0;
    const declaredStop = declaredTimeSpan ? Math.max(declaredTimeSpan.stop - timeOffset, declaredStart) : 0;
    const hasDeclaredDuration = declaredStop > declaredStart;
    const startTime = hasDeclaredDuration ? declaredStart : isFinite(minTime) ? minTime - timeOffset : 0;
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

function extractCurveNode(curveNodeId: number, curveNodeNode: FBXNode, objectMap: FBXObjectMap, layerIndex: number): FBXCurveNodeData | null {
    const typeName = cleanFBXName(getPropertyValue<string>(curveNodeNode, 1) ?? "");
    const rawDefaults = extractCurveNodeDefaultValues(curveNodeNode);
    const defaultValues: [number, number, number] | undefined =
        "d|X" in rawDefaults || "d|Y" in rawDefaults || "d|Z" in rawDefaults ? [rawDefaults["d|X"] ?? 0, rawDefaults["d|Y"] ?? 0, rawDefaults["d|Z"] ?? 0] : undefined;

    // Handle T (translation), R (rotation), S (scale) targeting Models
    if (typeName === "T" || typeName === "R" || typeName === "S") {
        const targetModelId = findCurveNodeTarget(curveNodeId, objectMap);
        if (targetModelId === null) {
            return null;
        }

        // A curve node without curves still contributes its default values to layer blending (Maya writes such
        // nodes on the base layer when only additive layers animate a property).
        const curves = extractCurves(curveNodeId, objectMap);
        if (curves.length === 0 && !defaultValues) {
            return null;
        }

        return {
            type: typeName,
            targetModelId,
            curves,
            layerIndex,
            defaultValues,
        };
    }

    // FBX 7.1 writes blend shape weight curves against the geometry, named after the shape channel
    const geometryChannelId = findCurveNodeGeometryShapeChannel(curveNodeId, objectMap);
    if (geometryChannelId !== null) {
        const curves = extractCurves(curveNodeId, objectMap);
        if (curves.length === 0) {
            return null;
        }
        return { type: "DeformPercent", targetModelId: geometryChannelId, curves, layerIndex, defaultValues };
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
            layerIndex,
            defaultValues,
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

/** When a curve node is connected to a Geometry through a property named like one of its blend shape channels. */
function findCurveNodeGeometryShapeChannel(curveNodeId: number, objectMap: FBXObjectMap): number | null {
    for (const conn of objectMap.connections) {
        if (conn.childId !== curveNodeId || conn.type !== "OP" || !conn.propertyName) {
            continue;
        }
        const parentNode = objectMap.objects.get(conn.parentId);
        if (!parentNode || parentNode.name !== "Geometry") {
            continue;
        }
        for (const deformer of getChildren(objectMap, conn.parentId, "Deformer")) {
            if (getPropertyValue<string>(deformer.node, 2) !== "BlendShape") {
                continue;
            }
            for (const channel of getChildren(objectMap, deformer.id, "Deformer")) {
                if (getPropertyValue<string>(channel.node, 2) === "BlendShapeChannel" && cleanFBXName(getPropertyValue<string>(channel.node, 1) ?? "") === conn.propertyName) {
                    return channel.id;
                }
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
                curves.push({ channel, keys, ...extractCurveExtrapolation(curveNode) });
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
                curves.push({ channel: channelNames[i], keys, ...extractCurveExtrapolation(ooChildren[i].node) });
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

    const keyTimes = toInt64Array(getNodeArray(keyTimeNode));
    const keyValues = toFloat32Array(getNodeArray(keyValueNode));
    const keyAttrFlags = toInt32Array(getNodeArray(findChildByName(curveNode, "KeyAttrFlags")));
    const keyAttrData = toFloat32Array(getNodeArray(findChildByName(curveNode, "KeyAttrDataFloat")));
    const keyAttrRefCount = toInt32Array(getNodeArray(findChildByName(curveNode, "KeyAttrRefCount")));

    if (!keyTimes || !keyValues) {
        return [];
    }
    if (keyTimes.length !== keyValues.length) {
        return [];
    }

    const keyAttributeIndices = buildKeyAttributeIndices(keyTimes.length, keyAttrFlags, keyAttrRefCount);
    return buildKeyframes(keyTimes, keyValues, (i) => {
        const attrIndex = keyAttributeIndices[i];
        const flag = attrIndex >= 0 ? (keyAttrFlags?.[attrIndex] ?? 0) : 0;
        const dataOffset = attrIndex * KEY_ATTR_DATA_STRIDE;
        return {
            flags: flag,
            data: [
                getFiniteKeyAttrData(keyAttrData, dataOffset) ?? 0,
                getFiniteKeyAttrData(keyAttrData, dataOffset + 1) ?? 0,
                getFiniteKeyAttrData(keyAttrData, dataOffset + 2) ?? 0,
                getFiniteKeyAttrData(keyAttrData, dataOffset + 3) ?? 0,
            ],
        };
    });
}

function extractCurveExtrapolation(curveNode: FBXNode): { preExtrapolation: FBXExtrapolationLike; postExtrapolation: FBXExtrapolationLike } {
    const read = (name: string) => {
        const node = findChildByName(curveNode, name);
        return parseExtrapolation(findChildByName(node ?? curveNode, "Type")?.properties[0]?.value, findChildByName(node ?? curveNode, "Repetition")?.properties[0]?.value);
    };
    return { preExtrapolation: read("Pre-Extrapolation"), postExtrapolation: read("Post-Extrapolation") };
}
type FBXExtrapolationLike = ReturnType<typeof parseExtrapolation>;

function makeLayerBlend(blendMode: number, weight: number, rotationAccumulationMode: number, scaleAccumulationMode: number): FBXLayerBlend {
    let blended = false;
    let additive = false;
    switch (blendMode) {
        case 0:
            blended = true;
            additive = true;
            break;
        case 2:
            blended = true;
            break;
        default:
            break;
    }
    let w = weight / 100;
    if (w < 0) {
        w = 0;
    }
    if (w > 0.99999) {
        w = 1;
    }
    return { blended, additive, composeRotation: rotationAccumulationMode === 0, composeScale: scaleAccumulationMode === 0, weight: w };
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
    return evaluateCurve(curveData, time, curveData.keys[0].value);
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

function getFiniteKeyAttrData(keyAttrData: Float32Array | null, index: number): number | undefined {
    if (!keyAttrData || index < 0 || index >= keyAttrData.length) {
        return undefined;
    }
    const value = keyAttrData[index];
    return Number.isFinite(value) ? value : undefined;
}

// ── Legacy Takes (FBX 5.x / 6.x) ───────────────────────────────────────────────

/**
 * Pre-7000 files store animation in a top-level `Takes` block instead of AnimationStack/Layer/CurveNode objects:
 *
 *   Takes: { Take: "name" { LocalTime: start, stop
 *     Model: "Model::joint1" { Channel: "Transform" { Channel: "T" { Channel: "X" { Default, KeyVer, KeyCount, Key } } } } } }
 *
 * Each take becomes one animation stack with a single layer. Models are matched through the same legacy string ids
 * that the connection resolver synthesizes for 6.x objects.
 */
export function extractLegacyTakes(doc: FBXDocument, objectMap: FBXObjectMap): FBXAnimationStackData[] {
    const takesNode = findDocumentNode(doc, "Takes");
    if (!takesNode) {
        return [];
    }

    // Take entries name models by their full "Class::Name" string; older writers may use the bare name.
    const legacyIds = new Map<string, number>();
    const legacyIdsByCleanName = new Map<string, number>();
    for (const entry of objectMap.objectEntries) {
        if (entry.legacyName !== undefined && !entry.synthetic && !legacyIds.has(entry.legacyName)) {
            legacyIds.set(entry.legacyName, entry.id);
            const clean = cleanFBXName(entry.legacyName);
            if (!legacyIdsByCleanName.has(clean)) {
                legacyIdsByCleanName.set(clean, entry.id);
            }
        }
    }

    const stacks: FBXAnimationStackData[] = [];
    let syntheticId = -1000000;

    for (const take of takesNode.children) {
        if (take.name !== "Take") {
            continue;
        }
        const name = cleanFBXName(getPropertyValue<string>(take, 0) ?? "Take");
        const timeSpan = readLegacyTimeSpan(findChildByName(take, "LocalTime")) ?? readLegacyTimeSpan(findChildByName(take, "ReferenceTime"));

        const curveNodes: FBXCurveNodeData[] = [];
        const unsupportedCurveNodes: FBXUnsupportedCurveNodeData[] = [];
        let minTime = Infinity;
        let maxTime = 0;
        const track = (curves: FBXCurveData[]) => {
            for (const curve of curves) {
                for (const key of curve.keys) {
                    if (key.time < minTime) {
                        minTime = key.time;
                    }
                    if (key.time > maxTime) {
                        maxTime = key.time;
                    }
                }
            }
        };

        for (const model of take.children) {
            if (model.name !== "Model") {
                continue;
            }
            const rawModelName = getPropertyValue<string>(model, 0) ?? "";
            const targetModelId = legacyIds.get(rawModelName) ?? legacyIdsByCleanName.get(cleanFBXName(rawModelName));
            if (targetModelId === undefined) {
                continue;
            }

            for (const channel of model.children) {
                if (channel.name !== "Channel") {
                    continue;
                }
                const channelName = getPropertyValue<string>(channel, 0) ?? "";
                if (channelName === "Transform") {
                    for (const sub of channel.children) {
                        if (sub.name !== "Channel") {
                            continue;
                        }
                        const subName = getPropertyValue<string>(sub, 0);
                        if (subName !== "T" && subName !== "R" && subName !== "S") {
                            continue;
                        }
                        const curves = readLegacyCompoundChannel(sub, doc.version);
                        if (curves.length > 0) {
                            track(curves);
                            curveNodes.push({ type: subName, targetModelId, curves, layerIndex: 0 });
                        }
                    }
                } else {
                    const curves = readLegacyCompoundChannel(channel, doc.version);
                    if (curves.length > 0) {
                        track(curves);
                        // Blend shape weights are channels named after the shape ("name (Shape)" before 6.0).
                        const shapeChannelId = findLegacyShapeChannel(objectMap, targetModelId, channelName);
                        if (shapeChannelId !== undefined) {
                            curveNodes.push({ type: "DeformPercent", targetModelId: shapeChannelId, curves, layerIndex: 0 });
                            continue;
                        }
                        // Light and camera properties live on the synthesized node attribute.
                        const attributeId = LEGACY_ATTRIBUTE_CHANNELS.has(channelName) ? getChildren(objectMap, targetModelId, "NodeAttribute")[0]?.id : undefined;
                        unsupportedCurveNodes.push({
                            type: channelName,
                            id: syntheticId--,
                            targetId: attributeId ?? targetModelId,
                            propertyName: channelName,
                            curveCount: curves.length,
                            curves,
                            defaultValues: {},
                        });
                    }
                }
            }
        }

        if (curveNodes.length === 0 && unsupportedCurveNodes.length === 0) {
            continue;
        }

        const layer: FBXAnimationLayerData = {
            name: "BaseLayer",
            weight: 100,
            normalizedWeight: 1,
            blendMode: 0,
            blend: makeLayerBlend(0, 100, 0, 0),
            curveNodes,
            unsupportedCurveNodes,
            diagnostics: [],
        };
        stacks.push(finalizeAnimStack(name, [layer], curveNodes, unsupportedCurveNodes, [], minTime, maxTime, timeSpan));
    }

    return stacks;
}

/** Take channel names that animate light or camera attribute properties rather than the model itself. */
const LEGACY_ATTRIBUTE_CHANNELS = new Set([
    "Color",
    "Intensity",
    "OuterAngle",
    "InnerAngle",
    "ConeAngle",
    "HotSpot",
    "FieldOfView",
    "FieldOfViewX",
    "FieldOfViewY",
    "FocalLength",
    "NearPlane",
    "FarPlane",
    "OrthoZoom",
    "Roll",
    "FilmWidth",
    "FilmHeight",
]);

/** Finds the synthesized BlendShapeChannel of a legacy model whose shape is named like the take channel. */
function findLegacyShapeChannel(objectMap: FBXObjectMap, modelId: number, channelName: string): number | undefined {
    const suffix = " (Shape)";
    const name = channelName.endsWith(suffix) ? channelName.slice(0, -suffix.length) : channelName;
    for (const geometry of getChildren(objectMap, modelId, "Geometry")) {
        for (const deformer of getChildren(objectMap, geometry.id, "Deformer")) {
            if (getPropertyValue<string>(deformer.node, 2) !== "BlendShape") {
                continue;
            }
            for (const channel of getChildren(objectMap, deformer.id, "Deformer")) {
                if (getPropertyValue<string>(channel.node, 2) === "BlendShapeChannel" && cleanFBXName(getPropertyValue<string>(channel.node, 1) ?? "") === name) {
                    return channel.id;
                }
            }
        }
    }
    return undefined;
}

function readLegacyTimeSpan(node: FBXNode | undefined): { start: number; stop: number } | null {
    if (!node) {
        return null;
    }
    const start = fbxTimeToSeconds(node.properties[0]?.value);
    const stop = fbxTimeToSeconds(node.properties[1]?.value);
    return start !== null && stop !== null ? { start, stop } : null;
}

/** A channel either holds keys directly (scalar property) or has X/Y/Z child channels (vector property). */
function readLegacyCompoundChannel(node: FBXNode, version: number): FBXCurveData[] {
    const hasKeys = (n: FBXNode) => n.children.some((c) => c.name === "Key" || c.name === "Default");
    if (hasKeys(node)) {
        const keys = decodeLegacyKeys(node, version);
        return keys.length > 0 ? [{ channel: "d|X", keys, ...extractCurveExtrapolation(node) }] : [];
    }
    const curves: FBXCurveData[] = [];
    for (const child of node.children) {
        if (child.name !== "Channel" || !hasKeys(child)) {
            continue;
        }
        const axis = getPropertyValue<string>(child, 0) ?? "X";
        const keys = decodeLegacyKeys(child, version);
        if (keys.length > 0) {
            curves.push({ channel: `d|${axis}`, keys, ...extractCurveExtrapolation(child) });
        }
        if (curves.length === 3) {
            break;
        }
    }
    return curves;
}

/**
 * Decodes the heterogeneous legacy `Key:` list (int64 times, double values and bare mode characters).
 * The layout per key is `time, value, mode[, params...]`, mirroring the FBX SDK's pre-7000 key encoding.
 */
function decodeLegacyKeys(channel: FBXNode, version: number): FBXKeyframe[] {
    const keyNode = findChildByName(channel, "Key");
    if (!keyNode) {
        return [];
    }
    const vals = keyNode.properties.map((p) => p.value);
    const num = (v: unknown): number => (typeof v === "number" ? v : typeof v === "boolean" ? (v ? 1 : 0) : NaN);
    const chr = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String.fromCharCode(v) : typeof v === "boolean" ? (v ? "\x01" : "\0") : "?");

    let keyVer = toNumber(findChildByName(channel, "KeyVer")?.properties[0]?.value) ?? 0;
    if (keyVer <= 0) {
        keyVer = version < 5000 ? 4003 : version < 6000 ? 4004 : 4005;
    }
    const keyCount = toNumber(findChildByName(channel, "KeyCount")?.properties[0]?.value) ?? 0;

    const times: number[] = [];
    const values: number[] = [];
    const interp: FBXInterpolationType[] = [];
    const constNext: boolean[] = [];
    const leftSlope: number[] = [];
    const rightSlope: number[] = [];
    const leftWeight: number[] = [];
    const rightWeight: number[] = [];
    const autoFlag: boolean[] = [];
    let pendingLeft = 0;
    let pendingLeftWeight = 1 / 3;
    let p = 0;

    for (let i = 0; i < keyCount; i++) {
        if (p + 3 > vals.length) {
            break;
        }
        const time = num(vals[p]) / FBX_TIME_UNIT;
        const value = num(vals[p + 1]);
        const mode = chr(vals[p + 2]);
        p += 3;

        let right = 0;
        let nextLeft = 0;
        let weightRight = 1 / 3;
        let nextWeightLeft = 1 / 3;
        let auto = false;
        let kind: FBXInterpolationType = "cubic";
        let isNext = false;

        if (mode === "U") {
            const slopeMode = chr(vals[p]);
            p += 1;
            let numWeights = 1;
            if (slopeMode === "s" || slopeMode === "b") {
                right = num(vals[p]);
                nextLeft = num(vals[p + 1]);
                p += 2;
                if (keyVer === 4003) {
                    numWeights = 0;
                }
            } else if (slopeMode === "a") {
                auto = true;
                if (keyVer <= 4004) {
                    numWeights = 0;
                }
            } else if (slopeMode === "p" || slopeMode === "q") {
                auto = true;
                p += 2;
                numWeights = keyVer <= 4004 ? 1 : 2;
            } else if (slopeMode === "t") {
                auto = true;
                p += 3;
                numWeights = 0;
            } else if (slopeMode === "d") {
                auto = true;
                p += 1;
            } else {
                break;
            }
            for (; numWeights > 0; numWeights--) {
                const weightMode = chr(vals[p]);
                p += 1;
                if (weightMode === "n" || weightMode === "c") {
                    // automatic weights
                } else if (weightMode === "a") {
                    weightRight = num(vals[p]);
                    nextWeightLeft = num(vals[p + 1]);
                    p += 2;
                } else if (weightMode === "l") {
                    nextWeightLeft = num(vals[p]);
                    p += 1;
                } else if (weightMode === "r") {
                    weightRight = num(vals[p]);
                    p += 1;
                } else {
                    p = vals.length;
                    break;
                }
            }
        } else if (mode === "L") {
            kind = "linear";
        } else if (mode === "C") {
            kind = "constant";
            if (keyVer >= 4004) {
                isNext = chr(vals[p]) === "n";
                p += 1;
            }
        } else {
            break;
        }

        times.push(time);
        values.push(value);
        interp.push(kind);
        constNext.push(isNext);
        leftSlope.push(pendingLeft);
        rightSlope.push(right);
        leftWeight.push(pendingLeftWeight);
        rightWeight.push(weightRight);
        autoFlag.push(auto);
        pendingLeft = nextLeft;
        pendingLeftWeight = nextWeightLeft;
    }

    // Resolve automatic and linear tangents now that neighbouring keys are known.
    for (let i = 0; i < times.length; i++) {
        if (autoFlag[i]) {
            const s =
                i > 0 && i + 1 < times.length
                    ? solveLegacyAutoTangent(times[i - 1], times[i], times[i + 1], values[i - 1], values[i], values[i + 1], leftWeight[i], rightWeight[i])
                    : 0;
            leftSlope[i] = s;
            rightSlope[i] = s;
        }
        if (interp[i] === "linear" && i + 1 < times.length) {
            const dt = times[i + 1] - times[i];
            const s = dt > 0 ? (values[i + 1] - values[i]) / dt : 0;
            rightSlope[i] = s;
            if (!autoFlag[i + 1]) {
                leftSlope[i + 1] = s;
            }
        }
    }

    return keyframesFromSlopes(times, values, interp, constNext, leftSlope, rightSlope, leftWeight, rightWeight);
}

/** Time-independent auto tangent with progressive clamping and 1/3 weights, as the SDK computes legacy 'a' keys. */
function solveLegacyAutoTangent(t0: number, t1: number, t2: number, v0: number, v1: number, v2: number, weightLeft: number, weightRight: number): number {
    if (!(t2 > t0)) {
        return 0;
    }
    const slope = (v2 - v0) / (t2 - t0);
    const sign = slope >= 0 ? 1 : -1;
    let abs = sign * slope;
    const rangeLeft = weightLeft * (t1 - t0);
    const rangeRight = weightRight * (t2 - t1);
    let maxLeft = rangeLeft > 0 ? (sign * (v1 - v0)) / rangeLeft : 0;
    let maxRight = rangeRight > 0 ? (sign * (v2 - v1)) / rangeRight : 0;
    if (!(maxLeft > 0)) {
        maxLeft = 0;
    }
    if (!(maxRight > 0)) {
        maxRight = 0;
    }
    abs = Math.min(abs, maxLeft, maxRight);
    return sign * abs;
}

// ── Layered evaluation ─────────────────────────────────────────────────────────

/**
 * Evaluates one transform channel (T, R or S) of a target at `time`, blending every animation layer of the stack the
 * way the FBX SDK does: the first layer animating the channel replaces the static value, later layers are combined
 * according to their blend mode, weight and accumulation modes.
 * @param curveNodes - Curve nodes targeting this model (any layers, any types)
 * @param layers - Stack layers, in order
 * @param type - Channel to evaluate
 * @param staticValue - Value when nothing animates the channel
 * @param rotationOrder - Rotation order of the target (for rotation composition)
 * @param time - Time in seconds
 */
export function evaluateLayeredChannel(
    curveNodes: readonly FBXCurveNodeData[],
    layers: readonly FBXAnimationLayerData[],
    type: "T" | "R" | "S",
    staticValue: readonly [number, number, number],
    rotationOrder: number,
    time: number
): [number, number, number] {
    let result: [number, number, number] = [staticValue[0], staticValue[1], staticValue[2]];
    for (let layerIndex = 0; layerIndex < Math.max(layers.length, 1); layerIndex++) {
        const node = curveNodes.find((cn) => cn.type === type && cn.layerIndex === layerIndex);
        if (!node) {
            continue;
        }
        const defaults = node.defaultValues ?? result;
        const value: [number, number, number] = [
            evaluateCurve(
                node.curves.find((c) => c.channel === "d|X"),
                time,
                defaults[0]
            ),
            evaluateCurve(
                node.curves.find((c) => c.channel === "d|Y"),
                time,
                defaults[1]
            ),
            evaluateCurve(
                node.curves.find((c) => c.channel === "d|Z"),
                time,
                defaults[2]
            ),
        ];
        const layer = layers[layerIndex];
        // The base layer replaces the static value; every other layer blends onto the running result, even when the
        // base layer does not animate this channel (then it blends with the static value), as in the SDK.
        if (layerIndex === 0 || !layer) {
            result = value;
        } else {
            let blend = layer.blend;
            if (layer.weightCurve && blend.blended) {
                let w = evaluateCurve(layer.weightCurve, time, layer.weight) / 100;
                w = w < 0 ? 0 : w > 0.99999 ? 1 : w;
                blend = { ...blend, weight: w };
            }
            result = combineLayerValue(result, value, blend, type, rotationOrder);
        }
    }
    return result;
}

/**
 * True when every curve of the given channel is inside a constant (stepped) segment at `time`, so a baked key at
 * that time should hold its value instead of interpolating towards the next sample.
 */
export function isChannelSteppedAt(curveNodes: readonly FBXCurveNodeData[], type: "T" | "R" | "S", time: number): boolean {
    let sawCurve = false;
    for (const node of curveNodes) {
        if (node.type !== type) {
            continue;
        }
        for (const curve of node.curves) {
            const keys = curve.keys;
            if (keys.length < 2) {
                continue;
            }
            sawCurve = true;
            // Outside the key range the curve extrapolates continuously; only interior constant segments step.
            if (time < keys[0].time || time >= keys[keys.length - 1].time) {
                return false;
            }
            let i = 0;
            while (i + 1 < keys.length && keys[i + 1].time <= time) {
                i++;
            }
            if (keys[i].interpolation !== "constant") {
                return false;
            }
        }
    }
    return sawCurve;
}
