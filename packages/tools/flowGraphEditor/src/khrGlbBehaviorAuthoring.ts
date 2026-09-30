import { type Node } from "core/node";
import { applyEdits, modify } from "jsonc-parser";
import { BuildKhrSelectionRevealGraph } from "./khrSelectionRevealTemplate";
import { BuildKhrTwoStepProcedureGraph, type IKhrTwoStepProcedureNodes } from "./khrTwoStepProcedureTemplate";

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
    /** Buffers may refer to external files instead of the GLB BIN chunk. */
    buffers?: Array<{ uri?: string }>;
    /** Images may refer to external files instead of embedded data. */
    images?: Array<{ uri?: string }>;
    /** Root glTF extensions. */
    extensions?: Record<string, unknown>;
    /** Declared glTF extensions. */
    extensionsUsed?: string[];
    /** Required glTF extensions. */
    extensionsRequired?: string[];
    [key: string]: unknown;
}

/**
 * Lists resources that will still be required after a source-preserving GLB download.
 * @param document parsed source glTF document
 * @returns external buffer and image URIs in first-reference order
 */
export function GetGlbExternalResourceUris(document: IGlbDocument): string[] {
    const uris = new Set<string>();
    for (const resource of [...(Array.isArray(document.buffers) ? document.buffers : []), ...(Array.isArray(document.images) ? document.images : [])]) {
        if (typeof resource?.uri === "string" && !/^data:/i.test(resource.uri)) {
            uris.add(resource.uri);
        }
    }
    return [...uris];
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
 * Parse a split glTF source without normalizing any JSON tokens.
 * @param jsonText source glTF JSON
 * @returns parsed document
 */
export function ReadGltfDocument(jsonText: string): IGlbDocument {
    let document: IGlbDocument;
    try {
        document = JSON.parse(jsonText) as IGlbDocument;
    } catch {
        throw new Error("The glTF JSON is invalid.");
    }
    if (!document || typeof document !== "object" || Array.isArray(document) || document.asset?.version !== "2.0") {
        throw new Error("The file must contain a glTF 2.0 document.");
    }
    return document;
}

function _WriteGlb(bytes: Uint8Array, jsonText: string, suffixOffset: number): Uint8Array {
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

/**
 * Reads the source glTF document without loading or serializing its scene.
 * @param bytes original GLB bytes
 * @returns parsed glTF document
 */
export function ReadGlbDocument(bytes: Uint8Array): IGlbDocument {
    return _ReadGlb(bytes).document;
}

/**
 * Patch a named editor metadata field while retaining scene JSON tokens and all GLB chunks.
 * @param bytes source GLB bytes
 * @param key editor-owned metadata key
 * @param value replacement metadata
 * @returns patched GLB bytes
 */
export function PatchGlbExtras(bytes: Uint8Array, key: string, value: unknown): Uint8Array {
    const { document, jsonText, suffixOffset } = _ReadGlb(bytes);
    return _WriteGlb(bytes, _PatchExtras(document, jsonText, key, value), suffixOffset);
}

/**
 * Patch a named editor metadata field while retaining scene JSON tokens and resource URIs.
 * @param jsonText source glTF JSON
 * @param key editor-owned metadata key
 * @param value replacement metadata
 * @returns patched glTF JSON
 */
export function PatchGltfExtras(jsonText: string, key: string, value: unknown): string {
    return _PatchExtras(ReadGltfDocument(jsonText), jsonText, key, value);
}

function _PatchExtras(document: IGlbDocument, jsonText: string, key: string, value: unknown): string {
    if (document.extras !== undefined && !_IsRecord(document.extras)) {
        throw new Error("The source has non-object extras; contact audio cannot be added without replacing that metadata.");
    }
    return applyEdits(jsonText, modify(jsonText, ["extras", key], value, {}));
}

/**
 * Replaces an edited KHR_interactivity graph in its source GLB without reserializing the scene.
 * The extension must first pass export-plan validation against source indices.
 * @param bytes source GLB bytes
 * @param extension edited canonical KHR_interactivity extension
 * @param extensionsUsed other extensions referenced by the graph
 * @param extensionsRequired other extensions required by the graph
 * @returns GLB retaining unrelated source JSON tokens and chunks
 */
export function PatchKhrInteractivityGlb(bytes: Uint8Array, extension: unknown, extensionsUsed: readonly string[], extensionsRequired: readonly string[]): Uint8Array {
    const { document, jsonText: sourceJsonText, suffixOffset } = _ReadGlb(bytes);
    return _WriteGlb(bytes, _PatchKhrInteractivityJson(document, sourceJsonText, extension, extensionsUsed, extensionsRequired), suffixOffset);
}

/**
 * Patch the graph in a split glTF document while retaining unrelated JSON tokens.
 * @param jsonText source glTF JSON
 * @param extension edited interactivity extension
 * @param extensionsUsed other extensions referenced by the graph
 * @param extensionsRequired other extensions required by the graph
 * @returns patched glTF JSON
 */
export function PatchKhrInteractivityGltf(jsonText: string, extension: unknown, extensionsUsed: readonly string[], extensionsRequired: readonly string[]): string {
    return _PatchKhrInteractivityJson(ReadGltfDocument(jsonText), jsonText, extension, extensionsUsed, extensionsRequired);
}

function _PatchKhrInteractivityJson(
    document: IGlbDocument,
    sourceJsonText: string,
    extension: unknown,
    extensionsUsed: readonly string[],
    extensionsRequired: readonly string[]
): string {
    if (!_IsRecord(document.extensions) || !_IsRecord(document.extensions.KHR_interactivity)) {
        throw new Error("The source glTF asset has no KHR_interactivity graph to update.");
    }
    if (!_IsRecord(extension) || !Array.isArray(extension.graphs)) {
        throw new Error("The edited KHR_interactivity extension is malformed.");
    }
    if (
        (document.extensionsUsed !== undefined && (!Array.isArray(document.extensionsUsed) || document.extensionsUsed.some((name) => typeof name !== "string"))) ||
        (document.extensionsRequired !== undefined && (!Array.isArray(document.extensionsRequired) || document.extensionsRequired.some((name) => typeof name !== "string")))
    ) {
        throw new Error("The source glTF asset has malformed extension declarations.");
    }
    let jsonText = sourceJsonText;
    const write = (path: Array<string | number>, value: unknown, isArrayInsertion = false) => {
        jsonText = applyEdits(jsonText, modify(jsonText, path, value, { isArrayInsertion }));
    };
    write(["extensions", "KHR_interactivity"], extension);
    for (const [key, names] of [
        ["extensionsUsed", ["KHR_interactivity", ...extensionsUsed]],
        ["extensionsRequired", extensionsRequired],
    ] as const) {
        const declared = document[key] ?? [];
        for (const name of names) {
            if (!declared.includes(name)) {
                write(document[key] ? [key, declared.length] : [key], document[key] ? name : [name], !!document[key]);
                declared.push(name);
                document[key] = declared;
            }
        }
    }
    return jsonText;
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

function _ValidateKhrSelectionRevealDocument(document: IGlbDocument, triggerIndex: number, revealIndex: number): void {
    if (document.animations !== undefined && (!Array.isArray(document.animations) || document.animations.length > 0)) {
        throw new Error("Adding a behavior graph would stop the source asset's animations from playing automatically; animated assets need explicit animation behavior.");
    }
    const nodes = document.nodes;
    if (!Array.isArray(nodes)) {
        throw new Error("The source glTF asset has no nodes.");
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
        throw new Error("The source glTF asset has malformed nodes or extension declarations.");
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
        throw new Error("The source glTF asset already has a behavior graph.");
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
}

function _WriteBehaviorJson(document: IGlbDocument, sourceJsonText: string, graph: unknown, selectableNodes: number[], hiddenNodes: number[]): string {
    // Only behavior-owned paths are edited. Serializing the parsed document would round large
    // numeric extras and rewrite unrelated source tokens.
    let jsonText = sourceJsonText;
    const write = (path: Array<string | number>, value: unknown, isArrayInsertion = false) => {
        jsonText = applyEdits(jsonText, modify(jsonText, path, value, { isArrayInsertion }));
    };
    write(["extensions", "KHR_interactivity"], graph);
    for (const index of selectableNodes) {
        if (document.nodes![index].extensions?.KHR_node_selectability === undefined) {
            write(["nodes", index, "extensions", "KHR_node_selectability"], { selectable: true });
        }
    }
    for (const index of hiddenNodes) {
        const visibility = document.nodes![index].extensions?.KHR_node_visibility;
        if (visibility === undefined) {
            write(["nodes", index, "extensions", "KHR_node_visibility"], { visible: false });
        } else if (_IsRecord(visibility) && visibility.visible !== false) {
            write(["nodes", index, "extensions", "KHR_node_visibility", "visible"], false);
        }
    }
    for (const key of ["extensionsUsed", "extensionsRequired"] as const) {
        const original = document[key];
        const names = original?.slice() ?? [];
        for (const name of ["KHR_interactivity", "KHR_node_selectability", "KHR_node_visibility"]) {
            if (!names.includes(name)) {
                if (original) {
                    write([key, names.length], name, true);
                }
                names.push(name);
            }
        }
        if (!original) {
            write([key], names);
        }
    }
    return jsonText;
}

/**
 * Adds only the behavior extension fields; the BIN and subsequent chunks stay byte-identical.
 * @param bytes original GLB bytes
 * @param triggerIndex source glTF trigger node index
 * @param revealIndex source glTF reveal node index
 * @returns the authored GLB bytes
 */
export function PatchKhrSelectionRevealGlb(bytes: Uint8Array, triggerIndex: number, revealIndex: number): Uint8Array {
    const { document, jsonText, suffixOffset } = _ReadGlb(bytes);
    _ValidateKhrSelectionRevealDocument(document, triggerIndex, revealIndex);
    return _WriteGlb(bytes, _WriteBehaviorJson(document, jsonText, BuildKhrSelectionRevealGraph(triggerIndex, revealIndex), [triggerIndex], [revealIndex]), suffixOffset);
}

/**
 * Add a selection behavior to split glTF, retaining unrelated JSON and resource URIs.
 * @param jsonText source glTF JSON
 * @param triggerIndex source glTF node index of the trigger
 * @param revealIndex source glTF node index of the reveal target
 * @returns patched glTF JSON
 */
export function PatchKhrSelectionRevealGltf(jsonText: string, triggerIndex: number, revealIndex: number): string {
    const document = ReadGltfDocument(jsonText);
    _ValidateKhrSelectionRevealDocument(document, triggerIndex, revealIndex);
    return _WriteBehaviorJson(document, jsonText, BuildKhrSelectionRevealGraph(triggerIndex, revealIndex), [triggerIndex], [revealIndex]);
}

/**
 * Adds an ordered procedure to a source GLB without serializing its scene.
 * @param bytes original GLB bytes
 * @param indices stable source glTF node indices for the procedure roles
 * @returns the authored GLB bytes
 */
export function PatchKhrTwoStepProcedureGlb(bytes: Uint8Array, indices: IKhrTwoStepProcedureNodes<number>): Uint8Array {
    const { document, jsonText, suffixOffset } = _ReadGlb(bytes);
    return _WriteGlb(bytes, _PatchKhrTwoStepProcedureJson(document, jsonText, indices), suffixOffset);
}

/**
 * Add a two-step procedure to split glTF, retaining unrelated JSON and resource URIs.
 * @param jsonText source glTF JSON
 * @param indices source glTF node indices for procedure roles
 * @returns patched glTF JSON
 */
export function PatchKhrTwoStepProcedureGltf(jsonText: string, indices: IKhrTwoStepProcedureNodes<number>): string {
    return _PatchKhrTwoStepProcedureJson(ReadGltfDocument(jsonText), jsonText, indices);
}

function _PatchKhrTwoStepProcedureJson(document: IGlbDocument, jsonText: string, indices: IKhrTwoStepProcedureNodes<number>): string {
    const nodes = document.nodes;
    if (!Array.isArray(nodes)) {
        throw new Error("The source glTF asset has no nodes.");
    }
    const roleIndices = [indices.first, indices.second, indices.nextCue, indices.completionCue, indices.reset];
    if (roleIndices.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= nodes.length)) {
        throw new Error("A procedure glTF node index is outside the source document.");
    }
    if (new Set(roleIndices).size !== roleIndices.length) {
        throw new Error("Choose five different glTF nodes for the procedure.");
    }
    const parents = Array.from({ length: nodes.length }, () => new Array<number>());
    for (const [index, node] of nodes.entries()) {
        if (!node || typeof node !== "object" || Array.isArray(node) || (node.children !== undefined && !Array.isArray(node.children))) {
            throw new Error("The source glTF asset has malformed node hierarchy.");
        }
        for (const child of node.children ?? []) {
            if (!Number.isInteger(child) || child < 0 || child >= nodes.length) {
                throw new Error("The source glTF asset has malformed node hierarchy.");
            }
            parents[child].push(index);
        }
    }
    const reaches = (start: number, target: number): boolean => {
        const pending = [start];
        const visited = new Set<number>();
        while (pending.length > 0) {
            const index = pending.pop()!;
            if (index === target) {
                return true;
            }
            if (visited.has(index)) {
                continue;
            }
            visited.add(index);
            pending.push(...(nodes[index].children ?? []));
        }
        return false;
    };
    for (let i = 0; i < roleIndices.length; i++) {
        for (let j = i + 1; j < roleIndices.length; j++) {
            if (reaches(roleIndices[i], roleIndices[j]) || reaches(roleIndices[j], roleIndices[i])) {
                throw new Error("Procedure glTF nodes cannot be an ancestor or descendant of each other.");
            }
        }
    }
    for (const control of [indices.first, indices.second, indices.reset]) {
        const pending = [control];
        const visited = new Set<number>();
        while (pending.length > 0) {
            const index = pending.pop()!;
            if (visited.has(index)) {
                continue;
            }
            visited.add(index);
            const selectability = nodes[index].extensions?.KHR_node_selectability;
            if (selectability !== undefined && (!_IsRecord(selectability) || (selectability.selectable !== undefined && selectability.selectable !== true))) {
                throw new Error("A procedure control or ancestor disables selectability.");
            }
            const visibility = nodes[index].extensions?.KHR_node_visibility;
            if (visibility !== undefined && (!_IsRecord(visibility) || (visibility.visible !== undefined && visibility.visible !== true))) {
                throw new Error("A procedure control or ancestor disables visibility.");
            }
            pending.push(...parents[index]);
        }
    }
    for (const cue of [indices.nextCue, indices.completionCue]) {
        const visibility = nodes[cue].extensions?.KHR_node_visibility;
        if (visibility !== undefined && (!_IsRecord(visibility) || (visibility.visible !== undefined && typeof visibility.visible !== "boolean"))) {
            throw new Error("A procedure cue has malformed visibility.");
        }
        const pending = [...parents[cue]];
        const visited = new Set<number>();
        while (pending.length > 0) {
            const index = pending.pop()!;
            if (visited.has(index)) {
                continue;
            }
            visited.add(index);
            const ancestorVisibility = nodes[index].extensions?.KHR_node_visibility;
            if (ancestorVisibility !== undefined && (!_IsRecord(ancestorVisibility) || (ancestorVisibility.visible !== undefined && ancestorVisibility.visible !== true))) {
                throw new Error("A procedure cue ancestor disables visibility.");
            }
            pending.push(...parents[index]);
        }
    }

    // Reuse the selection template's graph and animation guards before writing procedure fields.
    _ValidateKhrSelectionRevealDocument(document, indices.first, indices.completionCue);
    return _WriteBehaviorJson(document, jsonText, BuildKhrTwoStepProcedureGraph(indices), [indices.first, indices.second, indices.reset], [indices.nextCue, indices.completionCue]);
}

/** An event in the selected KHR graph to which the guided editor can append an action. */
export interface IKhrReactionEvent {
    /** Source interactivity node index within the selected graph. */
    nodeIndex: number;
    /** Label including the stable glTF node index when the event refers to a scene node. */
    label: string;
}

const _ReactionEventOperations = new Set(["event/onSelect", "event/onHoverIn", "event/onHoverOut", "event/onStart", "event/receive"]);

function _SelectedKhrGraph(document: IGlbDocument): { extension: Record<string, unknown>; graph: Record<string, unknown>; graphIndex: number } {
    const extension = document.extensions?.KHR_interactivity;
    if (!_IsRecord(extension) || !Array.isArray(extension.graphs) || extension.graphs.length === 0) {
        throw new Error("The source asset has no KHR_interactivity graph to extend.");
    }
    const graphIndex = extension.graph ?? 0;
    if (
        !Number.isSafeInteger(graphIndex) ||
        (graphIndex as number) < 0 ||
        (graphIndex as number) >= extension.graphs.length ||
        !_IsRecord(extension.graphs[graphIndex as number])
    ) {
        throw new Error("The source asset has no valid selected KHR_interactivity graph.");
    }
    return { extension, graph: extension.graphs[graphIndex as number] as Record<string, unknown>, graphIndex: graphIndex as number };
}

/**
 * List supported event entries in the selected graph, leaving alternate graphs untouched.
 * @param document parsed source glTF document
 * @returns events that can receive a guided reaction
 */
export function ListKhrReactionEvents(document: IGlbDocument): IKhrReactionEvent[] {
    const { graph } = _SelectedKhrGraph(document);
    const declarations = graph.declarations;
    const nodes = graph.nodes;
    if (!Array.isArray(declarations) || !Array.isArray(nodes)) {
        return [];
    }
    return nodes.flatMap((node: unknown, nodeIndex: number) => {
        if (!_IsRecord(node) || !Number.isSafeInteger(node.declaration) || !_IsRecord(declarations[node.declaration as number])) {
            return [];
        }
        const operation = declarations[node.declaration as number].op;
        if (typeof operation !== "string" || !_ReactionEventOperations.has(operation) || (node.flows !== undefined && !_IsRecord(node.flows))) {
            return [];
        }
        const selectedNode = _IsRecord(node.configuration) && _IsRecord(node.configuration.nodeIndex) ? node.configuration.nodeIndex.value : undefined;
        const targetIndex = Array.isArray(selectedNode) && Number.isSafeInteger(selectedNode[0]) ? (selectedNode[0] as number) : undefined;
        const target = targetIndex !== undefined ? ` · glTF node ${targetIndex} (${String(document.nodes?.[targetIndex]?.name || "unnamed")})` : "";
        const eventName = operation === "event/receive" ? "Custom event" : operation.replace("event/", "");
        return [{ nodeIndex, label: `${eventName}${target} · graph node ${nodeIndex}` }];
    });
}

function _PatchKhrVisibilityReactionJson(jsonText: string, eventNodeIndex: number, targetIndex: number, visible: boolean): string {
    const document = ReadGltfDocument(jsonText);
    if (!Array.isArray(document.nodes) || !Number.isSafeInteger(targetIndex) || targetIndex < 0 || targetIndex >= document.nodes.length) {
        throw new Error("The reaction target glTF node index is outside the source document.");
    }
    if (typeof visible !== "boolean") {
        throw new Error("The reaction visibility value must be boolean.");
    }
    const target = document.nodes[targetIndex];
    if (!_IsRecord(target) || (target.extensions !== undefined && !_IsRecord(target.extensions))) {
        throw new Error("The reaction target has malformed extensions.");
    }
    const visibility = target.extensions?.KHR_node_visibility;
    if (visibility !== undefined && (!_IsRecord(visibility) || (visibility.visible !== undefined && typeof visibility.visible !== "boolean"))) {
        throw new Error("The reaction target has malformed visibility.");
    }
    const ancestors = new Set<number>();
    if (visible) {
        // A local visible=true cannot override a hidden parent. Avoid a seemingly successful but inert action.
        const parents = new Map<number, number[]>();
        for (const [parentIndex, node] of document.nodes.entries()) {
            for (const child of Array.isArray(node.children) ? node.children : []) {
                parents.set(child, [...(parents.get(child) ?? []), parentIndex]);
            }
        }
        const pending = [...(parents.get(targetIndex) ?? [])];
        while (pending.length) {
            const index = pending.pop()!;
            if (ancestors.has(index)) {
                continue;
            }
            ancestors.add(index);
            const ancestorVisibility = document.nodes[index]?.extensions?.KHR_node_visibility;
            if (ancestorVisibility !== undefined && (!_IsRecord(ancestorVisibility) || (ancestorVisibility.visible !== undefined && ancestorVisibility.visible !== true))) {
                throw new Error("A reaction target ancestor disables visibility.");
            }
            pending.push(...(parents.get(index) ?? []));
        }
    }
    const { graph, graphIndex } = _SelectedKhrGraph(document);
    const events = ListKhrReactionEvents(document);
    if (!events.some((event) => event.nodeIndex === eventNodeIndex)) {
        throw new Error("Choose a supported event in the selected graph.");
    }
    const graphNodes = graph.nodes as Array<Record<string, unknown>>;
    const declarations = graph.declarations as Array<Record<string, unknown>>;
    if (visible && ancestors.size) {
        // Other events and deferred branches can leave a parent hidden too. The guided
        // action cannot prove their runtime ordering, so reject potential ancestor hides.
        for (const node of graphNodes) {
            if (declarations[node.declaration as number]?.op !== "pointer/set") {
                continue;
            }
            const configuration = node.configuration as Record<string, { value?: unknown[] }> | undefined;
            const values = node.values as Record<string, { node?: number; value?: unknown[] }> | undefined;
            const pointer = configuration?.pointer?.value?.[0];
            const match = typeof pointer === "string" ? /^\/nodes\/([^/]+)\/extensions\/KHR_node_visibility\/visible$/.exec(pointer) : null;
            if (!match || (values?.value?.node === undefined && values?.value?.value?.[0] === true)) {
                continue;
            }
            const segment = match[1];
            const parameter = /^(?:\[([^\]]+)\]|\{([^}]+)\})$/.exec(segment);
            const binding = parameter ? values?.[parameter[1] ?? parameter[2]] : undefined;
            const index = parameter ? (binding?.node === undefined ? binding?.value?.[0] : undefined) : /^\d+$/.test(segment) ? Number(segment) : undefined;
            if (index === undefined || (typeof index === "number" && ancestors.has(index))) {
                throw new Error("Existing behavior may hide a reaction target ancestor. Edit the ancestor visibility in the graph before adding a show reaction.");
            }
        }
    }
    const event = graphNodes[eventNodeIndex];
    const flows = _IsRecord(event.flows) ? event.flows : {};
    if (flows.out !== undefined && (!_IsRecord(flows.out) || !Number.isSafeInteger(flows.out.node) || (flows.out.socket !== undefined && typeof flows.out.socket !== "string"))) {
        throw new Error("The event's existing output flow is malformed.");
    }
    const previousFlow = flows.out;
    const typeIndex = Array.isArray(graph.types) ? graph.types.findIndex((type: unknown) => _IsRecord(type) && type.signature === "bool") : -1;
    const boolTypeIndex = typeIndex < 0 ? (Array.isArray(graph.types) ? graph.types.length : 0) : typeIndex;
    const existingPointerDeclaration = declarations.findIndex((declaration) => declaration.op === "pointer/set" && Object.keys(declaration).length === 1);
    const pointerDeclarationIndex = existingPointerDeclaration >= 0 ? existingPointerDeclaration : declarations.length;
    const existingSequenceDeclaration = declarations.findIndex((declaration) => declaration.op === "flow/sequence" && Object.keys(declaration).length === 1);
    const sequenceDeclarationIndex = existingSequenceDeclaration >= 0 ? existingSequenceDeclaration : declarations.length + (existingPointerDeclaration >= 0 ? 0 : 1);
    const pointerNodeIndex = graphNodes.length + (previousFlow ? 1 : 0);
    const sequenceNodeIndex = eventNodeIndex + 1;
    const pointerNode = {
        declaration: pointerDeclarationIndex,
        configuration: { pointer: { value: [`/nodes/${targetIndex}/extensions/KHR_node_visibility/visible`] }, type: { value: [boolTypeIndex] } },
        values: { value: { type: boolTypeIndex, value: [visible] } },
    };
    let edited = jsonText;
    const write = (path: Array<string | number>, value: unknown, isArrayInsertion = false) => {
        edited = applyEdits(edited, modify(edited, path, value, { isArrayInsertion }));
    };
    const base = ["extensions", "KHR_interactivity", "graphs", graphIndex];
    if (previousFlow) {
        // KHR_interactivity requires every node connection to point forward. Inserting immediately
        // after the event preserves that invariant and keeps the original branch before the new one.
        for (const [index, node] of graphNodes.entries()) {
            for (const key of ["flows", "values"] as const) {
                const sockets = node[key];
                if (!_IsRecord(sockets)) {
                    continue;
                }
                for (const [socket, connection] of Object.entries(sockets)) {
                    if (_IsRecord(connection) && Number.isSafeInteger(connection.node) && (connection.node as number) >= sequenceNodeIndex) {
                        write([...base, "nodes", index, key, socket, "node"], (connection.node as number) + 1);
                    }
                }
            }
        }
    }
    if (typeIndex < 0) {
        write([...base, "types", boolTypeIndex], { signature: "bool" }, true);
    }
    if (existingPointerDeclaration < 0) {
        write([...base, "declarations", pointerDeclarationIndex], { op: "pointer/set" }, true);
    }
    if (previousFlow) {
        if (existingSequenceDeclaration < 0) {
            write([...base, "declarations", sequenceDeclarationIndex], { op: "flow/sequence" }, true);
        }
        const prior = previousFlow as { node: number; socket?: string };
        write(
            [...base, "nodes", sequenceNodeIndex],
            {
                declaration: sequenceDeclarationIndex,
                flows: { ["0"]: { ...prior, node: prior.node >= sequenceNodeIndex ? prior.node + 1 : prior.node }, ["1"]: { node: pointerNodeIndex, socket: "in" } },
            },
            true
        );
    }
    write([...base, "nodes", pointerNodeIndex], pointerNode, true);
    write([...base, "nodes", eventNodeIndex, "flows", "out"], { node: previousFlow ? sequenceNodeIndex : pointerNodeIndex, socket: "in" });
    if (visibility === undefined) {
        write(["nodes", targetIndex, "extensions", "KHR_node_visibility"], { visible: true });
    }
    for (const key of ["extensionsUsed", "extensionsRequired"] as const) {
        const names = document[key];
        if (names !== undefined && (!Array.isArray(names) || names.some((name) => typeof name !== "string"))) {
            throw new Error("The source asset has malformed extension declarations.");
        }
        if (!names?.includes("KHR_node_visibility")) {
            write(names ? [key, names.length] : [key], names ? "KHR_node_visibility" : ["KHR_node_visibility"], !!names);
        }
    }
    const authored = ReadGltfDocument(edited);
    const authoredGraph = _SelectedKhrGraph(authored).graph;
    const authoredNodes = authoredGraph.nodes as Array<Record<string, unknown>>;
    for (const [index, node] of authoredNodes.entries()) {
        for (const key of ["flows", "values"] as const) {
            const sockets = node[key];
            if (!_IsRecord(sockets)) {
                continue;
            }
            for (const connection of Object.values(sockets)) {
                if (
                    _IsRecord(connection) &&
                    connection.node !== undefined &&
                    (!Number.isSafeInteger(connection.node) ||
                        (connection.node as number) < 0 ||
                        (connection.node as number) >= authoredNodes.length ||
                        (key === "flows" ? (connection.node as number) <= index : (connection.node as number) >= index))
                ) {
                    throw new Error("The extended graph contains an invalid flow or value node connection.");
                }
            }
        }
    }
    return edited;
}

/**
 * Append a visibility action to an existing event in a source GLB.
 * @param bytes source GLB bytes
 * @param eventNodeIndex graph node index of the event
 * @param targetIndex source glTF node index of the target
 * @param visible visibility value to assign
 * @returns patched GLB bytes
 */
export function PatchKhrVisibilityReactionGlb(bytes: Uint8Array, eventNodeIndex: number, targetIndex: number, visible: boolean): Uint8Array {
    const { jsonText, suffixOffset } = _ReadGlb(bytes);
    return _WriteGlb(bytes, _PatchKhrVisibilityReactionJson(jsonText, eventNodeIndex, targetIndex, visible), suffixOffset);
}

/**
 * Append a visibility action to an existing event in split glTF.
 * @param jsonText source glTF JSON
 * @param eventNodeIndex graph node index of the event
 * @param targetIndex source glTF node index of the target
 * @param visible visibility value to assign
 * @returns patched glTF JSON
 */
export function PatchKhrVisibilityReactionGltf(jsonText: string, eventNodeIndex: number, targetIndex: number, visible: boolean): string {
    return _PatchKhrVisibilityReactionJson(jsonText, eventNodeIndex, targetIndex, visible);
}
