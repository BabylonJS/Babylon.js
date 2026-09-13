/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXDocument, type FBXNode, cleanFBXName, findDocumentNode, getPropertyValue, getSafeFBXObjectId } from "../types/fbxTypes";

/** Connection type: OO = object-to-object, OP = object-to-property */
export type ConnectionType = "OO" | "OP";

/** A resolved FBX object connection. */
export interface FBXConnection {
    /** Connection type. */
    type: ConnectionType;
    /** Child object ID. */
    childId: number;
    /** Parent object ID. */
    parentId: number;
    /** For OP connections, the property name on the parent (e.g. "DiffuseColor") */
    propertyName?: string;
}

/** Object table entry used by the FBX connection graph. */
export interface FBXObjectEntry {
    /** Object ID. */
    id: number;
    /** Object node. */
    node: FBXNode;
    /** Source of the object entry. */
    source: "Objects" | "legacySyntheticGeometry" | "legacySyntheticAttribute" | "legacySyntheticBlendShape";
    /** Legacy string object name, when applicable. */
    legacyName?: string;
    /** True if the object was synthesized for legacy compatibility. */
    synthetic: boolean;
}

/** Raw connection-table entry and import status. */
export interface FBXConnectionEntry {
    /** Source node name. */
    source: "C" | "Connect";
    /** Raw connection type. */
    rawType?: string;
    /** Child object ID, when resolved. */
    childId?: number;
    /** Parent object ID, when resolved. */
    parentId?: number;
    /** OP connection property name, when present. */
    propertyName?: string;
    /** True if the connection was accepted into the resolved graph. */
    accepted: boolean;
}

/** Reason a connection produced a diagnostic. */
export type FBXConnectionDiagnosticReason =
    "unsupported-connection-type" | "missing-connection-endpoint" | "unresolved-legacy-endpoint" | "unresolved-object-reference" | "duplicate-parent" | "self-loop";

/** Recoverable connection graph issue. */
export interface FBXConnectionDiagnostic {
    /** Diagnostic reason. */
    reason: FBXConnectionDiagnosticReason;
    /** Human-readable diagnostic message. */
    message: string;
    /** Connection-table index associated with the diagnostic, if applicable. */
    connectionIndex?: number;
    /** Connection type associated with the diagnostic, if applicable. */
    type?: string;
    /** Child object ID associated with the diagnostic, if applicable. */
    childId?: number;
    /** Parent object ID associated with the diagnostic, if applicable. */
    parentId?: number;
    /** OP connection property name associated with the diagnostic, if applicable. */
    propertyName?: string;
}

/** Resolved FBX object and connection graph. */
export interface FBXObjectMap {
    /** All objects by their unique ID */
    objects: Map<number, FBXNode>;
    /** Object table entries, including synthetic compatibility objects */
    objectEntries: FBXObjectEntry[];
    /** Children of each object ID */
    childrenOf: Map<number, { id: number; propertyName?: string }[]>;
    /** Parent of each object ID */
    parentOf: Map<number, { id: number; propertyName?: string }>;
    /** Raw connection list */
    connections: FBXConnection[];
    /** Raw connection-table entries and whether they were accepted into the graph */
    connectionEntries: FBXConnectionEntry[];
    /** Unsupported or suspicious connection shapes encountered while preserving graph behavior */
    diagnostics: FBXConnectionDiagnostic[];
}

/**
 * Build a connection graph from a parsed FBX document.
 * Maps object IDs to their FBXNode and resolves parent-child relationships.
 */
