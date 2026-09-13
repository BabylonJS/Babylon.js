/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
/**
 * Intermediate representation for parsed FBX data.
 * Both binary and ASCII parsers produce this same structure.
 */

/** Individual property value within an FBX node */
export type FBXPropertyValue = boolean | number | string | Float32Array | Float64Array | Int32Array | Uint8Array;

/** Parsed FBX property type identifier. */
export type FBXPropertyType =
    | "boolean" // 'C'
    | "int16" // 'Y'
    | "int32" // 'I'
    | "int64" // 'L'
    | "float32" // 'F'
    | "float64" // 'D'
    | "string" // 'S'
    | "raw" // 'R'
    | "float32[]" // 'f'
    | "float64[]" // 'd'
    | "int32[]" // 'i'
    | "int64[]" // 'l'
    | "boolean[]"; // 'b' (stored as Uint8Array where 0=false, 1=true)

/** Individual property within an FBX node. */
export interface FBXProperty {
    /** Parsed property type. */
    type: FBXPropertyType;
    /** Parsed property value. */
    value: FBXPropertyValue;
}

/** A node in the FBX document tree */
export interface FBXNode {
    /** Node name. */
    name: string;
    /** Node properties. */
    properties: FBXProperty[];
    /** Child nodes. */
    children: FBXNode[];
}

/** Top-level parsed FBX document */
export interface FBXDocument {
    /** FBX file version. */
    version: number;
    /** Top-level document nodes. */
    nodes: FBXNode[];
}

/** Helper to find a child node by name */
export function findChildByName(node: FBXNode, name: string): FBXNode | undefined {
    return node.children.find((c) => c.name === name);
}

/** Helper to find all children with a given name */
export function findChildrenByName(node: FBXNode, name: string): FBXNode[] {
    return node.children.filter((c) => c.name === name);
}

/** Helper to find a top-level node in a document */
export function findDocumentNode(doc: FBXDocument, name: string): FBXNode | undefined {
    return doc.nodes.find((n) => n.name === name);
}

/** Extract a property value by index, with type narrowing */
export function getPropertyValue<T extends FBXPropertyValue>(node: FBXNode, index: number): T | undefined {
    if (index < node.properties.length) {
        return node.properties[index].value as T;
    }
    return undefined;
}

/**
 * Converts an FBX object ID value to a safe JavaScript number.
 * @param value - Parsed FBX object ID value
 * @returns The object ID, or undefined when the value is not numeric
 */
export function getSafeFBXObjectId(value: unknown): number | undefined {
    if (typeof value !== "number") {
        return undefined;
    }
    // IDs beyond 2^53 lose precision when read as a double, but identical bytes always produce the identical
    // double, so they remain stable map keys. ufbx accepts such files (e.g. negative 64-bit IDs); so do we.
    return value;
}

/** Typed array payload types produced by the parsers. */
export type FBXArrayValue = Float32Array | Float64Array | Int32Array | Uint8Array;

/**
 * Returns the array payload of a node.
 * FBX 7.x stores arrays as a single array property. FBX 6.x (and some 7.x ASCII exporters) store them as a run of
 * scalar properties, and a one-element array degenerates to a single scalar. All of these are coalesced here.
 * @param node - Node whose properties hold the array
 * @returns The array, or null when the node has no numeric payload
 */
export function getNodeArray(node: FBXNode | undefined | null): FBXArrayValue | null {
    if (!node || node.properties.length === 0) {
        return null;
    }
    const first = node.properties[0].value;
    if (node.properties.length === 1 && (first instanceof Float32Array || first instanceof Float64Array || first instanceof Int32Array || first instanceof Uint8Array)) {
        return first;
    }
    const out = new Float64Array(node.properties.length);
    for (let i = 0; i < node.properties.length; i++) {
        const v = node.properties[i].value;
        if (typeof v === "number") {
            out[i] = v;
        } else if (typeof v === "boolean") {
            out[i] = v ? 1 : 0;
        } else {
            return null;
        }
    }
    return out;
}

/** Get the numeric ID from a node (first property is typically the int64 UID) */
export function getNodeId(node: FBXNode): number | undefined {
    const prop = node.properties[0];
    if (prop && (prop.type === "int64" || prop.type === "int32")) {
        return getSafeFBXObjectId(prop.value);
    }
    return undefined;
}

/**
 * Clean FBX object names.
 * FBX names may contain:
 *   - A "Class::" prefix (e.g. "Model::valkyrie_mesh") — strip it
 *   - A binary null/control-character class suffix — strip it
 */
export function cleanFBXName(fbxName: string): string {
    // Binary FBX: "Name\x00\x01Class" — the name is everything before the separator and may itself contain "::".
    const sepIdx = fbxName.indexOf("\0\x01");
    if (sepIdx >= 0) {
        return fbxName.substring(0, sepIdx);
    }

    // ASCII FBX: "Class::Name" — strip only the leading class prefix ("Model::Cube::Model" -> "Cube::Model").
    const colonIdx = fbxName.indexOf("::");
    if (colonIdx >= 0) {
        return fbxName.substring(colonIdx + 2);
    }

    return fbxName;
}
