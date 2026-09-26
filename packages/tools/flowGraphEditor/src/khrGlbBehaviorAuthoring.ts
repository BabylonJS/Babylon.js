import { type Node } from "core/node";
import { applyEdits, modify } from "jsonc-parser";
import { BuildKhrSelectionRevealGraph } from "./khrSelectionRevealTemplate";

const GlbMagic = 0x46546c67;
const JsonChunk = 0x4e4f534a;

function _IsRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

/** The glTF fields needed while adding a behavior to an existing GLB. Other fields are retained. */
export interface IGlbDocument {
    /** glTF asset metadata. */
    asset?: { version?: string };
    /** Source nodes in stable glTF index order. */
    nodes?: Array<{ children?: number[]; extensions?: Record<string, unknown>; [key: string]: unknown }>;
    /** A graph takes control of every glTF animation in the asset. */
    animations?: unknown;
    /** Root glTF extensions. */
    extensions?: Record<string, unknown>;
    /** Declared glTF extensions. */
    extensionsUsed?: string[];
    /** Required glTF extensions. */
    extensionsRequired?: string[];
    [key: string]: unknown;
}

function _ReadGlb(bytes: Uint8Array): { document: IGlbDocument; jsonText: string; suffixOffset: number } {
    if (bytes.byteLength < 20) {
        throw new Error("GLB header or JSON chunk header is incomplete.");
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(0, true) !== GlbMagic || view.getUint32(4, true) !== 2) {
        throw new Error("Expected a version 2 GLB header.");
    }
    if (view.getUint32(8, true) !== bytes.byteLength) {
        throw new Error("GLB header length does not match the file length.");
    }
    const jsonLength = view.getUint32(12, true);
    if (view.getUint32(16, true) !== JsonChunk) {
        throw new Error("The first GLB chunk must be a JSON chunk.");
    }
    if (jsonLength === 0 || jsonLength % 4 !== 0 || jsonLength > bytes.byteLength - 20) {
        throw new Error("The GLB JSON chunk length is invalid.");
    }
    const suffixOffset = 20 + jsonLength;
    let offset = suffixOffset;
    while (offset < bytes.byteLength) {
        if (bytes.byteLength - offset < 8) {
            throw new Error("The GLB has an incomplete chunk header.");
        }
        const length = view.getUint32(offset, true);
        if (length % 4 !== 0 || length > bytes.byteLength - offset - 8) {
            throw new Error("The GLB has an invalid chunk length.");
        }
        offset += 8 + length;
    }
    let document: IGlbDocument;
    let jsonText: string;
    try {
        jsonText = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(20, suffixOffset));
        document = JSON.parse(jsonText) as IGlbDocument;
    } catch {
        throw new Error("The GLB JSON chunk is invalid.");
    }
    if (!document || typeof document !== "object" || Array.isArray(document) || document.asset?.version !== "2.0") {
        throw new Error("The GLB must contain a glTF 2.0 document.");
    }
    return { document, jsonText, suffixOffset };
}

/**
 * Reads the source glTF document without loading or serializing its scene.
 * @param bytes original GLB bytes
 * @returns parsed glTF document
 */
export function ReadGlbDocument(bytes: Uint8Array): IGlbDocument {
    return _ReadGlb(bytes).document;
}

/**
 * Finds the glTF node index recorded by the loader, including on an ordinary primitive's immediate parent.
 * @param node loaded Babylon node
 * @param nodeCount number of nodes in the source glTF document
 * @returns the source glTF node index, if unambiguous
 */
export function GetGlbNodeIndex(node: Node, nodeCount: number): number | undefined {
    for (const current of [node, node.parent]) {
        if (!current || (current !== node && (node as Node & { skeleton?: unknown }).skeleton)) {
            break;
        }
        const pointers = (current as Node & { _internalMetadata?: { gltf?: { pointers?: unknown } } })._internalMetadata?.gltf?.pointers;
        if (!Array.isArray(pointers)) {
            continue;
        }
        const indices = new Set<number>();
        for (const pointer of pointers) {
            const match = typeof pointer === "string" ? /^\/nodes\/(0|[1-9]\d*)$/.exec(pointer) : null;
            if (match) {
                indices.add(Number(match[1]));
            }
        }
        if (indices.size > 0) {
            const index = indices.values().next().value as number;
            return indices.size === 1 && Number.isSafeInteger(index) && index < nodeCount ? index : undefined;
        }
    }
    return undefined;
}