export function resolveConnections(doc: FBXDocument): FBXObjectMap {
    const objects = new Map<number, FBXNode>();
    const objectEntries: FBXObjectEntry[] = [];
    const childrenOf = new Map<number, { id: number; propertyName?: string }[]>();
    const parentOf = new Map<number, { id: number; propertyName?: string }>();
    const connections: FBXConnection[] = [];
    const connectionEntries: FBXConnectionEntry[] = [];
    const diagnostics: FBXConnectionDiagnostic[] = [];
    // Legacy (6.x and older) objects are identified by their full "Class::Name" string, exactly as the SDK does,
    // so that a material, texture and video sharing a base name stay distinct. Connections that only carry the
    // bare name fall back to the first object with that name.
    const legacyIds = new Map<string, number>();
    const legacyIdsByCleanName = new Map<string, number>();
    const syntheticLegacyIds = new Map<string, Map<string, number>>();
    const legacyGeometryByModelId = new Map<number, number>();
    let nextLegacyId = -1;

    const getLegacyId = (rawName: string): number => {
        let id = legacyIds.get(rawName);
        if (id === undefined) {
            id = nextLegacyId--;
            legacyIds.set(rawName, id);
            const clean = cleanFBXName(rawName);
            if (!legacyIdsByCleanName.has(clean)) {
                legacyIdsByCleanName.set(clean, id);
            }
        }
        return id;
    };

    const getSyntheticLegacyId = (role: string, name: string): number => {
        let idsByName = syntheticLegacyIds.get(role);
        if (!idsByName) {
            idsByName = new Map();
            syntheticLegacyIds.set(role, idsByName);
        }

        let id = idsByName.get(name);
        if (id === undefined) {
            id = nextLegacyId--;
            idsByName.set(name, id);
        }
        return id;
    };

    /** Turns `Shape` children of a geometry into a BlendShape deformer with one channel and shape geometry each. */
    const synthesizeInlineShapes = (owner: FBXNode, geometryId: number, key: string): void => {
        const shapes = owner.children.filter((c) => c.name === "Shape");
        if (shapes.length === 0) {
            return;
        }
        const deformerId = getSyntheticLegacyId("BlendShape", key);
        const deformer = createLegacyObject("Deformer", deformerId, `Deformer::${cleanFBXName(key)}`, "BlendShape", [createVersionNode(100)]);
        objects.set(deformerId, deformer);
        objectEntries.push({ id: deformerId, node: deformer, source: "legacySyntheticBlendShape", legacyName: key, synthetic: true });
        addConnection(connections, childrenOf, parentOf, diagnostics, "OO", deformerId, geometryId);
        for (const shape of shapes) {
            const shapeName = cleanFBXName(getPropertyValue<string>(shape, 0) ?? "Shape");
            const channelId = getSyntheticLegacyId("BlendShapeChannel", `${key}|${shapeName}`);
            const channel = createLegacyObject("Deformer", channelId, `SubDeformer::${shapeName}`, "BlendShapeChannel", [
                createVersionNode(100),
                { name: "DeformPercent", properties: [{ type: "float64", value: 0 }], children: [] },
                {
                    name: "Properties60",
                    properties: [],
                    children: [
                        {
                            name: "Property",
                            properties: [
                                { type: "string", value: "DeformPercent" },
                                { type: "string", value: "Number" },
                                { type: "string", value: "A" },
                                { type: "float64", value: 0 },
                            ],
                            children: [],
                        },
                    ],
                },
            ]);
            objects.set(channelId, channel);
            objectEntries.push({ id: channelId, node: channel, source: "legacySyntheticBlendShape", legacyName: `${key}|${shapeName}`, synthetic: true });
            addConnection(connections, childrenOf, parentOf, diagnostics, "OO", channelId, deformerId);
            const shapeId = getSyntheticLegacyId("Shape", `${key}|${shapeName}`);
            const shapeGeometry = createLegacyObject("Geometry", shapeId, `Geometry::${shapeName}`, "Shape", shape.children);
            objects.set(shapeId, shapeGeometry);
            objectEntries.push({ id: shapeId, node: shapeGeometry, source: "legacySyntheticBlendShape", legacyName: `${key}|${shapeName}`, synthetic: true });
            addConnection(connections, childrenOf, parentOf, diagnostics, "OO", shapeId, channelId);
        }
    };

    // Build object map from Objects section
    const objectsNode = findDocumentNode(doc, "Objects");
    if (objectsNode) {
        for (const obj of objectsNode.children) {
            const idProp = obj.properties[0];
            if (idProp) {
                const id = toObjectNumber(idProp.value);
                if (id !== undefined) {
                    objects.set(id, obj);
                    objectEntries.push({ id, node: obj, source: "Objects", synthetic: false });
                    if (obj.name === "Geometry" && getPropertyValue<string>(obj, 2) === "Mesh") {
                        // FBX 7.1 stores blend shapes inline in the geometry, like 6.x files.
                        synthesizeInlineShapes(obj, id, String(id));
                    }
                } else if (typeof idProp.value === "string") {
                    const legacyName = idProp.value;
                    const id = getLegacyId(legacyName);
                    const normalized = normalizeLegacyObject(obj, id);
                    objects.set(id, normalized);
                    objectEntries.push({ id, node: normalized, source: "Objects", legacyName, synthetic: false });

                    const legacySubType = obj.name === "Model" ? getPropertyValue<string>(obj, 1) : undefined;
                    if (legacySubType === "Mesh") {
                        const geometryId = getSyntheticLegacyId("Geometry", legacyName);
                        const geometry = createLegacyGeometry(obj, geometryId);
                        objects.set(geometryId, geometry);
                        objectEntries.push({ id: geometryId, node: geometry, source: "legacySyntheticGeometry", legacyName, synthetic: true });
                        addConnection(connections, childrenOf, parentOf, diagnostics, "OO", geometryId, id);
                        legacyGeometryByModelId.set(id, geometryId);

                        // Inline blend shapes become a BlendShape deformer with one channel and one shape geometry each.
                        synthesizeInlineShapes(obj, geometryId, legacyName);
                    } else if (legacySubType === "Light" || legacySubType === "Camera") {
                        // 6.x lights and cameras keep their attribute properties on the model; expose them as a NodeAttribute.
                        const attributeId = getSyntheticLegacyId("NodeAttribute", legacyName);
                        const attribute = createLegacyObject("NodeAttribute", attributeId, `NodeAttribute::${cleanFBXName(legacyName)}`, legacySubType, obj.children);
                        objects.set(attributeId, attribute);
                        objectEntries.push({ id: attributeId, node: attribute, source: "legacySyntheticAttribute", legacyName, synthetic: true });
                        addConnection(connections, childrenOf, parentOf, diagnostics, "OO", attributeId, id);
                    }
                }
            }
        }
    }

    // Parse connections
    const connectionsNode = findDocumentNode(doc, "Connections");
    if (connectionsNode) {
        for (const c of connectionsNode.children) {
            if (c.name !== "C" && c.name !== "Connect") {
                continue;
            }

            const connectionIndex = connectionEntries.length;
            let type = getPropertyValue<string>(c, 0);
            let childIdRaw = c.properties[1]?.value;
            let parentIdRaw = c.properties[2]?.value;
            let poPropertyName: string | undefined;
            // "PO" connects a property of the first object to the second object (6.x constraints use it for
            // "Constrained Object"); it is the mirror image of "OP", so store it as OP from the object to the owner.
            if (type === "PO" && typeof c.properties[2]?.value === "string" && c.properties.length > 3) {
                type = "OP";
                poPropertyName = c.properties[2].value as string;
                childIdRaw = c.properties[3]?.value;
                parentIdRaw = c.properties[1]?.value;
            }
            const entry: FBXConnectionEntry = {
                source: c.name,
                rawType: type,
                accepted: false,
            };
            connectionEntries.push(entry);

            if (type !== "OO" && type !== "OP") {
                const childId = childIdRaw === undefined ? undefined : toObjectId(childIdRaw, legacyIds, legacyIdsByCleanName);
                const parentId = parentIdRaw === undefined ? undefined : toObjectId(parentIdRaw, legacyIds, legacyIdsByCleanName);
                diagnostics.push({
                    reason: "unsupported-connection-type",
                    message: `Unsupported FBX connection type '${type ?? ""}' was not added to the graph.`,
                    connectionIndex,
                    type,
                    childId,
                    parentId,
                });
                continue;
            }

            if (childIdRaw === undefined || parentIdRaw === undefined) {
                diagnostics.push({
                    reason: "missing-connection-endpoint",
                    message: "FBX connection is missing a child or parent endpoint.",
                    connectionIndex,
                    type,
                });
                continue;
            }

            const childId = toObjectId(childIdRaw, legacyIds, legacyIdsByCleanName);
            let parentId = toObjectId(parentIdRaw, legacyIds, legacyIdsByCleanName);
            // 6.x deformers connect to the model; the importer expects them on the geometry.
            if (childId !== undefined && parentId !== undefined && objects.get(childId)?.name === "Deformer") {
                parentId = legacyGeometryByModelId.get(parentId) ?? parentId;
            }
            if (childId === undefined || parentId === undefined) {
                diagnostics.push({
                    reason: "unresolved-legacy-endpoint",
                    message: "FBX connection references a legacy string endpoint that is not present in the object table.",
                    connectionIndex,
                    type,
                });
                continue;
            }

            const propertyName = poPropertyName ?? (type === "OP" && c.properties.length > 3 ? getPropertyValue<string>(c, 3) : undefined);

            entry.childId = childId;
            entry.parentId = parentId;
            entry.propertyName = propertyName;

            if (childId === parentId) {
                diagnostics.push({
                    reason: "self-loop",
                    message: "FBX connection references the same object as child and parent.",
                    connectionIndex,
                    type,
                    childId,
                    parentId,
                    propertyName,
                });
            }
            if (!objects.has(childId)) {
                diagnostics.push({
                    reason: "unresolved-object-reference",
                    message: "FBX connection child ID is not present in the object table.",
                    connectionIndex,
                    type,
                    childId,
                    parentId,
                    propertyName,
                });
            }
            if (parentId !== 0 && !objects.has(parentId)) {
                diagnostics.push({
                    reason: "unresolved-object-reference",
                    message: "FBX connection parent ID is not present in the object table.",
                    connectionIndex,
                    type,
                    childId,
                    parentId,
                    propertyName,
                });
            }

            addConnection(connections, childrenOf, parentOf, diagnostics, type, childId, parentId, propertyName, connectionIndex);
            entry.accepted = true;
        }
    }

    return { objects, objectEntries, childrenOf, parentOf, connections, connectionEntries, diagnostics };
}

