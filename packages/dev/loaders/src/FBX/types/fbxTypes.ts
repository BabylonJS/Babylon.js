/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
/**
 * Intermediate representation for parsed FBX data.
 * Both binary and ASCII parsers produce this same structure.
 */

/** Individual property value within an FBX node */
export type FBXPropertyValue = boolean | number | bigint | string | Float32Array | Float64Array | Int32Array | BigInt64Array | Uint8Array;

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

export interface FBXProperty {
    type: FBXPropertyType;
    value: FBXPropertyValue;
}

/** A node in the FBX document tree */
export interface FBXNode {
    name: string;
    properties: FBXProperty[];
    children: FBXNode[];
}

/** Top-level parsed FBX document */
export interface FBXDocument {
    version: number;
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

/** Get the numeric ID from a node (first property is typically the int64 UID) */
export function getNodeId(node: FBXNode): bigint | undefined {
    const prop = node.properties[0];
    if (prop && (prop.type === "int64" || prop.type === "int32")) {
        return BigInt(prop.value as number | bigint);
    }
    return undefined;
}

/**
 * Clean FBX object names.
 * FBX names may contain:
 *   - A "Class::" prefix (e.g. "Model::valkyrie_mesh") — strip it
 *   - A "\x00\x01ClassName" suffix in binary (e.g. "valkyrie_mesh\x00\x01Model") — strip it
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
