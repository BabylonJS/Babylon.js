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
    if (!Number.isSafeInteger(value)) {
        throw new Error(`Unsafe FBX object ID ${value.toString()}: object IDs must be safe integers.`);
    }
    return value;
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
    // Strip \x00\x01 suffix (binary FBX name/class separator)
    const nullIdx = fbxName.indexOf("\0");
    if (nullIdx >= 0) {
        fbxName = fbxName.substring(0, nullIdx);
    }

    // Strip "ClassName::" prefix (ASCII FBX)
    const colonIdx = fbxName.indexOf("::");
    if (colonIdx >= 0) {
        fbxName = fbxName.substring(colonIdx + 2);
    }

    return fbxName;
}