/** Get all child objects of a given parent ID, optionally filtered by node name */
export function getChildren(map: FBXObjectMap, parentId: number, nodeName?: string): { id: number; node: FBXNode; propertyName?: string }[] {
    const children = map.childrenOf.get(parentId) ?? [];
    const result: { id: number; node: FBXNode; propertyName?: string }[] = [];

    for (const child of children) {
        const node = map.objects.get(child.id);
        if (node && (!nodeName || node.name === nodeName)) {
            result.push({ id: child.id, node, propertyName: child.propertyName });
        }
    }

    return result;
}

function toObjectNumber(value: unknown): number | undefined {
    return getSafeFBXObjectId(value);
}

function toObjectId(value: unknown, legacyIds: Map<string, number>, legacyIdsByCleanName: Map<string, number>): number | undefined {
    const numericId = toObjectNumber(value);
    if (numericId !== undefined) {
        return numericId;
    }
    if (typeof value !== "string") {
        return undefined;
    }
    const direct = legacyIds.get(value);
    if (direct !== undefined) {
        return direct;
    }
    const legacyName = cleanFBXName(value);
    if (legacyName === "Scene") {
        return 0;
    }
    return legacyIdsByCleanName.get(legacyName);
}

function createVersionNode(version: number): FBXNode {
    return { name: "Version", properties: [{ type: "int32", value: version }], children: [] };
}