/**
 * Adds only the behavior extension fields; the BIN and subsequent chunks stay byte-identical.
 * @param bytes original GLB bytes
 * @param triggerIndex source glTF trigger node index
 * @param revealIndex source glTF reveal node index
 * @returns the authored GLB bytes
 */
export function PatchKhrSelectionRevealGlb(bytes: Uint8Array, triggerIndex: number, revealIndex: number): Uint8Array {
    const { document, jsonText: sourceJsonText, suffixOffset } = _ReadGlb(bytes);
    if (document.animations !== undefined && (!Array.isArray(document.animations) || document.animations.length > 0)) {
        throw new Error("Adding a behavior graph would stop the source GLB's animations from playing automatically; animated GLBs need explicit animation behavior.");
    }
    const nodes = document.nodes;
    if (!Array.isArray(nodes)) {
        throw new Error("The source GLB has no glTF nodes.");
    }
    if (
        nodes.some(
            (node) =>
                !node ||
                typeof node !== "object" ||
                Array.isArray(node) ||
                (node.extensions !== undefined && (!node.extensions || typeof node.extensions !== "object" || Array.isArray(node.extensions)))
        ) ||
        (document.extensions !== undefined && (!document.extensions || typeof document.extensions !== "object" || Array.isArray(document.extensions))) ||
        (document.extensionsUsed !== undefined && (!Array.isArray(document.extensionsUsed) || document.extensionsUsed.some((name) => typeof name !== "string"))) ||
        (document.extensionsRequired !== undefined && (!Array.isArray(document.extensionsRequired) || document.extensionsRequired.some((name) => typeof name !== "string")))
    ) {
        throw new Error("The source GLB has malformed nodes or extension declarations.");
    }
    if (
        !Number.isSafeInteger(triggerIndex) ||
        !Number.isSafeInteger(revealIndex) ||
        triggerIndex < 0 ||
        revealIndex < 0 ||
        triggerIndex >= nodes.length ||
        revealIndex >= nodes.length
    ) {
        throw new Error("A selected glTF node index is outside the source document.");
    }
    if (triggerIndex === revealIndex) {
        throw new Error("Select two different glTF nodes.");
    }
    const visited = new Set<number>();
    const isAncestor = (index: number): boolean => {
        if (index === triggerIndex) {
            return true;
        }
        if (visited.has(index)) {
            return false;
        }
        visited.add(index);
        return Array.isArray(nodes[index]?.children) && nodes[index].children!.some((child) => Number.isInteger(child) && child >= 0 && child < nodes.length && isAncestor(child));
    };
    if (isAncestor(revealIndex)) {
        throw new Error("The reveal glTF node cannot be an ancestor of the trigger.");
    }
    if (
        (document.extensions &&
            (Object.prototype.hasOwnProperty.call(document.extensions, "KHR_interactivity") || Object.prototype.hasOwnProperty.call(document.extensions, "BABYLON_flow_graph"))) ||
        document.extensionsUsed?.includes("KHR_interactivity") ||
        document.extensionsUsed?.includes("BABYLON_flow_graph")
    ) {
        throw new Error("The source GLB already has a behavior graph.");
    }
    const triggerSelectability = nodes[triggerIndex].extensions?.KHR_node_selectability;
    if (triggerSelectability !== undefined && (!_IsRecord(triggerSelectability) || (triggerSelectability.selectable !== undefined && triggerSelectability.selectable !== true))) {
        throw new Error("The trigger selectability extension is malformed or disables selection.");
    }
    const revealVisibility = nodes[revealIndex].extensions?.KHR_node_visibility;
    if (revealVisibility !== undefined && (!_IsRecord(revealVisibility) || (revealVisibility.visible !== undefined && typeof revealVisibility.visible !== "boolean"))) {
        throw new Error("The reveal visibility extension is malformed.");
    }
    const parents = Array.from({ length: nodes.length }, () => new Array<number>());
    for (const [index, node] of nodes.entries()) {
        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                if (Number.isInteger(child) && child >= 0 && child < nodes.length) {
                    parents[child].push(index);
                }
            }
        }
    }
    const pending = [triggerIndex];
    const checked = new Set<number>();
    while (pending.length > 0) {
        const index = pending.pop()!;
        if (checked.has(index)) {
            continue;
        }
        checked.add(index);
        const ancestorSelectability = nodes[index].extensions?.KHR_node_selectability;
        if (
            ancestorSelectability !== undefined &&
            (!_IsRecord(ancestorSelectability) ||
                (ancestorSelectability.selectable !== undefined && typeof ancestorSelectability.selectable !== "boolean") ||
                ancestorSelectability.selectable === false)
        ) {
            throw new Error("The trigger or an ancestor disables selectability.");
        }
        const ancestorVisibility = nodes[index].extensions?.KHR_node_visibility;
        if (
            ancestorVisibility !== undefined &&
            (!_IsRecord(ancestorVisibility) ||
                (ancestorVisibility.visible !== undefined && typeof ancestorVisibility.visible !== "boolean") ||
                ancestorVisibility.visible === false)
        ) {
            throw new Error("The trigger or an ancestor disables visibility.");
        }
        for (const parent of parents[index]) {
            pending.push(parent);
        }
    }
    // Setting the reveal node's local visibility cannot override a hidden ancestor.
    // Keep every source ancestor unchanged and reject targets that cannot be revealed.
    const pendingRevealAncestors = [...parents[revealIndex]];
    const checkedRevealAncestors = new Set<number>();
    while (pendingRevealAncestors.length > 0) {
        const index = pendingRevealAncestors.pop()!;
        if (checkedRevealAncestors.has(index)) {
            continue;
        }
        checkedRevealAncestors.add(index);
        const ancestorVisibility = nodes[index].extensions?.KHR_node_visibility;
        if (
            ancestorVisibility !== undefined &&
            (!_IsRecord(ancestorVisibility) ||
                (ancestorVisibility.visible !== undefined && typeof ancestorVisibility.visible !== "boolean") ||
                ancestorVisibility.visible === false)
        ) {
            throw new Error("A reveal ancestor disables visibility.");
        }
        for (const parent of parents[index]) {
            pendingRevealAncestors.push(parent);
        }
    }
    // Edit only behavior-owned JSON paths. Parsing is used for validation, but serializing the
    // parsed document would round large numeric extras and rewrite unrelated source tokens.
    let jsonText = sourceJsonText;
    const write = (path: Array<string | number>, value: unknown, isArrayInsertion = false) => {
        jsonText = applyEdits(jsonText, modify(jsonText, path, value, { isArrayInsertion }));
    };
    write(["extensions", "KHR_interactivity"], BuildKhrSelectionRevealGraph(triggerIndex, revealIndex));
    if (triggerSelectability === undefined) {
        write(["nodes", triggerIndex, "extensions", "KHR_node_selectability"], { selectable: true });
    }
    if (revealVisibility === undefined) {
        write(["nodes", revealIndex, "extensions", "KHR_node_visibility"], { visible: false });
    } else if (revealVisibility.visible !== false) {
        write(["nodes", revealIndex, "extensions", "KHR_node_visibility", "visible"], false);
    }
    for (const name of ["KHR_interactivity", "KHR_node_selectability", "KHR_node_visibility"]) {
        for (const key of ["extensionsUsed", "extensionsRequired"] as const) {
            const names = document[key];
            if (!names) {
                document[key] = [name];
                write([key], [name]);
            } else if (!names.includes(name)) {
                write([key, names.length], name, true);
                names.push(name);
            }
        }
    }

    const encoded = new TextEncoder().encode(jsonText);
    const paddedLength = Math.ceil(encoded.length / 4) * 4;
    const suffix = bytes.subarray(suffixOffset);
    const totalLength = 20 + paddedLength + suffix.byteLength;
    if (totalLength > 0xffffffff) {
        throw new Error("The authored GLB exceeds the format's length limit.");
    }
    const result = new Uint8Array(totalLength);
    result.set(bytes.subarray(0, 20));
    const view = new DataView(result.buffer);
    view.setUint32(8, totalLength, true);
    view.setUint32(12, paddedLength, true);
    result.fill(0x20, 20, 20 + paddedLength);
    result.set(encoded, 20);
    result.set(suffix, 20 + paddedLength);
    return result;
}