function createLegacyObject(nodeName: string, id: number, name: string, subType: string, children: FBXNode[]): FBXNode {
    return {
        name: nodeName,
        properties: [
            { type: "int64", value: id },
            { type: "string", value: name },
            { type: "string", value: subType },
        ],
        children,
    };
}

function addConnection(
    connections: FBXConnection[],
    childrenOf: Map<number, { id: number; propertyName?: string }[]>,
    parentOf: Map<number, { id: number; propertyName?: string }>,
    diagnostics: FBXConnectionDiagnostic[],
    type: ConnectionType,
    childId: number,
    parentId: number,
    propertyName?: string,
    connectionIndex?: number
): void {
    connections.push({ type, childId, parentId, propertyName });

    if (!childrenOf.has(parentId)) {
        childrenOf.set(parentId, []);
    }
    childrenOf.get(parentId)!.push({ id: childId, propertyName });
    const existingParent = parentOf.get(childId);
    if (existingParent) {
        diagnostics.push({
            reason: "duplicate-parent",
            message: "FBX object has multiple parents; preserving the existing last-parent behavior.",
            connectionIndex,
            type,
            childId,
            parentId,
            propertyName,
        });
    }
    parentOf.set(childId, { id: parentId, propertyName });
}

function normalizeLegacyObject(node: FBXNode, id: number): FBXNode {
    const name = cleanFBXName(getPropertyValue<string>(node, 0) ?? node.name);
    const subType = getPropertyValue<string>(node, 1) ?? "";
    return {
        ...node,
        properties: [
            { type: "int64", value: id },
            { type: "string", value: name },
            { type: "string", value: subType },
        ],
    };
}

function createLegacyGeometry(modelNode: FBXNode, geometryId: number): FBXNode {
    const name = cleanFBXName(getPropertyValue<string>(modelNode, 0) ?? "Geometry");
    return {
        name: "Geometry",
        properties: [
            { type: "int64", value: geometryId },
            { type: "string", value: name },
            { type: "string", value: "Mesh" },
        ],
        children: modelNode.children,
    };
}
