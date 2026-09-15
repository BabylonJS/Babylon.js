/* eslint-disable @typescript-eslint/naming-convention */
import {
    type IKHRInteractivity,
    type IKHRInteractivity_Configuration,
    type IKHRInteractivity_Graph,
    type IKHRInteractivity_Node,
    type IKHRInteractivity_OutputSocketReference,
    type IKHRInteractivity_Variable,
} from "babylonjs-gltf2interface";
import { type AnimationGroup } from "core/Animations/animationGroup";
import { type FlowGraph } from "core/FlowGraph/flowGraph";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { type FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection.pure";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes.pure";
import { type Material } from "core/Materials/material";
import { type Node } from "core/node";
import { type Camera } from "core/Cameras/camera";
import { type IGLTF } from "../../glTFLoaderInterfaces";
import {
    GetInteractivityOperationRegistry,
    getMappingForDeclaration,
    HasDefaultInteractivityFlowInput,
    NormalizeInteractivityEventDataConfiguration,
    ParseDebugLogTemplate,
    type IGLTFToFlowGraphMapping,
    type IGLTFToFlowGraphMappingObject,
} from "./declarationMapper";
import {
    CloneKHRInteractivityGraph,
    CreateKHRInteractivityGraphModel,
    gltfTypeToBabylonType,
    type IKHRInteractivityBlockProvenance,
    type IKHRInteractivityConfigurationProvenance,
    type IKHRInteractivityDocument,
    type IKHRInteractivityGraphProvenance,
    type IKHRInteractivitySocketProvenance,
} from "./interactivityGraphModel";

/**
 * Export support classification for a FlowGraph block or imported composite.
 */
export type KHRInteractivityExportClassification = "exact" | "inverse-composite" | "unsupported" | "lossy";

/**
 * Structured KHR_interactivity export diagnostic.
 */
export interface IKHRInteractivityExportDiagnostic {
    /** Stable diagnostic code. */
    code:
        | "GRAPH_SOURCE_MISSING"
        | "GRAPH_COUNT_MISMATCH"
        | "NODE_SOURCE_MISSING"
        | "BLOCK_PROVENANCE_INVALID"
        | "BLOCK_ROLE_MISSING"
        | "BLOCK_ROLE_DUPLICATE"
        | "BLOCK_TYPE_MISMATCH"
        | "BLOCK_UNSUPPORTED"
        | "BLOCK_AMBIGUOUS"
        | "COMPOSITE_CONNECTION_CHANGED"
        | "SOCKET_PROVENANCE_MISSING"
        | "SOCKET_CONNECTION_AMBIGUOUS"
        | "SOCKET_TARGET_UNREPRESENTABLE"
        | "VALUE_UNREPRESENTABLE"
        | "CONFIGURATION_UNREPRESENTABLE"
        | "REFERENCE_UNRESOLVED"
        | "DEPENDENCY_CYCLE"
        | "GRAPH_INVALID";
    /** JSON pointer or FlowGraph location associated with the issue. */
    path: string;
    /** Human-readable actionable diagnostic. */
    message: string;
    /** Diagnostic severity. */
    severity: "error" | "warning";
    /** Source graph index, when known. */
    graphIndex?: number;
    /** Source node index, when known. */
    nodeIndex?: number;
    /** FlowGraph block id, when known. */
    blockId?: string;
    /** KHR socket id, when known. */
    socket?: string;
}

/**
 * Representability result for one logical KHR node or standalone FlowGraph block.
 */
export interface IKHRInteractivityNodeExportAnalysis {
    /** Source graph index. */
    graphIndex: number;
    /** Source KHR node index, when this is an imported node. */
    nodeIndex?: number;
    /** Full KHR operation name, when known. */
    operation?: string;
    /** FlowGraph blocks participating in this logical node. */
    blockIds: string[];
    /** Export support classification. */
    classification: KHRInteractivityExportClassification;
    /** Diagnostics scoped to this logical node. */
    diagnostics: IKHRInteractivityExportDiagnostic[];
}

/**
 * Complete representability analysis for a KHR_interactivity export.
 */
export interface IKHRInteractivityExportAnalysis {
    /** True when every graph can be exported without loss or ambiguity. */
    representable: boolean;
    /** Per-node classifications in deterministic graph/source order. */
    nodes: IKHRInteractivityNodeExportAnalysis[];
    /** All diagnostics in deterministic order. */
    diagnostics: IKHRInteractivityExportDiagnostic[];
}

/**
 * Indexed glTF root collections that KHR_interactivity references can target.
 */
export type KhrInteractivityRootCollection = "nodes" | "animations" | "cameras" | "materials" | "meshes" | "textures" | "images" | "samplers" | "skins" | "scenes";

/**
 * Final glTF remapping context supplied by the serializer extension.
 */
export interface IKHRInteractivitySerializerContext {
    /**
     * Gets the final number of glTF nodes.
     * @returns final glTF node count
     */
    getNodeCount(): number;
    /**
     * Gets the final glTF node index for a Babylon node.
     * @param node Babylon node to resolve
     * @returns final glTF node index, or undefined when the node was not exported
     */
    getNodeIndex(node: Node): number | undefined;
    /**
     * Gets the final glTF animation index for a Babylon animation group.
     * @param animation Babylon animation group to resolve
     * @returns final glTF animation index, or undefined when the animation was not exported
     */
    getAnimationIndex(animation: AnimationGroup): number | undefined;
    /**
     * Gets the final glTF camera index for a Babylon camera.
     * @param camera Babylon camera to resolve
     * @returns final glTF camera index, or undefined when the camera was not exported
     */
    getCameraIndex(camera: Camera): number | undefined;
    /**
     * Gets the final glTF material index for a Babylon material.
     * @param material Babylon material to resolve
     * @returns final glTF material index, or undefined when the material was not exported
     */
    getMaterialIndex(material: Material): number | undefined;
    /**
     * Gets the final glTF index for an imported Babylon entity in a root collection.
     * @param collection target glTF root collection
     * @param entity imported Babylon entity associated with the source entry
     * @returns final glTF index, or undefined when the entity was not exported uniquely
     */
    getRootIndex?(collection: KhrInteractivityRootCollection, entity: object): number | undefined;
    /**
     * Writes a companion extension on an already-exported glTF node.
     * @param nodeIndex final glTF node index
     * @param extensionName companion extension name
     * @param value companion extension payload
     */
    setNodeExtension(nodeIndex: number, extensionName: string, value: unknown): void;
}

/**
 * Provider consumed by the KHR_interactivity serializer extension.
 */
export interface IKHRInteractivityExportProvider {
    /** Whether KHR_interactivity must be listed in extensionsRequired. */
    readonly required: boolean;
    /** Other extensions referenced or emitted by the interactivity export. */
    readonly additionalExtensionsUsed: readonly string[];
    /** Other extensions that must be listed in extensionsRequired. */
    readonly additionalExtensionsRequired: readonly string[];
    /**
     * Gets the detached representability analysis.
     * @returns current export analysis
     */
    analyze(): IKHRInteractivityExportAnalysis;
    /**
     * Builds the canonical extension after glTF entity indices are finalized.
     * @param context final serializer remapping context
     * @returns ratified KHR_interactivity extension payload
     */
    build(context: IKHRInteractivitySerializerContext): IKHRInteractivity;
}

/**
 * Options used to create a KHR_interactivity export plan.
 */
export interface IKHRInteractivityExportOptions {
    /** Canonical Phase 1 document associated with the FlowGraphs. Required for a lossless export. */
    document?: IKHRInteractivityDocument;
    /** Loader glTF tree used to resolve original entity references. */
    sourceGLTF?: IGLTF;
    /** Root default graph index. Defaults to the canonical document selection or zero. */
    defaultGraphIndex?: number;
    /** Target animation frame rate used by imported animation composites. Defaults to 60. */
    targetFps?: number;
    /** Whether the emitted KHR_interactivity extension is required. Defaults to true. */
    required?: boolean;
    /** Additional extensions that must be required together with the behavior graph. */
    additionalExtensionsRequired?: readonly string[];
}

/**
 * Error thrown when export cannot preserve the authored behavior graph.
 */
export class KHRInteractivityExportError extends Error {
    /**
     * @param diagnostics precise export diagnostics
     */
    public constructor(public readonly diagnostics: readonly IKHRInteractivityExportDiagnostic[]) {
        super(diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`).join("\n"));
        this.name = "KHRInteractivityExportError";
    }
}

interface ILogicalNode {
    sourceIndex: number;
    declarationIndex: number;
    operation: string;
    mapping?: IGLTFToFlowGraphMapping;
    blocks: readonly FlowGraphBlock[];
    classification: KHRInteractivityExportClassification;
    diagnostics: IKHRInteractivityExportDiagnostic[];
}

interface IGraphAnalysis {
    graph: FlowGraph;
    graphIndex: number;
    source: IKHRInteractivity_Graph;
    nodes: ILogicalNode[];
    diagnostics: IKHRInteractivityExportDiagnostic[];
}

interface IOrderedNodes {
    nodes: IKHRInteractivity_Node[];
    sourceIndices: number[];
}

const _KnownIndexedRootCollections = new Set<string>(["nodes", "animations", "cameras", "materials", "meshes", "textures", "images", "samplers", "skins", "scenes"]);
const _UnsupportedBlockClassName = "FlowGraphUnsupportedInteractivityBlock";
const _CompanionNodeExtensions = ["KHR_node_hoverability", "KHR_node_selectability", "KHR_node_visibility"] as const;

function _GetPointerExtensionNames(pointer: string): string[] {
    const segments = pointer.split("/").map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
    const extensions: string[] = [];
    for (let index = 0; index < segments.length - 1; index++) {
        if (segments[index] === "extensions" && segments[index + 1]) {
            extensions.push(segments[index + 1]);
        }
    }
    return extensions;
}

function _CanPreserveNestedExtensionPointer(pointer: string, resolvedCollection?: string): boolean {
    const segments = pointer.split("/").map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
    const extensionIndex = segments.indexOf("extensions");
    return (
        extensionIndex > 1 &&
        (resolvedCollection ?? segments[1]) === "nodes" &&
        _CompanionNodeExtensions.includes(segments[extensionIndex + 1] as (typeof _CompanionNodeExtensions)[number])
    );
}
const _FlowGraphTypeToKHRSignature: Readonly<Record<string, string>> = {
    [FlowGraphTypes.Number]: "float",
    [FlowGraphTypes.Boolean]: "bool",
    [FlowGraphTypes.Integer]: "int",
    [FlowGraphTypes.String]: "ref",
    [FlowGraphTypes.Vector2]: "float2",
    [FlowGraphTypes.Vector3]: "float3",
    [FlowGraphTypes.Vector4]: "float4",
    [FlowGraphTypes.Quaternion]: "float4",
    [FlowGraphTypes.Color3]: "float3",
    [FlowGraphTypes.Color4]: "float4",
    [FlowGraphTypes.Matrix2D]: "float2x2",
    [FlowGraphTypes.Matrix3D]: "float3x3",
    [FlowGraphTypes.Matrix]: "float4x4",
    Mesh: "ref",
    TransformNode: "ref",
    Camera: "ref",
    Light: "ref",
    Material: "ref",
    AnimationGroup: "ref",
};

function _CloneJson<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((entry) => _CloneJson(entry)) as T;
    }
    if (value !== null && typeof value === "object") {
        const clone: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            Object.defineProperty(clone, key, {
                configurable: true,
                enumerable: true,
                value: _CloneJson(entry),
                writable: true,
            });
        }
        return clone as T;
    }
    return value;
}

function _GetBlockProvenance(block: FlowGraphBlock): IKHRInteractivityBlockProvenance | undefined {
    return block.metadata?.khrInteractivity as IKHRInteractivityBlockProvenance | undefined;
}

function _GetSocketProvenance(connection: FlowGraphDataConnection<any> | FlowGraphSignalConnection): IKHRInteractivitySocketProvenance | undefined {
    return connection.metadata?.khrInteractivity as IKHRInteractivitySocketProvenance | undefined;
}

function _GetOwn<T>(dictionary: Record<string, T> | undefined, key: string): T | undefined {
    return dictionary && Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : undefined;
}

function _FullOperationName(op: string, extension?: string): string {
    return extension ? `${op}:${extension}` : op;
}

function _RuntimeBlockClassName(className: string): string {
    return className.substring(className.lastIndexOf("/") + 1);
}

function _GetRoleBlock(blocks: readonly FlowGraphBlock[], role: number): FlowGraphBlock | undefined {
    return blocks.find((block) => _GetBlockProvenance(block)?.role === role);
}

function _FindDataInput(blocks: readonly FlowGraphBlock[], nodeIndex: number, socket: string): FlowGraphDataConnection<any> | undefined {
    for (const block of blocks) {
        for (const input of block.dataInputs) {
            const provenance = _GetSocketProvenance(input);
            if (provenance?.nodeIndex === nodeIndex && provenance.kind === "value" && provenance.direction === "input" && provenance.socket === socket) {
                return input;
            }
        }
    }
    return undefined;
}

function _NormalizeValue(value: unknown): unknown[] | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value !== null && typeof value === "object") {
        const asArray = (value as { asArray?: () => unknown[] }).asArray;
        if (typeof asArray === "function") {
            return asArray.call(value);
        }
        if ("value" in value && typeof (value as { value?: unknown }).value !== "object") {
            return [(value as { value: unknown }).value];
        }
    }
    return Array.isArray(value) ? value.slice() : [value];
}

function _ValuesEqual(left: readonly unknown[] | undefined, right: readonly unknown[] | undefined): boolean {
    if (!left || !right || left.length !== right.length) {
        return left === right;
    }
    for (let index = 0; index < left.length; index++) {
        if (typeof left[index] === "number" && typeof right[index] === "number" && Number.isNaN(left[index]) && Number.isNaN(right[index])) {
            continue;
        }
        if (left[index] !== right[index]) {
            return false;
        }
    }
    return true;
}

function _JsonEquivalent(left: unknown, right: unknown): boolean {
    if (typeof left === "number" && typeof right === "number" && Number.isNaN(left) && Number.isNaN(right)) {
        return true;
    }
    if (left === right) {
        return true;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((entry, index) => _JsonEquivalent(entry, right[index]));
    }
    if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
        const leftEntries = Object.entries(left);
        const rightKeys = Object.keys(right);
        return (
            leftEntries.length === rightKeys.length &&
            leftEntries.every(([key, value]) => Object.prototype.hasOwnProperty.call(right, key) && _JsonEquivalent(value, (right as Record<string, unknown>)[key]))
        );
    }
    return false;
}

function _GetTypeDefault(signature: string): unknown[] {
    switch (signature) {
        case "bool":
            return [false];
        case "int":
            return [0];
        case "ref":
            return [""];
        case "float":
            return [NaN];
        case "float2":
            return [NaN, NaN];
        case "float3":
            return [NaN, NaN, NaN];
        case "float4":
        case "float2x2":
            return [NaN, NaN, NaN, NaN];
        case "float3x3":
            return [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];
        case "float4x4":
            return [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];
        default:
            return [];
    }
}

function _GetOrAddInputTypeIndex(
    graph: IKHRInteractivity_Graph,
    input: FlowGraphDataConnection<any>,
    mapping: IGLTFToFlowGraphMappingObject | undefined,
    logicalNode: ILogicalNode,
    socket: string
): number | undefined {
    if (logicalNode.operation === "variable/set" && /^(0|[1-9]\d*)$/.test(socket)) {
        return graph.variables?.[parseInt(socket, 10)]?.type;
    }
    if (logicalNode.operation === "event/send") {
        const eventProperty = logicalNode.mapping?.configuration?.event;
        const eventIndex = eventProperty ? _GetMappedConfigurationValue(logicalNode, "event", eventProperty, graph)?.[0] : undefined;
        if (typeof eventIndex === "number") {
            return graph.events?.[eventIndex]?.values?.[socket]?.type;
        }
    }
    if (logicalNode.operation === "pointer/get" || logicalNode.operation === "pointer/set" || logicalNode.operation === "pointer/interpolate") {
        const pointerProperty = logicalNode.mapping?.configuration?.pointer;
        const pointer = pointerProperty ? _GetMappedConfigurationValue(logicalNode, "pointer", pointerProperty, graph)?.[0] : undefined;
        if (typeof pointer === "string") {
            const segment = pointer.split("/").find((entry) => entry === `[${socket}]` || entry === `{${socket}}`);
            const semanticSignature = segment?.startsWith("[") ? "int" : segment?.startsWith("{") ? "ref" : undefined;
            if (semanticSignature) {
                const existing = graph.types?.findIndex((type) => type.signature === semanticSignature) ?? -1;
                if (existing >= 0) {
                    return existing;
                }
                graph.types ??= [];
                graph.types.push({ signature: semanticSignature });
                return graph.types.length - 1;
            }
        }
    }
    const mappedType = mapping?.gltfType;
    const signature =
        mappedType === "number"
            ? "float"
            : mappedType === "boolean"
              ? "bool"
              : mappedType === "vector2"
                ? "float2"
                : mappedType === "vector3"
                  ? "float3"
                  : mappedType === "vector4"
                    ? "float4"
                    : mappedType && mappedType !== "any"
                      ? mappedType
                      : _FlowGraphTypeToKHRSignature[input.richType.typeName];
    if (!signature || !gltfTypeToBabylonType[signature]) {
        return undefined;
    }
    graph.types ??= [];
    const existing = graph.types.findIndex((type) => type.signature === signature);
    if (existing >= 0) {
        return existing;
    }
    graph.types.push({ signature: signature as NonNullable<IKHRInteractivity_Graph["types"]>[number]["signature"] });
    return graph.types.length - 1;
}

function _GetOrAddVariableTypeIndex(graph: IKHRInteractivity_Graph, flowGraphType: string): number | undefined {
    const signature = _FlowGraphTypeToKHRSignature[flowGraphType];
    if (!signature || !gltfTypeToBabylonType[signature]) {
        return undefined;
    }
    graph.types ??= [];
    const existing = graph.types.findIndex((type) => type.signature === signature);
    if (existing >= 0) {
        return existing;
    }
    graph.types.push({ signature: signature as NonNullable<IKHRInteractivity_Graph["types"]>[number]["signature"] });
    return graph.types.length - 1;
}

function _GetSourceValue(graph: IKHRInteractivity_Graph, value: IKHRInteractivity_Variable, mapping?: IGLTFToFlowGraphMappingObject, targetFps: number = 60): unknown[] {
    const signature = graph.types?.[value.type]?.signature ?? "custom";
    const source = value.value?.slice() ?? _GetTypeDefault(signature);
    if (mapping?.convertConnectedTimeToFrames && source.length === 1 && typeof source[0] === "number") {
        source[0] *= targetFps;
    }
    return source;
}

function _GetConfigurationBlock(logicalNode: ILogicalNode, property: IGLTFToFlowGraphMappingObject): FlowGraphBlock | undefined {
    const targetBlock = property.toBlock;
    if (targetBlock) {
        return logicalNode.blocks.find(
            (block) => block.getClassName() === _RuntimeBlockClassName(targetBlock) || _GetBlockProvenance(block)?.role === logicalNode.mapping?.blocks.indexOf(targetBlock)
        );
    }
    return _GetRoleBlock(logicalNode.blocks, 0);
}

function _GetMappedConfigurationValue(
    logicalNode: ILogicalNode,
    key: string,
    property: IGLTFToFlowGraphMappingObject,
    sourceGraph: IKHRInteractivity_Graph,
    preserveCanonicalWhenUnchanged: boolean = true
): unknown[] | undefined {
    const block = _GetConfigurationBlock(logicalNode, property);
    if (!block) {
        return undefined;
    }
    const value = block.config?.[property.name];
    const provenance = _GetConfigurationProvenance(logicalNode, key, property);
    if (preserveCanonicalWhenUnchanged && provenance && _ValuesEqual(_NormalizeValue(value), _NormalizeValue(provenance.runtimeValue))) {
        return provenance.sourceValue ? _CloneJson(provenance.sourceValue) : undefined;
    }
    if (property.indexSource === "variables") {
        const names = (Array.isArray(value) ? value : [value]).filter((entry): entry is string => typeof entry === "string");
        const indices = names.map((name) => (/^staticVariable_(0|[1-9]\d*)$/.test(name) ? parseInt(name.substring("staticVariable_".length), 10) : -1));
        return indices.every((index) => index >= 0 && index < (sourceGraph.variables?.length ?? 0)) ? indices : undefined;
    }
    if (property.indexSource === "events") {
        const eventId = value;
        const eventIndex = sourceGraph.events?.findIndex((event) => event.id === eventId);
        return eventIndex !== undefined && eventIndex >= 0 ? [eventIndex] : undefined;
    }
    if (property.indexSource === "assetNodes" && typeof value === "string") {
        return undefined;
    }
    if (key === "useSlerp") {
        return [value === "Quaternion"];
    }
    return _NormalizeValue(value);
}

function _GetConfigurationProvenance(logicalNode: ILogicalNode, key: string, property: IGLTFToFlowGraphMappingObject): IKHRInteractivityConfigurationProvenance | undefined {
    const block = _GetConfigurationBlock(logicalNode, property);
    return block ? _GetOwn(_GetBlockProvenance(block)?.configuration, key) : undefined;
}

function _IsValidConfigurationValue(value: unknown[] | undefined, property: IGLTFToFlowGraphMappingObject, graph: IKHRInteractivity_Graph, assetNodeCount?: number): boolean {
    if (!value) {
        return false;
    }
    const isInt = (entry: unknown): entry is number => typeof entry === "number" && Number.isInteger(entry) && entry >= -2147483648 && entry <= 2147483647;
    let valid: boolean;
    switch (property.configurationType) {
        case "bool":
            valid = value.length === 1 && typeof value[0] === "boolean";
            break;
        case "int":
            valid = value.length === 1 && isInt(value[0]);
            break;
        case "int[]":
            valid = value.every(isInt);
            break;
        case "string":
            valid = value.length === 1 && typeof value[0] === "string";
            break;
        default:
            valid = value.length > 0;
            break;
    }
    if (!valid || (property.minItems !== undefined && value.length < property.minItems)) {
        return false;
    }
    if (property.minimum !== undefined && value.some((entry) => typeof entry !== "number" || entry < property.minimum!)) {
        return false;
    }
    if (property.maximum !== undefined && value.some((entry) => typeof entry !== "number" || entry > property.maximum!)) {
        return false;
    }
    if (property.indexSource) {
        const lengths: Record<NonNullable<IGLTFToFlowGraphMappingObject["indexSource"]>, number> = {
            types: graph.types?.length ?? 0,
            variables: graph.variables?.length ?? 0,
            events: graph.events?.length ?? 0,
            nodes: graph.nodes?.length ?? 0,
            assetNodes: assetNodeCount ?? 0,
        };
        if (value.some((entry) => !isInt(entry) || entry < 0 || entry >= lengths[property.indexSource!])) {
            return false;
        }
    }
    if (property.allowedSignatures) {
        const typeIndex = value[0];
        const signature = typeof typeIndex === "number" ? graph.types?.[typeIndex]?.signature : undefined;
        if (!signature || !property.allowedSignatures.includes(signature)) {
            return false;
        }
    }
    if (property.allowedValues && value.some((entry) => !property.allowedValues!.includes(entry as boolean | number | string))) {
        return false;
    }
    if (property.debugLogTemplate && (typeof value[0] !== "string" || !ParseDebugLogTemplate(value[0]).valid)) {
        return false;
    }
    return true;
}

function _GetEffectiveConfigurationValue(
    node: IKHRInteractivity_Node,
    mapping: IGLTFToFlowGraphMapping,
    key: string,
    property: IGLTFToFlowGraphMappingObject,
    graph: IKHRInteractivity_Graph,
    logicalNode?: ILogicalNode,
    assetNodeCount?: number
): unknown[] | undefined {
    const getCandidate = (candidateKey: string, candidateProperty: IGLTFToFlowGraphMappingObject): unknown[] | undefined =>
        logicalNode ? _GetMappedConfigurationValue(logicalNode, candidateKey, candidateProperty, graph) : node.configuration?.[candidateKey]?.value;
    if (property.configurationGroup) {
        for (const [candidateKey, candidateProperty] of Object.entries(mapping.configuration ?? {})) {
            if (
                candidateProperty.configurationGroup === property.configurationGroup &&
                !_IsValidConfigurationValue(getCandidate(candidateKey, candidateProperty), candidateProperty, graph, assetNodeCount)
            ) {
                return property.defaultValue === undefined ? undefined : _NormalizeValue(property.defaultValue);
            }
        }
    }
    const candidate = getCandidate(key, property);
    if (!_IsValidConfigurationValue(candidate, property, graph, assetNodeCount)) {
        return property.defaultValue === undefined ? undefined : _NormalizeValue(property.defaultValue);
    }
    return property.uniqueValues ? Array.from(new Set(candidate)) : candidate;
}

function _PushDiagnostic(
    diagnostics: IKHRInteractivityExportDiagnostic[],
    diagnostic: Omit<IKHRInteractivityExportDiagnostic, "severity"> & { severity?: IKHRInteractivityExportDiagnostic["severity"] }
): void {
    diagnostics.push({ severity: "error", ...diagnostic });
}

function _SetOwnProperty<T extends object, K extends PropertyKey>(target: T, key: K, value: unknown): void {
    Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        value,
        writable: true,
    });
}

/**
 * Detached representability and export plan for one or more FlowGraphs.
 */
export class KHRInteractivityExportPlan implements IKHRInteractivityExportProvider {
    private _analysis!: IKHRInteractivityExportAnalysis;
    private _graphAnalyses: IGraphAnalysis[] = [];
    private _additionalExtensionsUsed: string[] = [];
    private readonly _rootDiagnostics: IKHRInteractivityExportDiagnostic[] = [];
    private _isPreflight = false;

    /** Whether KHR_interactivity is required in the exported asset. */
    public readonly required: boolean;

    /** Additional operation/companion extensions referenced by the exported graphs. */
    public get additionalExtensionsUsed(): readonly string[] {
        return this._additionalExtensionsUsed;
    }

    /** Additional extensions explicitly required by the caller. */
    public readonly additionalExtensionsRequired: readonly string[];

    /**
     * @param _flowGraphs FlowGraphs to analyze without mutating them
     * @param _options canonical source and export settings
     */
    public constructor(
        private readonly _flowGraphs: readonly FlowGraph[],
        private readonly _options: IKHRInteractivityExportOptions = {}
    ) {
        this.required = _options.required ?? true;
        this.additionalExtensionsRequired = Array.from(new Set(_options.additionalExtensionsRequired ?? [])).sort();
        this._refreshAnalysis();
    }

    private _refreshAnalysis(): void {
        this._rootDiagnostics.length = 0;
        this._graphAnalyses = this._analyzeGraphs();
        this._additionalExtensionsUsed = Array.from(new Set([...this._collectAdditionalExtensions(), ...this.additionalExtensionsRequired])).sort();
        const unscopedBuildDiagnostics = this._mergeBuildDiagnostics(this._validateBuildWithSourceIndices());
        const nodes = this._graphAnalyses.flatMap((graph) =>
            graph.nodes.map((node): IKHRInteractivityNodeExportAnalysis => ({
                graphIndex: graph.graphIndex,
                nodeIndex: node.sourceIndex,
                operation: node.operation,
                blockIds: node.blocks.map((block) => block.uniqueId).sort(),
                classification: node.classification,
                diagnostics: node.diagnostics.slice(),
            }))
        );
        const diagnostics = this._sortDiagnostics(
            this._rootDiagnostics.concat(
                this._graphAnalyses.flatMap((graph) => graph.diagnostics.concat(graph.nodes.flatMap((node) => node.diagnostics))),
                unscopedBuildDiagnostics
            )
        );
        this._analysis = {
            representable: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
            nodes,
            diagnostics,
        };
    }

    private _mergeBuildDiagnostics(diagnostics: IKHRInteractivityExportDiagnostic[]): IKHRInteractivityExportDiagnostic[] {
        const unscoped: IKHRInteractivityExportDiagnostic[] = [];
        for (const diagnostic of diagnostics) {
            const pathNodeIndex = /\/nodes\/(\d+)(?:\/|$)/.exec(diagnostic.path)?.[1];
            const nodeIndex = diagnostic.nodeIndex ?? (pathNodeIndex === undefined ? undefined : parseInt(pathNodeIndex, 10));
            const graph = diagnostic.graphIndex === undefined ? undefined : this._graphAnalyses[diagnostic.graphIndex];
            const node = nodeIndex === undefined ? undefined : graph?.nodes.find((candidate) => candidate.sourceIndex === nodeIndex);
            if (!node) {
                unscoped.push(diagnostic);
                continue;
            }
            if (!node.diagnostics.some((existing) => existing.code === diagnostic.code && existing.path === diagnostic.path && existing.message === diagnostic.message)) {
                node.diagnostics.push({ ...diagnostic, nodeIndex });
            }
            if (diagnostic.severity === "error" && (node.classification === "exact" || node.classification === "inverse-composite")) {
                node.classification = "lossy";
            }
        }
        return unscoped;
    }

    /**
     * Gets the detached representability analysis.
     * @returns current analysis
     */
    public analyze(): IKHRInteractivityExportAnalysis {
        this._refreshAnalysis();
        return {
            representable: this._analysis.representable,
            nodes: this._analysis.nodes.map((node) => ({ ...node, blockIds: node.blockIds.slice(), diagnostics: node.diagnostics.slice() })),
            diagnostics: this._analysis.diagnostics.slice(),
        };
    }

    /**
     * Builds the extension after final glTF entity remapping is available.
     * @param context serializer remapping context
     * @returns canonical KHR_interactivity payload
     */
    public build(context: IKHRInteractivitySerializerContext): IKHRInteractivity {
        this._refreshAnalysis();
        if (!this._analysis.representable) {
            throw new KHRInteractivityExportError(this._analysis.diagnostics);
        }
        const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
        const graphs = this._graphAnalyses.map((analysis) => this._buildGraph(analysis, context, diagnostics));
        this._writeCompanionNodeExtensions(context, diagnostics);
        if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
            throw new KHRInteractivityExportError(this._sortDiagnostics(diagnostics));
        }

        const source = this._options.document?.source ? _CloneJson(this._options.document.source) : ({ graphs: [] } as IKHRInteractivity);
        source.graphs = graphs;
        const defaultGraphIndex = this._options.defaultGraphIndex ?? this._options.document?.defaultGraphIndex ?? 0;
        if (defaultGraphIndex < 0 || defaultGraphIndex >= graphs.length) {
            _PushDiagnostic(diagnostics, {
                code: "GRAPH_COUNT_MISMATCH",
                path: "/extensions/KHR_interactivity/graph",
                message: `Default graph index ${defaultGraphIndex} is outside the exported graph range.`,
            });
            throw new KHRInteractivityExportError(diagnostics);
        }
        if (defaultGraphIndex !== 0 || source.graph !== undefined) {
            source.graph = defaultGraphIndex;
        }
        return source;
    }

    private _getSourceGraph(graph: FlowGraph, graphIndex: number): IKHRInteractivity_Graph | undefined {
        const documentGraph = this._options.document?.graphs[graphIndex]?.source;
        if (documentGraph) {
            return CloneKHRInteractivityGraph(documentGraph);
        }
        const provenance = graph.metadata?.khrInteractivity as IKHRInteractivityGraphProvenance | undefined;
        return provenance?.source ? CloneKHRInteractivityGraph(provenance.source) : undefined;
    }

    private _validateBuildWithSourceIndices(): IKHRInteractivityExportDiagnostic[] {
        const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
        const sourceGLTF = this._options.sourceGLTF;
        const indexOrUndefined = (index: number | undefined): number | undefined => (index !== undefined && index >= 0 ? index : undefined);
        const context: IKHRInteractivitySerializerContext = {
            getNodeCount: () => sourceGLTF?.nodes?.length ?? 0,
            getNodeIndex: (node) => indexOrUndefined(sourceGLTF?.nodes?.findIndex((candidate) => candidate._babylonTransformNode === node)),
            getAnimationIndex: (animation) => indexOrUndefined(sourceGLTF?.animations?.findIndex((candidate) => candidate._babylonAnimationGroup === animation)),
            getCameraIndex: (camera) => indexOrUndefined(sourceGLTF?.cameras?.findIndex((candidate) => candidate._babylonCamera === camera)),
            getMaterialIndex: (material) =>
                indexOrUndefined(sourceGLTF?.materials?.findIndex((candidate) => Object.values(candidate._data ?? {}).some((entry) => entry.babylonMaterial === material))),
            getRootIndex: (collection, entity) => this._getSourceRootIndex(collection, entity),
            setNodeExtension: () => {},
        };
        this._isPreflight = true;
        try {
            for (const analysis of this._graphAnalyses) {
                this._buildGraph(analysis, context, diagnostics);
            }
            this._writeCompanionNodeExtensions(context, diagnostics);
        } finally {
            this._isPreflight = false;
        }
        return diagnostics;
    }

    private _analyzeGraphs(): IGraphAnalysis[] {
        const analyses: IGraphAnalysis[] = [];
        if (!this._options.document) {
            _PushDiagnostic(this._rootDiagnostics, {
                code: "GRAPH_SOURCE_MISSING",
                path: "/extensions/KHR_interactivity",
                message: "A canonical KHR_interactivity document is required to preserve root metadata and the default graph selection.",
            });
        }
        if (this._flowGraphs.length === 0) {
            _PushDiagnostic(this._rootDiagnostics, {
                code: "GRAPH_COUNT_MISMATCH",
                path: "/extensions/KHR_interactivity/graphs",
                message: "At least one FlowGraph is required for KHR_interactivity export.",
            });
            return analyses;
        }
        for (const diagnostic of this._options.document?.diagnostics ?? []) {
            _PushDiagnostic(this._rootDiagnostics, {
                code: "GRAPH_INVALID",
                path: diagnostic.path,
                message: diagnostic.message,
                severity: diagnostic.severity,
            });
        }
        if (this._options.document && this._options.document.graphs.length !== this._flowGraphs.length) {
            _PushDiagnostic(this._rootDiagnostics, {
                code: "GRAPH_COUNT_MISMATCH",
                path: "/extensions/KHR_interactivity/graphs",
                message: `Canonical source has ${this._options.document.graphs.length} graph(s), but ${this._flowGraphs.length} FlowGraph(s) were supplied.`,
            });
            return analyses;
        }
        for (let graphIndex = 0; graphIndex < this._flowGraphs.length; graphIndex++) {
            const graph = this._flowGraphs[graphIndex];
            const source = this._getSourceGraph(graph, graphIndex);
            const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
            for (const diagnostic of this._options.document?.graphs[graphIndex]?.diagnostics ?? []) {
                _PushDiagnostic(diagnostics, {
                    code: "GRAPH_INVALID",
                    graphIndex,
                    path: diagnostic.path,
                    message: diagnostic.message,
                    severity: diagnostic.severity,
                });
            }
            if (!source) {
                _PushDiagnostic(diagnostics, {
                    code: "GRAPH_SOURCE_MISSING",
                    graphIndex,
                    path: `/graphs/${graphIndex}`,
                    message: "This FlowGraph has no canonical KHR_interactivity source. Only imported graphs and registered standalone inverse mappings can be exported.",
                });
                const unsupportedNodes = graph.getAllBlocks().map((block): ILogicalNode => ({
                    sourceIndex: -1,
                    declarationIndex: -1,
                    operation: "",
                    blocks: [block],
                    classification: this._classifyStandaloneBlock(block, diagnostics),
                    diagnostics: diagnostics.filter((diagnostic) => diagnostic.blockId === block.uniqueId),
                }));
                analyses.push({ graph, graphIndex, source: {}, nodes: unsupportedNodes, diagnostics });
                continue;
            }
            analyses.push({
                graph,
                graphIndex,
                source,
                nodes: this._analyzeImportedNodes(graph, graphIndex, source, diagnostics),
                diagnostics,
            });
        }
        return analyses;
    }

    private _classifyStandaloneBlock(block: FlowGraphBlock, diagnostics: IKHRInteractivityExportDiagnostic[]): KHRInteractivityExportClassification {
        const candidates = GetInteractivityOperationRegistry().filter(
            (entry) => entry.mapping.blocks.length === 1 && _RuntimeBlockClassName(entry.mapping.blocks[0]) === block.getClassName()
        );
        const path = `/blocks/${block.uniqueId}`;
        if (candidates.length === 0) {
            _PushDiagnostic(diagnostics, {
                code: "BLOCK_UNSUPPORTED",
                path,
                blockId: block.uniqueId,
                message: `FlowGraph block "${block.getClassName()}" has no KHR_interactivity inverse mapping.`,
            });
            return "unsupported";
        }
        _PushDiagnostic(diagnostics, {
            code: "BLOCK_AMBIGUOUS",
            path,
            blockId: block.uniqueId,
            message:
                candidates.length === 1
                    ? `FlowGraph block "${block.getClassName()}" is not associated with canonical KHR source provenance.`
                    : `FlowGraph block "${block.getClassName()}" is ambiguous between ${candidates.map((entry) => _FullOperationName(entry.op, entry.extension)).join(", ")}.`,
        });
        return "lossy";
    }

    private _analyzeImportedNodes(graph: FlowGraph, graphIndex: number, source: IKHRInteractivity_Graph, graphDiagnostics: IKHRInteractivityExportDiagnostic[]): ILogicalNode[] {
        const groups = new Map<number, FlowGraphBlock[]>();
        for (const block of graph.getAllBlocks()) {
            const provenance = _GetBlockProvenance(block);
            if (!provenance || provenance.graphIndex !== graphIndex || provenance.nodeIndex < 0) {
                const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
                this._classifyStandaloneBlock(block, diagnostics);
                graphDiagnostics.push(...diagnostics);
                groups.set(Number.MIN_SAFE_INTEGER + groups.size, [block]);
                continue;
            }
            const group = groups.get(provenance.nodeIndex) ?? [];
            group.push(block);
            groups.set(provenance.nodeIndex, group);
        }

        const logicalNodes: ILogicalNode[] = [];
        for (let nodeIndex = 0; nodeIndex < (source.nodes?.length ?? 0); nodeIndex++) {
            const sourceNode = source.nodes![nodeIndex];
            const declaration = source.declarations?.[sourceNode.declaration];
            const declarationModel = this._options.document?.graphs[graphIndex]?.declarations[sourceNode.declaration];
            const operation = declaration ? _FullOperationName(declaration.op, declaration.extension) : "";
            const mapping = declaration && declarationModel?.support !== "unsupported-extension" ? getMappingForDeclaration(declaration, false) : undefined;
            const blocks = groups.get(nodeIndex) ?? [];
            const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
            let classification: KHRInteractivityExportClassification = mapping && mapping.blocks.length > 1 ? "inverse-composite" : "exact";
            if (!declaration) {
                classification = "unsupported";
                _PushDiagnostic(diagnostics, {
                    code: "NODE_SOURCE_MISSING",
                    graphIndex,
                    nodeIndex,
                    path: `/graphs/${graphIndex}/nodes/${nodeIndex}/declaration`,
                    message: `Declaration index ${sourceNode.declaration} is unavailable.`,
                });
            } else if (declaration.extension === "BABYLON") {
                classification = "unsupported";
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_UNSUPPORTED",
                    graphIndex,
                    nodeIndex,
                    path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                    message: `Compatibility-only operation "${operation}" is not part of ratified KHR_interactivity and cannot be exported as standards-compliant data.`,
                });
            } else if (!mapping && !declaration.extension) {
                classification = "unsupported";
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_UNSUPPORTED",
                    graphIndex,
                    nodeIndex,
                    path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                    message: `Unknown core operation "${declaration.op}" cannot be exported.`,
                });
            } else if (!mapping && declaration.extension) {
                if (blocks.length !== 1 || blocks[0].getClassName() !== _UnsupportedBlockClassName) {
                    classification = "unsupported";
                    _PushDiagnostic(diagnostics, {
                        code: "BLOCK_TYPE_MISMATCH",
                        graphIndex,
                        nodeIndex,
                        path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                        message: `Unsupported extension operation "${operation}" must remain an intact typed no-op block.`,
                    });
                } else {
                    this._validateUnsupportedExtensionBlock(source, sourceNode, nodeIndex, operation, declaration, blocks[0], graphIndex, diagnostics);
                    if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
                        classification = "lossy";
                    }
                }
            } else {
                this._validateMappedBlocks(graphIndex, nodeIndex, operation, mapping!, blocks, diagnostics);
                if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
                    classification = "lossy";
                }
            }
            if (blocks.length === 0) {
                classification = "unsupported";
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_ROLE_MISSING",
                    graphIndex,
                    nodeIndex,
                    path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                    message: `The FlowGraph blocks for "${operation}" were removed.`,
                });
            }
            groups.delete(nodeIndex);
            logicalNodes.push({
                sourceIndex: nodeIndex,
                declarationIndex: sourceNode.declaration,
                operation,
                mapping,
                blocks,
                classification,
                diagnostics,
            });
        }

        for (const blocks of groups.values()) {
            const block = blocks[0];
            const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
            const classification = this._classifyStandaloneBlock(block, diagnostics);
            graphDiagnostics.push(...diagnostics);
            logicalNodes.push({
                sourceIndex: -1,
                declarationIndex: -1,
                operation: "",
                blocks,
                classification,
                diagnostics,
            });
        }
        return logicalNodes;
    }

    private _validateUnsupportedExtensionBlock(
        graph: IKHRInteractivity_Graph,
        node: IKHRInteractivity_Node,
        nodeIndex: number,
        operation: string,
        declaration: NonNullable<IKHRInteractivity_Graph["declarations"]>[number],
        block: FlowGraphBlock,
        graphIndex: number,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): void {
        const config = block.config as {
            operation?: unknown;
            inputValueSockets?: unknown;
            outputValueSockets?: unknown;
            inputFlowSockets?: unknown;
            outputFlowSockets?: unknown;
        };
        const normalizeValueSockets = (sockets: unknown) =>
            Array.isArray(sockets)
                ? sockets
                      .map((socket) =>
                          socket !== null && typeof socket === "object"
                              ? { name: (socket as { name?: unknown }).name, signature: (socket as { signature?: unknown }).signature }
                              : socket
                      )
                      .sort((left, right) => String(JSON.stringify(left)).localeCompare(String(JSON.stringify(right))))
                : sockets;
        const normalizeFlowSockets = (sockets: unknown) => (Array.isArray(sockets) ? sockets.slice().sort() : sockets);
        const expectedValueSockets = (sockets: typeof declaration.inputValueSockets) =>
            Object.entries(sockets ?? {})
                .map(([name, socket]) => ({ name, signature: graph.types?.[socket.type]?.signature }))
                .sort((left, right) => left.name.localeCompare(right.name));
        const expectedInputFlows = Array.from(
            new Set(
                (graph.nodes ?? []).flatMap((sourceNode) =>
                    Object.values(sourceNode.flows ?? {})
                        .filter((flow) => flow.node === nodeIndex)
                        .map((flow) => flow.socket ?? "in")
                )
            )
        ).sort();
        const expectedOutputFlows = Object.keys(node.flows ?? {}).sort();
        const actualConnectionNames = {
            inputValues: block.dataInputs.map((connection) => connection.name).sort(),
            outputValues: block.dataOutputs.map((connection) => connection.name).sort(),
            inputFlows: block instanceof FlowGraphExecutionBlock ? block.signalInputs.map((connection) => connection.name).sort() : [],
            outputFlows: block instanceof FlowGraphExecutionBlock ? block.signalOutputs.map((connection) => connection.name).sort() : [],
        };
        const expectedConnectionNames = {
            inputValues: Object.keys(declaration.inputValueSockets ?? {}).sort(),
            outputValues: Object.keys(declaration.outputValueSockets ?? {}).sort(),
            inputFlows: expectedInputFlows,
            outputFlows: expectedOutputFlows,
        };
        if (
            config.operation !== operation ||
            !_JsonEquivalent(normalizeValueSockets(config.inputValueSockets), expectedValueSockets(declaration.inputValueSockets)) ||
            !_JsonEquivalent(normalizeValueSockets(config.outputValueSockets), expectedValueSockets(declaration.outputValueSockets)) ||
            !_JsonEquivalent(normalizeFlowSockets(config.inputFlowSockets), expectedInputFlows) ||
            !_JsonEquivalent(normalizeFlowSockets(config.outputFlowSockets), expectedOutputFlows) ||
            !_JsonEquivalent(actualConnectionNames, expectedConnectionNames)
        ) {
            _PushDiagnostic(diagnostics, {
                code: "BLOCK_TYPE_MISMATCH",
                graphIndex,
                nodeIndex,
                path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                blockId: block.uniqueId,
                message: `Unsupported extension operation "${operation}" has edited socket metadata and can no longer be exported as its canonical typed no-op.`,
            });
        }
    }

    private _validateMappedBlocks(
        graphIndex: number,
        nodeIndex: number,
        operation: string,
        mapping: IGLTFToFlowGraphMapping,
        blocks: readonly FlowGraphBlock[],
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): void {
        for (let role = 0; role < mapping.blocks.length; role++) {
            const roleBlocks = blocks.filter((block) => _GetBlockProvenance(block)?.role === role);
            if (roleBlocks.length === 0) {
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_ROLE_MISSING",
                    graphIndex,
                    nodeIndex,
                    path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                    message: `Composite "${operation}" is missing role ${role} (${mapping.blocks[role]}).`,
                });
                continue;
            }
            if (roleBlocks.length > 1) {
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_ROLE_DUPLICATE",
                    graphIndex,
                    nodeIndex,
                    path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                    message: `Composite "${operation}" has more than one block for role ${role}.`,
                });
                continue;
            }
            if (roleBlocks[0].getClassName() !== _RuntimeBlockClassName(mapping.blocks[role])) {
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_TYPE_MISMATCH",
                    graphIndex,
                    nodeIndex,
                    blockId: roleBlocks[0].uniqueId,
                    path: `/blocks/${roleBlocks[0].uniqueId}`,
                    message: `Composite role ${role} must be "${mapping.blocks[role]}", not "${roleBlocks[0].getClassName()}".`,
                });
            }
        }
        for (const block of blocks) {
            const provenance = _GetBlockProvenance(block);
            if (!provenance || provenance.nodeIndex !== nodeIndex || provenance.operation !== operation || provenance.declarationIndex < 0) {
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_PROVENANCE_INVALID",
                    graphIndex,
                    nodeIndex,
                    blockId: block.uniqueId,
                    path: `/blocks/${block.uniqueId}`,
                    message: `Block provenance no longer identifies the imported "${operation}" node.`,
                });
            } else if (provenance.role < -1 || provenance.role >= mapping.blocks.length) {
                _PushDiagnostic(diagnostics, {
                    code: "BLOCK_PROVENANCE_INVALID",
                    graphIndex,
                    nodeIndex,
                    blockId: block.uniqueId,
                    path: `/blocks/${block.uniqueId}`,
                    message: `Block role ${provenance.role} is not part of the "${operation}" inverse mapping.`,
                });
            }
        }
        type CompositeConnection = FlowGraphDataConnection<any> | FlowGraphSignalConnection;
        const allowedInternalPeers = new Map<CompositeConnection, Set<CompositeConnection>>();
        const allowInternalConnection = (left: CompositeConnection, right: CompositeConnection) => {
            const leftPeers = allowedInternalPeers.get(left) ?? new Set<CompositeConnection>();
            leftPeers.add(right);
            allowedInternalPeers.set(left, leftPeers);
            const rightPeers = allowedInternalPeers.get(right) ?? new Set<CompositeConnection>();
            rightPeers.add(left);
            allowedInternalPeers.set(right, rightPeers);
        };
        for (const connector of mapping.interBlockConnectors ?? []) {
            const inputBlock = _GetRoleBlock(blocks, connector.inputBlockIndex);
            const outputBlock = _GetRoleBlock(blocks, connector.outputBlockIndex);
            const input = connector.isVariable
                ? inputBlock?.dataInputs.find((connection) => connection.name === connector.input)
                : inputBlock instanceof FlowGraphExecutionBlock
                  ? inputBlock.signalInputs.find((connection) => connection.name === connector.input)
                  : undefined;
            const output = connector.isVariable
                ? outputBlock?.dataOutputs.find((connection) => connection.name === connector.output)
                : outputBlock instanceof FlowGraphExecutionBlock
                  ? outputBlock.signalOutputs.find((connection) => connection.name === connector.output)
                  : undefined;
            if (input && output) {
                allowInternalConnection(input, output);
            }
            if (!input || !output || !input._connectedPoint.includes(output as never)) {
                _PushDiagnostic(diagnostics, {
                    code: "COMPOSITE_CONNECTION_CHANGED",
                    graphIndex,
                    nodeIndex,
                    path: `/graphs/${graphIndex}/nodes/${nodeIndex}`,
                    message: `Internal composite connection "${connector.output}" -> "${connector.input}" was changed.`,
                });
            }
        }
        const reportedUnexpectedConnections = new Set<CompositeConnection>();
        for (const block of blocks) {
            const blockProvenance = _GetBlockProvenance(block);
            for (const [key, expected] of Object.entries(blockProvenance?.generatedConfiguration ?? {})) {
                const current =
                    key === "eventData"
                        ? NormalizeInteractivityEventDataConfiguration(block.config?.[key])
                        : key === "outputSignalCount"
                          ? ((block as { outputSignals?: unknown[]; executionSignals?: unknown[] }).outputSignals?.length ??
                            (block as { executionSignals?: unknown[] }).executionSignals?.length ??
                            block.config?.[key])
                          : block.config?.[key];
                if (!_JsonEquivalent(current, expected)) {
                    _PushDiagnostic(diagnostics, {
                        code: "CONFIGURATION_UNREPRESENTABLE",
                        graphIndex,
                        nodeIndex,
                        blockId: block.uniqueId,
                        path: `/blocks/${block.uniqueId}/config/${key}`,
                        message: `Importer-generated configuration "${key}" was changed and no longer represents "${operation}".`,
                    });
                }
            }
            if ((blockProvenance?.role ?? 0) < 0) {
                continue;
            }
            const connections: CompositeConnection[] = [
                ...block.dataInputs,
                ...block.dataOutputs,
                ...(block instanceof FlowGraphExecutionBlock ? block.signalInputs : []),
                ...(block instanceof FlowGraphExecutionBlock ? block.signalOutputs : []),
            ];
            for (const connection of connections) {
                if (!connection.isConnected() || reportedUnexpectedConnections.has(connection)) {
                    continue;
                }
                const khrFacing =
                    _GetSocketProvenance(connection) ??
                    this._inferSocketProvenance(connection, {
                        sourceIndex: nodeIndex,
                        declarationIndex: -1,
                        operation,
                        mapping,
                        blocks,
                        classification: "exact",
                        diagnostics,
                    });
                const unexpectedPeers = connection._connectedPoint.filter((peer) => {
                    const internal = blocks.includes(peer._ownerBlock);
                    const importerHelper = internal && _GetBlockProvenance(peer._ownerBlock)?.role === -1;
                    return internal ? !allowedInternalPeers.get(connection)?.has(peer) && !(khrFacing && importerHelper) : !khrFacing;
                });
                if (unexpectedPeers.length > 0) {
                    reportedUnexpectedConnections.add(connection);
                    unexpectedPeers.forEach((peer) => reportedUnexpectedConnections.add(peer));
                    _PushDiagnostic(diagnostics, {
                        code: "SOCKET_PROVENANCE_MISSING",
                        graphIndex,
                        nodeIndex,
                        blockId: block.uniqueId,
                        socket: connection.name,
                        path: `/blocks/${block.uniqueId}/${connection.name}`,
                        message: `Connection from socket "${connection.name}" is not part of the "${operation}" inverse mapping.`,
                    });
                }
            }
        }
    }

    private _buildGraph(analysis: IGraphAnalysis, context: IKHRInteractivitySerializerContext, diagnostics: IKHRInteractivityExportDiagnostic[]): IKHRInteractivity_Graph {
        const graph = CloneKHRInteractivityGraph(analysis.source);
        const importedName = analysis.source.name ?? `Graph ${analysis.graphIndex + 1}`;
        if (analysis.source.name !== undefined || analysis.graph.name !== importedName) {
            graph.name = analysis.graph.name;
        } else {
            delete graph.name;
        }
        this._updateVariables(graph, analysis.graph, diagnostics, analysis.graphIndex);
        const logicalBySourceIndex = new Map(analysis.nodes.filter((node) => node.sourceIndex >= 0).map((node) => [node.sourceIndex, node]));
        const rebuiltNodes = (graph.nodes ?? []).map((sourceNode, nodeIndex) => {
            const logicalNode = logicalBySourceIndex.get(nodeIndex)!;
            return this._rebuildNode(graph, sourceNode, logicalNode, analysis, context, diagnostics);
        });
        const ordered = this._topologicallyOrderNodes(rebuiltNodes, analysis.graphIndex, diagnostics);
        if (!ordered) {
            return graph;
        }
        if (analysis.source.nodes !== undefined || ordered.nodes.length > 0) {
            graph.nodes = ordered.nodes;
        } else {
            delete graph.nodes;
        }
        this._remapGraphReferences(graph, context, diagnostics, analysis.graphIndex, ordered.sourceIndices);
        const validation = CreateKHRInteractivityGraphModel(graph, analysis.graphIndex, new Set(this.additionalExtensionsUsed), context.getNodeCount());
        for (const diagnostic of validation.diagnostics) {
            if (diagnostic.severity === "error") {
                const finalNodeIndexText = /\/nodes\/(\d+)(?:\/|$)/.exec(diagnostic.path)?.[1];
                const finalNodeIndex = finalNodeIndexText === undefined ? undefined : parseInt(finalNodeIndexText, 10);
                _PushDiagnostic(diagnostics, {
                    code: "GRAPH_INVALID",
                    graphIndex: analysis.graphIndex,
                    nodeIndex: finalNodeIndex === undefined ? undefined : ordered.sourceIndices[finalNodeIndex],
                    path: diagnostic.path,
                    message: diagnostic.message,
                });
            }
        }
        return graph;
    }

    private _rebuildNode(
        graph: IKHRInteractivity_Graph,
        sourceNode: IKHRInteractivity_Node,
        logicalNode: ILogicalNode,
        graphAnalysis: IGraphAnalysis,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): IKHRInteractivity_Node {
        const node = _CloneJson(sourceNode);
        const mapping = logicalNode.mapping;
        if (mapping) {
            this._rebuildConfiguration(graph, node, logicalNode, graphAnalysis.graphIndex, context, diagnostics);
        }
        for (const socket of Object.keys(sourceNode.values ?? {}).sort()) {
            if (mapping) {
                const sourceEffective = this._isEffectiveValueInput(graph, sourceNode, logicalNode, socket, false);
                const currentEffective = this._isEffectiveValueInput(graph, sourceNode, logicalNode, socket, true);
                if (!sourceEffective) {
                    if (currentEffective) {
                        _PushDiagnostic(diagnostics, {
                            code: "CONFIGURATION_UNREPRESENTABLE",
                            graphIndex: graphAnalysis.graphIndex,
                            nodeIndex: logicalNode.sourceIndex,
                            socket,
                            path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/values/${socket}`,
                            message: `Configuration edits made formerly ignored value socket "${socket}" effective without an authored FlowGraph socket.`,
                        });
                    }
                    continue;
                }
                if (!currentEffective) {
                    delete node.values![socket];
                    continue;
                }
            }
            const input = _FindDataInput(logicalNode.blocks, logicalNode.sourceIndex, socket);
            if (!input) {
                _PushDiagnostic(diagnostics, {
                    code: "SOCKET_PROVENANCE_MISSING",
                    graphIndex: graphAnalysis.graphIndex,
                    nodeIndex: logicalNode.sourceIndex,
                    socket,
                    path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/values/${socket}`,
                    message: `Input value socket "${socket}" no longer has KHR_interactivity provenance.`,
                });
                continue;
            }
            const mappingObject = this._getMappingObject(mapping?.inputs?.values, socket);
            node.values![socket] = this._rebuildInputValue(graph, sourceNode.values![socket], input, mappingObject, logicalNode, graphAnalysis, diagnostics);
        }
        if (node.values && Object.keys(node.values).length === 0) {
            delete node.values;
        }
        const flowOutputs = new Map<string, FlowGraphSignalConnection>();
        for (const block of logicalNode.blocks) {
            if (!(block instanceof FlowGraphExecutionBlock)) {
                continue;
            }
            for (const output of block.signalOutputs) {
                const provenance = _GetSocketProvenance(output) ?? this._inferSocketProvenance(output, logicalNode);
                if (provenance?.nodeIndex === logicalNode.sourceIndex && provenance.kind === "flow" && provenance.direction === "output") {
                    if (!this._isEffectiveFlowOutput(graph, sourceNode, logicalNode, provenance.socket, true)) {
                        if (output.isConnected()) {
                            _PushDiagnostic(diagnostics, {
                                code: "CONFIGURATION_UNREPRESENTABLE",
                                graphIndex: graphAnalysis.graphIndex,
                                nodeIndex: logicalNode.sourceIndex,
                                socket: provenance.socket,
                                path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${provenance.socket}`,
                                message: `Flow socket "${provenance.socket}" is connected but disabled by the edited configuration.`,
                            });
                        }
                        continue;
                    }
                    if (flowOutputs.has(provenance.socket)) {
                        _PushDiagnostic(diagnostics, {
                            code: "SOCKET_CONNECTION_AMBIGUOUS",
                            graphIndex: graphAnalysis.graphIndex,
                            nodeIndex: logicalNode.sourceIndex,
                            socket: provenance.socket,
                            path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${provenance.socket}`,
                            message: `Multiple FlowGraph outputs map to KHR flow socket "${provenance.socket}".`,
                        });
                    } else {
                        flowOutputs.set(provenance.socket, output);
                    }
                }
            }
        }
        const rebuiltFlows: NonNullable<IKHRInteractivity_Node["flows"]> = {};
        for (const [socket, sourceFlow] of Object.entries(sourceNode.flows ?? {})) {
            const sourceEffective = this._isEffectiveFlowOutput(graph, sourceNode, logicalNode, socket, false);
            const currentEffective = this._isEffectiveFlowOutput(graph, sourceNode, logicalNode, socket, true);
            if (!sourceEffective) {
                if (currentEffective) {
                    _PushDiagnostic(diagnostics, {
                        code: "CONFIGURATION_UNREPRESENTABLE",
                        graphIndex: graphAnalysis.graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        socket,
                        path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${socket}`,
                        message: `Configuration edits made formerly ignored flow socket "${socket}" effective without a live FlowGraph connection.`,
                    });
                } else {
                    _SetOwnProperty(rebuiltFlows, socket, _CloneJson(sourceFlow));
                }
            }
        }
        for (const [socket, output] of [...flowOutputs.entries()].sort(([left], [right]) => left.localeCompare(right))) {
            if (output._connectedPoint.length === 0) {
                const sourceFlow = sourceNode.flows?.[socket];
                if (sourceFlow) {
                    const sourceNoOp = this._isNoOpFlowTarget(graph, graphAnalysis, sourceFlow, false);
                    const currentNoOp = this._isNoOpFlowTarget(graph, graphAnalysis, sourceFlow, true);
                    if (sourceNoOp && currentNoOp) {
                        _SetOwnProperty(rebuiltFlows, socket, _CloneJson(sourceFlow));
                    } else if (sourceNoOp && !currentNoOp) {
                        _PushDiagnostic(diagnostics, {
                            code: "CONFIGURATION_UNREPRESENTABLE",
                            graphIndex: graphAnalysis.graphIndex,
                            nodeIndex: logicalNode.sourceIndex,
                            socket,
                            path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${socket}`,
                            message: `Configuration edits made formerly ignored flow target "${sourceFlow.socket ?? "in"}" effective without a live FlowGraph connection.`,
                        });
                    }
                }
                continue;
            }
            if (output._connectedPoint.length > 1) {
                _PushDiagnostic(diagnostics, {
                    code: "SOCKET_CONNECTION_AMBIGUOUS",
                    graphIndex: graphAnalysis.graphIndex,
                    nodeIndex: logicalNode.sourceIndex,
                    socket,
                    path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${socket}`,
                    message: `KHR output flow "${socket}" must connect to exactly one target; found ${output._connectedPoint.length}.`,
                });
                continue;
            }
            const target = output._connectedPoint[0];
            const targetBlockProvenance = _GetBlockProvenance(target._ownerBlock);
            const targetLogicalNode = targetBlockProvenance ? graphAnalysis.nodes.find((candidate) => candidate.sourceIndex === targetBlockProvenance.nodeIndex) : undefined;
            const provenance = _GetSocketProvenance(target) ?? (targetLogicalNode ? this._inferSocketProvenance(target, targetLogicalNode) : undefined);
            if (!provenance || provenance.kind !== "flow" || provenance.direction !== "input") {
                _PushDiagnostic(diagnostics, {
                    code: "SOCKET_TARGET_UNREPRESENTABLE",
                    graphIndex: graphAnalysis.graphIndex,
                    nodeIndex: logicalNode.sourceIndex,
                    socket,
                    path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${socket}`,
                    message: `Flow target for "${socket}" is not part of a representable KHR node.`,
                });
                continue;
            }
            if (targetLogicalNode) {
                const targetSourceNode = graph.nodes?.[targetLogicalNode.sourceIndex];
                if (targetSourceNode && !this._isEffectiveFlowInput(graph, targetSourceNode, targetLogicalNode, provenance.socket, true)) {
                    _PushDiagnostic(diagnostics, {
                        code: "CONFIGURATION_UNREPRESENTABLE",
                        graphIndex: graphAnalysis.graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        socket,
                        path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${socket}`,
                        message: `Flow target socket "${provenance.socket}" is disabled by the target node's edited configuration.`,
                    });
                    continue;
                }
            }
            const rebuiltFlow = sourceNode.flows?.[socket]
                ? _CloneJson(sourceNode.flows[socket])
                : ({ node: provenance.nodeIndex } as NonNullable<IKHRInteractivity_Node["flows"]>[string]);
            rebuiltFlow.node = provenance.nodeIndex;
            if (provenance.socket === "in") {
                delete rebuiltFlow.socket;
            } else {
                rebuiltFlow.socket = provenance.socket;
            }
            _SetOwnProperty(rebuiltFlows, socket, rebuiltFlow);
        }
        if (Object.keys(rebuiltFlows).length > 0) {
            node.flows = rebuiltFlows;
        } else {
            delete node.flows;
        }
        if (mapping) {
            this._remapPointerTemplateInputs(graph, node, logicalNode, graphAnalysis.graphIndex, context, diagnostics);
        }
        return node;
    }

    private _getMappingObject(mapping: { [name: string]: IGLTFToFlowGraphMappingObject } | undefined, socket: string): IGLTFToFlowGraphMappingObject | undefined {
        const fixed = _GetOwn(mapping, socket);
        if (fixed) {
            return fixed;
        }
        return Object.entries(mapping ?? {}).find(([key]) => key.startsWith("[") && key.endsWith("]"))?.[1];
    }

    private _inferSocketProvenance(connection: FlowGraphDataConnection<any> | FlowGraphSignalConnection, logicalNode: ILogicalNode): IKHRInteractivitySocketProvenance | undefined {
        const mapping = logicalNode.mapping;
        const block = connection._ownerBlock;
        const blockProvenance = _GetBlockProvenance(block);
        if (!mapping || !blockProvenance || blockProvenance.role < 0) {
            return undefined;
        }
        const isDataInput = block.dataInputs.includes(connection as FlowGraphDataConnection<any>);
        const isDataOutput = block.dataOutputs.includes(connection as FlowGraphDataConnection<any>);
        const isSignalInput = block instanceof FlowGraphExecutionBlock && block.signalInputs.includes(connection as FlowGraphSignalConnection);
        const isSignalOutput = block instanceof FlowGraphExecutionBlock && block.signalOutputs.includes(connection as FlowGraphSignalConnection);
        const kind: IKHRInteractivitySocketProvenance["kind"] = isDataInput || isDataOutput ? "value" : "flow";
        const direction: IKHRInteractivitySocketProvenance["direction"] = isDataInput || isSignalInput ? "input" : "output";
        if (!isDataInput && !isDataOutput && !isSignalInput && !isSignalOutput) {
            return undefined;
        }
        const socketMappings =
            kind === "value" ? (direction === "input" ? mapping.inputs?.values : mapping.outputs?.values) : direction === "input" ? mapping.inputs?.flows : mapping.outputs?.flows;
        for (const [sourceName, property] of Object.entries(socketMappings ?? {})) {
            if (property.compatibilityOnly) {
                continue;
            }
            const expectedRole = property.toBlock ? mapping.blocks.indexOf(property.toBlock) : 0;
            if (expectedRole !== blockProvenance.role) {
                continue;
            }
            let inferredSourceName: string | undefined;
            if (sourceName.startsWith("[") && sourceName.endsWith("]")) {
                if (kind !== "flow" || direction !== "input") {
                    continue;
                }
                const [prefix, suffix = ""] = property.name.split("$1");
                if (connection.name.startsWith(prefix) && connection.name.endsWith(suffix)) {
                    inferredSourceName = connection.name.substring(prefix.length, connection.name.length - suffix.length);
                }
            } else if (property.name === connection.name) {
                inferredSourceName = sourceName;
            }
            if (inferredSourceName !== undefined) {
                return {
                    ...blockProvenance,
                    kind,
                    direction,
                    socket: inferredSourceName,
                };
            }
        }
        if (kind === "flow" && direction === "input" && connection.name === "in" && HasDefaultInteractivityFlowInput(logicalNode.operation)) {
            return {
                ...blockProvenance,
                kind,
                direction,
                socket: "in",
            };
        }
        return undefined;
    }

    private _isNoOpFlowTarget(
        graph: IKHRInteractivity_Graph,
        graphAnalysis: IGraphAnalysis,
        flow: NonNullable<IKHRInteractivity_Node["flows"]>[string],
        useCurrentConfiguration: boolean
    ): boolean {
        const targetNode = graph.nodes?.[flow.node];
        const declaration = targetNode ? graph.declarations?.[targetNode.declaration] : undefined;
        if (!declaration) {
            return false;
        }
        const mapping = getMappingForDeclaration(declaration, false);
        if (!mapping) {
            return false;
        }
        const socket = flow.socket ?? "in";
        const fixed = _GetOwn(mapping.inputs?.flows, socket);
        if (fixed && !fixed.compatibilityOnly) {
            return false;
        }
        if (Object.keys(mapping.inputs?.flows ?? {}).some((key) => key.startsWith("[") && key.endsWith("]"))) {
            const targetLogicalNode = graphAnalysis.nodes.find((candidate) => candidate.sourceIndex === flow.node);
            const allowedSockets = this._getAllowedDynamicFlowSockets(targetNode!, mapping, "input", useCurrentConfiguration ? targetLogicalNode : undefined, graph);
            return !!allowedSockets && !allowedSockets.has(socket);
        }
        return !(socket === "in" && HasDefaultInteractivityFlowInput(_FullOperationName(declaration.op, declaration.extension)));
    }

    private _isEffectiveFlowInput(
        graph: IKHRInteractivity_Graph,
        node: IKHRInteractivity_Node,
        logicalNode: ILogicalNode,
        socket: string,
        useCurrentConfiguration: boolean
    ): boolean {
        const mapping = logicalNode.mapping;
        if (!mapping) {
            return true;
        }
        const fixed = _GetOwn(mapping.inputs?.flows, socket);
        if (fixed && !fixed.compatibilityOnly) {
            return true;
        }
        if (Object.keys(mapping.inputs?.flows ?? {}).some((key) => key.startsWith("[") && key.endsWith("]"))) {
            const allowedSockets = this._getAllowedDynamicFlowSockets(node, mapping, "input", useCurrentConfiguration ? logicalNode : undefined, graph);
            return !allowedSockets || allowedSockets.has(socket);
        }
        return socket === "in" && HasDefaultInteractivityFlowInput(logicalNode.operation);
    }

    private _isEffectiveFlowOutput(
        graph: IKHRInteractivity_Graph,
        node: IKHRInteractivity_Node,
        logicalNode: ILogicalNode,
        socket: string,
        useCurrentConfiguration: boolean
    ): boolean {
        const mappings = logicalNode.mapping?.outputs?.flows;
        if (!logicalNode.mapping) {
            return Object.prototype.hasOwnProperty.call(node.flows ?? {}, socket);
        }
        const fixed = _GetOwn(mappings, socket);
        if (fixed && !fixed.compatibilityOnly) {
            return true;
        }
        if (!Object.keys(mappings ?? {}).some((key) => key.startsWith("[") && key.endsWith("]"))) {
            return false;
        }
        const allowedSockets = logicalNode.mapping
            ? this._getAllowedDynamicFlowSockets(node, logicalNode.mapping, "output", useCurrentConfiguration ? logicalNode : undefined, graph)
            : undefined;
        return !allowedSockets || allowedSockets.has(socket);
    }

    private _getAllowedDynamicFlowSockets(
        node: IKHRInteractivity_Node,
        mapping: IGLTFToFlowGraphMapping,
        direction: "input" | "output",
        logicalNode?: ILogicalNode,
        graph?: IKHRInteractivity_Graph
    ): ReadonlySet<string> | undefined {
        for (const [key, property] of Object.entries(mapping.configuration ?? {})) {
            const generatesSockets = direction === "input" ? property.generatesInputFlowSockets : property.generatesOutputFlowSockets;
            if (!generatesSockets) {
                continue;
            }
            const values = graph
                ? _GetEffectiveConfigurationValue(node, mapping, key, property, graph, logicalNode, this._options.sourceGLTF?.nodes?.length)
                : node.configuration?.[key]?.value;
            const effectiveValues = values ?? (Array.isArray(property.defaultValue) ? property.defaultValue : [property.defaultValue]);
            if (direction === "input") {
                const count = typeof effectiveValues[0] === "number" && Number.isInteger(effectiveValues[0]) && effectiveValues[0] >= 0 ? effectiveValues[0] : 0;
                return new Set(Array.from({ length: count }, (_, index) => String(index)));
            }
            return new Set(effectiveValues.filter((value) => value !== undefined).map(String));
        }
        return undefined;
    }

    private _resolveValueTypeIndex(
        graph: IKHRInteractivity_Graph,
        value: IKHRInteractivity_Variable | IKHRInteractivity_OutputSocketReference,
        visited: Set<string>
    ): number | undefined {
        return "node" in value ? this._resolveOutputTypeIndex(graph, value.node, value.socket ?? "value", visited) : value.type;
    }

    private _resolveOutputTypeIndex(graph: IKHRInteractivity_Graph, nodeIndex: number, socket: string, visited: Set<string> = new Set()): number | undefined {
        const key = `${nodeIndex}:${socket}`;
        if (visited.has(key)) {
            return undefined;
        }
        visited.add(key);
        const node = graph.nodes?.[nodeIndex];
        const declaration = node ? graph.declarations?.[node.declaration] : undefined;
        if (!node || !declaration) {
            return undefined;
        }
        const declaredType = declaration.outputValueSockets?.[socket]?.type;
        if (declaredType !== undefined) {
            return declaredType;
        }
        if (declaration.op === "pointer/get" && socket === "value") {
            const type = node.configuration?.type?.value?.[0];
            return typeof type === "number" ? type : undefined;
        }
        if (declaration.op === "variable/get" && socket === "value") {
            const variable = node.configuration?.variable?.value?.[0];
            return typeof variable === "number" ? graph.variables?.[variable]?.type : undefined;
        }
        if (declaration.op === "math/switch" && socket === "value") {
            const defaultValue = node.values?.default;
            return defaultValue ? this._resolveValueTypeIndex(graph, defaultValue, visited) : undefined;
        }
        if (declaration.op === "event/receive" && socket !== "event") {
            const event = node.configuration?.event?.value?.[0];
            return typeof event === "number" ? graph.events?.[event]?.values?.[socket]?.type : undefined;
        }
        const mapping = getMappingForDeclaration(declaration, false);
        const outputMapping = this._getMappingObject(mapping?.outputs?.values, socket);
        const mappedType = outputMapping?.gltfType;
        const signature =
            mappedType === "number"
                ? "float"
                : mappedType === "boolean"
                  ? "bool"
                  : mappedType === "vector2"
                    ? "float2"
                    : mappedType === "vector3"
                      ? "float3"
                      : mappedType === "vector4"
                        ? "float4"
                        : mappedType;
        if (signature && Object.prototype.hasOwnProperty.call(gltfTypeToBabylonType, signature)) {
            const type = graph.types?.findIndex((candidate) => candidate.signature === signature) ?? -1;
            return type >= 0 ? type : undefined;
        }
        const typeSource = outputMapping?.typeSourceInput ? node.values?.[outputMapping.typeSourceInput] : undefined;
        return typeSource ? this._resolveValueTypeIndex(graph, typeSource, visited) : undefined;
    }

    private _isEffectiveValueInput(
        graph: IKHRInteractivity_Graph,
        node: IKHRInteractivity_Node,
        logicalNode: ILogicalNode,
        socket: string,
        useCurrentConfiguration: boolean
    ): boolean {
        const mappings = logicalNode.mapping?.inputs?.values;
        const fixed = _GetOwn(mappings, socket);
        if (fixed && !fixed.compatibilityOnly) {
            return true;
        }
        if (!Object.keys(mappings ?? {}).some((key) => key.startsWith("[") && key.endsWith("]"))) {
            return false;
        }
        const configurationValue = (key: string): unknown[] | undefined => {
            const property = logicalNode.mapping?.configuration?.[key];
            return property
                ? _GetEffectiveConfigurationValue(
                      node,
                      logicalNode.mapping!,
                      key,
                      property,
                      graph,
                      useCurrentConfiguration ? logicalNode : undefined,
                      this._options.sourceGLTF?.nodes?.length
                  )
                : undefined;
        };
        switch (logicalNode.operation) {
            case "debug/log": {
                const message = configurationValue("message")?.[0];
                return typeof message === "string" && ParseDebugLogTemplate(message).sockets.includes(socket);
            }
            case "event/send": {
                const eventIndex = configurationValue("event")?.[0];
                return typeof eventIndex === "number" && Object.prototype.hasOwnProperty.call(graph.events?.[eventIndex]?.values ?? {}, socket);
            }
            case "variable/set":
                return (configurationValue("variables") ?? []).map(String).includes(socket);
            case "math/switch":
                return (configurationValue("cases") ?? []).map(String).includes(socket);
            case "pointer/get":
            case "pointer/set":
            case "pointer/interpolate": {
                const pointer = configurationValue("pointer")?.[0];
                return (
                    typeof pointer === "string" &&
                    pointer.split("/").some(
                        (segment) =>
                            ((segment.startsWith("[") && !segment.startsWith("[[")) || (segment.startsWith("{") && !segment.startsWith("{{"))) &&
                            segment
                                .substring(1, segment.length - 1)
                                .replace(/~1/g, "/")
                                .replace(/~0/g, "~") === socket
                    )
                );
            }
            default:
                return true;
        }
    }

    private _rebuildInputValue(
        graph: IKHRInteractivity_Graph,
        sourceValue: IKHRInteractivity_Variable | IKHRInteractivity_OutputSocketReference,
        input: FlowGraphDataConnection<any>,
        mappingObject: IGLTFToFlowGraphMappingObject | undefined,
        logicalNode: ILogicalNode,
        graphAnalysis: IGraphAnalysis,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): IKHRInteractivity_Variable | IKHRInteractivity_OutputSocketReference {
        let upstream: FlowGraphDataConnection<any> | undefined = input._connectedPoint[0];
        if (input.isConnected() && mappingObject?.convertConnectedTimeToFrames) {
            upstream = this._unwrapAnimationTimeHelper(input, logicalNode, graphAnalysis, diagnostics);
        }
        if (upstream) {
            const provenance = _GetSocketProvenance(upstream);
            if (!provenance || provenance.kind !== "value" || provenance.direction !== "output") {
                _PushDiagnostic(diagnostics, {
                    code: "SOCKET_TARGET_UNREPRESENTABLE",
                    graphIndex: graphAnalysis.graphIndex,
                    nodeIndex: logicalNode.sourceIndex,
                    path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/values`,
                    message: `Value input is connected to a block without representable KHR output provenance.`,
                });
                return sourceValue;
            }
            const rebuiltReference = _CloneJson(sourceValue) as IKHRInteractivity_OutputSocketReference & { value?: unknown };
            delete rebuiltReference.value;
            rebuiltReference.node = provenance.nodeIndex;
            if (provenance.socket === "value") {
                delete rebuiltReference.socket;
            } else {
                rebuiltReference.socket = provenance.socket;
            }
            if (rebuiltReference.type !== undefined) {
                const rebuiltType = this._resolveOutputTypeIndex(graph, provenance.nodeIndex, provenance.socket);
                if (rebuiltType !== undefined) {
                    rebuiltReference.type = rebuiltType;
                }
            }
            return rebuiltReference;
        }
        const socketProvenance = _GetSocketProvenance(input);
        const current = _NormalizeValue((input as any)._defaultValue);
        if (!input.isConnected() && socketProvenance?.runtimeValue && _ValuesEqual(current, socketProvenance.runtimeValue) && socketProvenance.sourceValue) {
            return _CloneJson(socketProvenance.sourceValue);
        }
        const canonicalSource = socketProvenance?.sourceValue ?? sourceValue;
        const type = canonicalSource.type ?? _GetOrAddInputTypeIndex(graph, input, mappingObject, logicalNode, socketProvenance?.socket ?? input.name);
        if (type === undefined || !graph.types?.[type]) {
            _PushDiagnostic(diagnostics, {
                code: "VALUE_UNREPRESENTABLE",
                graphIndex: graphAnalysis.graphIndex,
                nodeIndex: logicalNode.sourceIndex,
                path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/values`,
                message: "A newly inlined value has no canonical KHR type.",
            });
            return sourceValue;
        }
        const original = "node" in canonicalSource ? undefined : canonicalSource;
        const expected = original ? _GetSourceValue(graph, original, mappingObject, this._options.targetFps ?? 60) : undefined;
        if (_ValuesEqual(current, expected)) {
            return _CloneJson(canonicalSource);
        }
        if (!current) {
            _PushDiagnostic(diagnostics, {
                code: "VALUE_UNREPRESENTABLE",
                graphIndex: graphAnalysis.graphIndex,
                nodeIndex: logicalNode.sourceIndex,
                path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/values`,
                message: "The FlowGraph input value cannot be converted to a KHR value array.",
            });
            return sourceValue;
        }
        if (mappingObject?.convertConnectedTimeToFrames && current.length === 1 && typeof current[0] === "number") {
            current[0] /= this._options.targetFps ?? 60;
        }
        const rebuiltValue = _CloneJson(canonicalSource) as IKHRInteractivity_Variable & Partial<IKHRInteractivity_OutputSocketReference>;
        delete rebuiltValue.node;
        delete rebuiltValue.socket;
        rebuiltValue.type = type;
        rebuiltValue.value = current as NonNullable<IKHRInteractivity_Variable["value"]>;
        return rebuiltValue;
    }

    private _unwrapAnimationTimeHelper(
        input: FlowGraphDataConnection<any>,
        logicalNode: ILogicalNode,
        graphAnalysis: IGraphAnalysis,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): FlowGraphDataConnection<any> | undefined {
        const graphIndex = graphAnalysis.graphIndex;
        const helperOutput = input._connectedPoint[0];
        const helperBlock = helperOutput?._ownerBlock;
        const helperProvenance = helperBlock ? _GetBlockProvenance(helperBlock) : undefined;
        if (!helperBlock || helperBlock.getClassName() !== "FlowGraphMultiplyBlock" || helperProvenance?.role !== -1 || helperProvenance.nodeIndex !== logicalNode.sourceIndex) {
            _PushDiagnostic(diagnostics, {
                code: "COMPOSITE_CONNECTION_CHANGED",
                graphIndex,
                nodeIndex: logicalNode.sourceIndex,
                blockId: helperBlock?.uniqueId,
                path: `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}`,
                message: "The generated seconds-to-frames animation helper was changed.",
            });
            return undefined;
        }
        const source = helperBlock.dataInputs.find((connection) => connection.name === "a")?._connectedPoint[0];
        const factor = helperBlock.dataInputs.find((connection) => connection.name === "b");
        const expectedFactor = this._options.targetFps ?? 60;
        const factorValue = factor ? (factor as any)._defaultValue : undefined;
        if (!factor || factor.isConnected() || _NormalizeValue(factorValue)?.[0] !== expectedFactor) {
            _PushDiagnostic(diagnostics, {
                code: "COMPOSITE_CONNECTION_CHANGED",
                graphIndex,
                nodeIndex: logicalNode.sourceIndex,
                blockId: helperBlock.uniqueId,
                path: `/blocks/${helperBlock.uniqueId}`,
                message: `Animation time helper must multiply by the target frame rate (${expectedFactor}).`,
            });
        }
        return source;
    }

    private _rebuildConfiguration(
        graph: IKHRInteractivity_Graph,
        node: IKHRInteractivity_Node,
        logicalNode: ILogicalNode,
        graphIndex: number,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): void {
        const changedConfigurationGroups = new Set<string>();
        const fallbackConfigurationGroups = new Set<string>();
        for (const [key, property] of Object.entries(logicalNode.mapping?.configuration ?? {})) {
            if (!property.configurationGroup) {
                continue;
            }
            const block = _GetConfigurationBlock(logicalNode, property);
            const provenance = _GetConfigurationProvenance(logicalNode, key, property);
            if (provenance && !_JsonEquivalent(block?.config?.[property.name], provenance.runtimeValue)) {
                changedConfigurationGroups.add(property.configurationGroup);
            }
            if (!_IsValidConfigurationValue(provenance?.sourceValue, property, graph, this._options.sourceGLTF?.nodes?.length)) {
                fallbackConfigurationGroups.add(property.configurationGroup);
            }
        }
        for (const [key, property] of Object.entries(logicalNode.mapping?.configuration ?? {})) {
            const groupChanged = !!property.configurationGroup && changedConfigurationGroups.has(property.configurationGroup);
            const groupUsedFallback = !!property.configurationGroup && fallbackConfigurationGroups.has(property.configurationGroup);
            const provenance = _GetConfigurationProvenance(logicalNode, key, property);
            const preserveUnexposedValidMember =
                groupChanged &&
                !groupUsedFallback &&
                provenance !== undefined &&
                provenance.runtimeValue === undefined &&
                _IsValidConfigurationValue(provenance.sourceValue, property, graph, this._options.sourceGLTF?.nodes?.length);
            let current = _GetMappedConfigurationValue(logicalNode, key, property, graph, !groupChanged || preserveUnexposedValidMember);
            if (groupChanged && current === undefined && property.defaultValue !== undefined) {
                current = _NormalizeValue(property.defaultValue);
            }
            const source = node.configuration?.[key]?.value;
            if (property.validationOnly && current === undefined && provenance?.runtimeValue === undefined) {
                continue;
            }
            if (groupChanged && !_IsValidConfigurationValue(current, property, graph, this._options.sourceGLTF?.nodes?.length)) {
                _PushDiagnostic(diagnostics, {
                    code: "CONFIGURATION_UNREPRESENTABLE",
                    graphIndex,
                    nodeIndex: logicalNode.sourceIndex,
                    path: `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/configuration/${key}`,
                    message: `Edited configuration group "${property.configurationGroup}" does not contain a valid value for "${key}".`,
                });
                continue;
            }
            if (!current) {
                if (source !== undefined || property.required) {
                    _PushDiagnostic(diagnostics, {
                        code: "CONFIGURATION_UNREPRESENTABLE",
                        graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        path: `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/configuration/${key}`,
                        message: `Configuration "${key}" cannot be inverted from the edited FlowGraph composite.`,
                    });
                }
                continue;
            }
            if (property.indexSource === "events" && current.length === 1 && typeof current[0] === "number") {
                const event = graph.events?.[current[0]];
                const block = _GetConfigurationBlock(logicalNode, property);
                const runtimeEventData = NormalizeInteractivityEventDataConfiguration(block?.config?.eventData);
                const runtimeSchema = runtimeEventData === undefined ? [] : runtimeEventData;
                const eventSchema = Object.entries(event?.values ?? {})
                    .map(([id, value]) => ({
                        id,
                        type: gltfTypeToBabylonType[graph.types?.[value.type]?.signature ?? ""]?.flowGraphType,
                        ...(value.value === undefined ? {} : { value: value.value.slice() }),
                    }))
                    .sort((left, right) => left.id.localeCompare(right.id));
                if (!_JsonEquivalent(runtimeSchema, eventSchema)) {
                    _PushDiagnostic(diagnostics, {
                        code: "CONFIGURATION_UNREPRESENTABLE",
                        graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        path: `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/configuration/${key}`,
                        message: `The runtime custom-event payload schema does not match event index ${current[0]}.`,
                    });
                    continue;
                }
            }
            const preservesFallback =
                provenance &&
                _JsonEquivalent(_GetConfigurationBlock(logicalNode, property)?.config?.[property.name], provenance.runtimeValue) &&
                !_IsValidConfigurationValue(provenance.sourceValue, property, graph, this._options.sourceGLTF?.nodes?.length);
            if (!preservesFallback && property.indexSource === "assetNodes" && current.length === 1 && typeof current[0] === "number") {
                const sourceNode = this._options.sourceGLTF?.nodes?.[current[0]]?._babylonTransformNode;
                const remapped = sourceNode ? context.getNodeIndex(sourceNode) : undefined;
                if (remapped === undefined) {
                    _PushDiagnostic(diagnostics, {
                        code: "REFERENCE_UNRESOLVED",
                        graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        path: `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/configuration/${key}`,
                        message: `Referenced glTF node ${current[0]} was not exported.`,
                    });
                    continue;
                }
                current[0] = remapped;
            }
            if (source === undefined && property.defaultValue !== undefined && _ValuesEqual(current, _NormalizeValue(property.defaultValue))) {
                continue;
            }
            node.configuration ??= {};
            const rebuiltConfiguration = node.configuration[key] ? _CloneJson(node.configuration[key]) : {};
            rebuiltConfiguration.value = current as NonNullable<IKHRInteractivity_Configuration["value"]>;
            _SetOwnProperty(node.configuration, key, rebuiltConfiguration);
        }
    }

    private _remapPointerTemplateInputs(
        graph: IKHRInteractivity_Graph,
        node: IKHRInteractivity_Node,
        logicalNode: ILogicalNode,
        graphIndex: number,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): void {
        for (const [key, property] of Object.entries(logicalNode.mapping?.configuration ?? {})) {
            if (!property.pointerTemplate) {
                continue;
            }
            const pointer = node.configuration?.[key]?.value?.[0];
            if (typeof pointer !== "string") {
                continue;
            }
            const segments = pointer.split("/");
            if (segments[0] !== "" || segments.length < 3) {
                continue;
            }
            let collection = segments[1].replace(/~1/g, "/").replace(/~0/g, "~");
            const rootPlaceholder = /^\{([^\{\}]+)\}$/.exec(segments[1]);
            if (rootPlaceholder) {
                const rootSocket = node.values?.[rootPlaceholder[1]];
                const rootReference = rootSocket && !("node" in rootSocket) ? rootSocket.value?.[0] : undefined;
                const rootMatch = typeof rootReference === "string" ? /^\/([^/]+)$/.exec(rootReference) : undefined;
                collection = rootMatch?.[1] ?? "";
                if (!_KnownIndexedRootCollections.has(collection)) {
                    _PushDiagnostic(diagnostics, {
                        code: "REFERENCE_UNRESOLVED",
                        graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        socket: rootPlaceholder[1],
                        path: `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/values/${rootPlaceholder[1]}`,
                        message: `Root collection template input "${rootPlaceholder[1]}" cannot be resolved statically for export.`,
                    });
                    continue;
                }
            }
            if (!_KnownIndexedRootCollections.has(collection)) {
                continue;
            }
            const indexPlaceholder = /^\[([^\[\]]+)\]$/.exec(segments[2]);
            const referenceIndexPlaceholder = /^\{([^\{\}]+)\}$/.exec(segments[2]);
            const hasTemplateCollection = !!rootPlaceholder || !!indexPlaceholder || !!referenceIndexPlaceholder;
            if (
                hasTemplateCollection &&
                !this._validateExtensionReferencePreservation(
                    pointer,
                    collection,
                    diagnostics,
                    graphIndex,
                    logicalNode.sourceIndex,
                    `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/configuration/${key}`
                )
            ) {
                continue;
            }
            if (indexPlaceholder) {
                const socket = node.values?.[indexPlaceholder[1]];
                const path = `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/values/${indexPlaceholder[1]}`;
                if (!socket || "node" in socket) {
                    _PushDiagnostic(diagnostics, {
                        code: "REFERENCE_UNRESOLVED",
                        graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        socket: indexPlaceholder[1],
                        path,
                        message: `Dynamic index template input "${indexPlaceholder[1]}" cannot be safely remapped for the exported ${collection} array.`,
                    });
                    continue;
                }
                const sourceIndex = socket.value?.[0];
                const remapped =
                    typeof sourceIndex === "number" && Number.isInteger(sourceIndex)
                        ? this._getRemappedRootIndex(collection as KhrInteractivityRootCollection, sourceIndex, context)
                        : undefined;
                if (remapped === undefined) {
                    _PushDiagnostic(diagnostics, {
                        code: "REFERENCE_UNRESOLVED",
                        graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        socket: indexPlaceholder[1],
                        path,
                        message: `Template input "${indexPlaceholder[1]}" does not resolve to an exported ${collection} element.`,
                    });
                    continue;
                }
                socket.value = [remapped];
            } else if (rootPlaceholder && /^(0|[1-9]\d*)$/.test(segments[2])) {
                const sourceIndex = parseInt(segments[2], 10);
                const remapped = this._getRemappedRootIndex(collection as KhrInteractivityRootCollection, sourceIndex, context);
                if (remapped === undefined) {
                    _PushDiagnostic(diagnostics, {
                        code: "REFERENCE_UNRESOLVED",
                        graphIndex,
                        nodeIndex: logicalNode.sourceIndex,
                        path: `/graphs/${graphIndex}/nodes/${logicalNode.sourceIndex}/configuration/${key}`,
                        message: `Static ${collection} index ${sourceIndex} does not resolve to an exported element.`,
                    });
                } else {
                    segments[2] = String(remapped);
                    node.configuration![key].value![0] = segments.join("/");
                }
            }
        }
    }

    private _updateVariables(graph: IKHRInteractivity_Graph, flowGraph: FlowGraph, diagnostics: IKHRInteractivityExportDiagnostic[], graphIndex: number): void {
        const provenance = flowGraph.metadata?.khrInteractivity as IKHRInteractivityGraphProvenance | undefined;
        if (provenance?.authoredVariableStructureChanged) {
            _PushDiagnostic(diagnostics, {
                code: "VALUE_UNREPRESENTABLE",
                graphIndex,
                path: `/graphs/${graphIndex}/variables`,
                message: "Adding, renaming, or deleting variables from an imported KHR_interactivity graph is not supported by lossless export.",
            });
        }
        const authoredValues = provenance?.authoredVariableValues;
        const authoredTypes = provenance?.authoredVariableTypes;
        if (!authoredValues && !authoredTypes) {
            return;
        }
        for (const [indexText, flowGraphType] of Object.entries(authoredTypes ?? {})) {
            const index = Number(indexText);
            const variable = graph.variables?.[index];
            const type = _GetOrAddVariableTypeIndex(graph, flowGraphType);
            if (!variable || type === undefined) {
                _PushDiagnostic(diagnostics, {
                    code: "VALUE_UNREPRESENTABLE",
                    graphIndex,
                    path: `/graphs/${graphIndex}/variables/${index}/type`,
                    message: `Authored variable type "${flowGraphType}" cannot be represented by KHR_interactivity.`,
                });
                continue;
            }
            variable.type = type;
        }
        for (const [indexText, authoredValue] of Object.entries(authoredValues ?? {})) {
            const index = Number(indexText);
            const variable = graph.variables![index];
            if (!variable) {
                _PushDiagnostic(diagnostics, {
                    code: "VALUE_UNREPRESENTABLE",
                    graphIndex,
                    path: `/graphs/${graphIndex}/variables/${index}`,
                    message: `Authored variable index ${index} does not exist in the canonical graph.`,
                });
                continue;
            }
            const normalized = _NormalizeValue(authoredValue);
            const signature = graph.types?.[variable.type]?.signature;
            if (!normalized || !signature) {
                continue;
            }
            variable.value = normalized as NonNullable<IKHRInteractivity_Variable["value"]>;
        }
    }

    private _remapValueArray(
        value: unknown[],
        signature: string,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number,
        nodeIndex?: number,
        referenceHint?: string | null
    ): NonNullable<IKHRInteractivity_Variable["value"]> {
        if (signature !== "ref") {
            return value as NonNullable<IKHRInteractivity_Variable["value"]>;
        }
        return value.map((entry) => {
            if (typeof entry === "string") {
                const hintedCollection = referenceHint?.match(/^\/([^/]+)\//)?.[1];
                if (hintedCollection && _KnownIndexedRootCollections.has(hintedCollection)) {
                    return this._remapReferenceToCollection(entry, hintedCollection, context, diagnostics, graphIndex, nodeIndex);
                }
                return this._remapReference(entry, context, diagnostics, graphIndex, nodeIndex);
            }
            if (entry !== null && typeof entry === "object") {
                const hintedCollection = referenceHint?.match(/^\/([^/]+)\//)?.[1];
                if (hintedCollection && _KnownIndexedRootCollections.has(hintedCollection) && context.getRootIndex) {
                    const index = context.getRootIndex(hintedCollection as KhrInteractivityRootCollection, entry);
                    if (index !== undefined) {
                        return `/${hintedCollection}/${index}`;
                    }
                }
                const candidates: [string, number | undefined][] = [
                    ["animations", context.getAnimationIndex(entry as AnimationGroup)],
                    ["cameras", context.getCameraIndex(entry as Camera)],
                    ["materials", context.getMaterialIndex(entry as Material)],
                    ["nodes", context.getNodeIndex(entry as Node)],
                ];
                const matches = (hintedCollection ? candidates.filter(([collection]) => collection === hintedCollection) : referenceHint === null ? [] : candidates).filter(
                    ([, index]) => index !== undefined
                );
                if (matches.length === 1) {
                    return `/${matches[0][0]}/${matches[0][1]}`;
                }
                if (this._isPreflight) {
                    return "";
                }
            }
            _PushDiagnostic(diagnostics, {
                code: "REFERENCE_UNRESOLVED",
                graphIndex,
                nodeIndex,
                path: `/graphs/${graphIndex}${nodeIndex === undefined ? "" : `/nodes/${nodeIndex}`}`,
                message: "An authored reference value does not resolve to an exported glTF entity.",
            });
            return "";
        }) as NonNullable<IKHRInteractivity_Variable["value"]>;
    }

    private _topologicallyOrderNodes(nodes: IKHRInteractivity_Node[], graphIndex: number, diagnostics: IKHRInteractivityExportDiagnostic[]): IOrderedNodes | undefined {
        const outgoing = nodes.map(() => new Set<number>());
        const indegree = nodes.map(() => 0);
        let hasInvalidDependency = false;
        const addEdge = (source: number, target: number) => {
            if (source < 0 || target < 0 || source >= nodes.length || target >= nodes.length) {
                hasInvalidDependency = true;
                _PushDiagnostic(diagnostics, {
                    code: "SOCKET_TARGET_UNREPRESENTABLE",
                    graphIndex,
                    path: `/graphs/${graphIndex}/nodes`,
                    message: `Dependency ${source} -> ${target} references a node outside the exported graph.`,
                });
                return;
            }
            if (source === target) {
                hasInvalidDependency = true;
                _PushDiagnostic(diagnostics, {
                    code: "DEPENDENCY_CYCLE",
                    graphIndex,
                    nodeIndex: source,
                    path: `/graphs/${graphIndex}/nodes/${source}`,
                    message: "A KHR_interactivity node cannot depend on itself.",
                });
                return;
            }
            if (outgoing[source].has(target)) {
                return;
            }
            outgoing[source].add(target);
            indegree[target]++;
        };
        for (let target = 0; target < nodes.length; target++) {
            for (const value of Object.values(nodes[target].values ?? {})) {
                if ("node" in value) {
                    addEdge(value.node, target);
                }
            }
            for (const flow of Object.values(nodes[target].flows ?? {})) {
                addEdge(target, flow.node);
            }
        }
        if (hasInvalidDependency) {
            return undefined;
        }
        const ready = indegree.flatMap((count, index) => (count === 0 ? [index] : []));
        const order: number[] = [];
        while (ready.length > 0) {
            ready.sort((left, right) => left - right);
            const current = ready.shift()!;
            order.push(current);
            for (const target of outgoing[current]) {
                indegree[target]--;
                if (indegree[target] === 0) {
                    ready.push(target);
                }
            }
        }
        if (order.length !== nodes.length) {
            _PushDiagnostic(diagnostics, {
                code: "DEPENDENCY_CYCLE",
                graphIndex,
                path: `/graphs/${graphIndex}/nodes`,
                message: "Value and flow dependencies form a cycle that cannot satisfy KHR_interactivity node ordering constraints.",
            });
            return undefined;
        }
        const remap = new Map(order.map((oldIndex, newIndex) => [oldIndex, newIndex]));
        const ordered = order.map((index) => nodes[index]);
        for (const node of ordered) {
            for (const value of Object.values(node.values ?? {})) {
                if ("node" in value) {
                    value.node = remap.get(value.node)!;
                }
            }
            for (const flow of Object.values(node.flows ?? {})) {
                flow.node = remap.get(flow.node)!;
            }
        }
        return { nodes: ordered, sourceIndices: order };
    }

    private _remapGraphReferences(
        graph: IKHRInteractivity_Graph,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number,
        sourceIndices: readonly number[]
    ): void {
        for (let variableIndex = 0; variableIndex < (graph.variables?.length ?? 0); variableIndex++) {
            const variable = graph.variables![variableIndex];
            if (graph.types?.[variable.type]?.signature === "ref" && variable.value) {
                const sourceValue = this._options.document?.graphs[graphIndex]?.source.variables?.[variableIndex]?.value?.[0];
                const currentValue = variable.value[0];
                const consumerCollection = this._getVariableReferenceCollection(graph, variableIndex);
                const referenceHint =
                    consumerCollection === null
                        ? null
                        : consumerCollection
                          ? `/${consumerCollection}/0`
                          : typeof currentValue === "object" || currentValue === sourceValue
                            ? typeof sourceValue === "string"
                                ? sourceValue
                                : undefined
                            : undefined;
                variable.value = this._remapValueArray(variable.value, "ref", context, diagnostics, graphIndex, undefined, referenceHint);
            }
        }

        for (const event of graph.events ?? []) {
            for (const value of Object.values(event.values ?? {})) {
                if (graph.types?.[value.type]?.signature === "ref" && value.value) {
                    value.value = this._remapValueArray(value.value, "ref", context, diagnostics, graphIndex);
                }
            }
        }
        for (let nodeIndex = 0; nodeIndex < (graph.nodes?.length ?? 0); nodeIndex++) {
            const node = graph.nodes![nodeIndex];
            const sourceNodeIndex = sourceIndices[nodeIndex] ?? nodeIndex;
            const declaration = graph.declarations?.[node.declaration];
            const mapping = declaration ? getMappingForDeclaration(declaration, false) : undefined;
            for (const [socket, value] of Object.entries(node.values ?? {})) {
                if (!("node" in value) && graph.types?.[value.type]?.signature === "ref" && value.value) {
                    const pointerCollection = this._getPointerReferenceCollection(node, mapping, socket);
                    if (pointerCollection === null) {
                        _PushDiagnostic(diagnostics, {
                            code: "REFERENCE_UNRESOLVED",
                            graphIndex,
                            nodeIndex: sourceNodeIndex,
                            socket,
                            path: `/graphs/${graphIndex}/nodes/${sourceNodeIndex}/values/${socket}`,
                            message: `Pointer template collection for reference input "${socket}" cannot be resolved statically.`,
                        });
                        continue;
                    }
                    const sourceValue = this._options.document?.graphs[graphIndex]?.source.nodes?.[sourceNodeIndex]?.values?.[socket];
                    const sourceReference = sourceValue && !("node" in sourceValue) ? sourceValue.value?.[0] : undefined;
                    const currentReference = value.value[0];
                    const referenceHint = pointerCollection
                        ? `/${pointerCollection}/0`
                        : typeof currentReference === "object" || currentReference === sourceReference
                          ? typeof sourceReference === "string"
                              ? sourceReference
                              : undefined
                          : undefined;
                    value.value = this._remapValueArray(value.value, "ref", context, diagnostics, graphIndex, sourceNodeIndex, referenceHint);
                }
            }
            for (const [key, property] of Object.entries(mapping?.configuration ?? {})) {
                if (!property.pointerTemplate) {
                    continue;
                }
                const configuration = node.configuration?.[key];
                if (configuration?.value) {
                    configuration.value = configuration.value.map((value) =>
                        typeof value === "string" ? this._remapReference(value, context, diagnostics, graphIndex, sourceNodeIndex) : value
                    );
                }
            }
        }
    }

    private _getVariableReferenceCollection(graph: IKHRInteractivity_Graph, variableIndex: number): string | null | undefined {
        const getterNodes = new Set<number>();
        for (let nodeIndex = 0; nodeIndex < (graph.nodes?.length ?? 0); nodeIndex++) {
            const node = graph.nodes![nodeIndex];
            const declaration = graph.declarations?.[node.declaration];
            if (declaration?.op === "variable/get" && !declaration.extension && node.configuration?.variable?.value?.[0] === variableIndex) {
                getterNodes.add(nodeIndex);
            }
        }
        const collections = new Set<string>();
        for (const node of graph.nodes ?? []) {
            const declaration = graph.declarations?.[node.declaration];
            const mapping = declaration ? getMappingForDeclaration(declaration, false) : undefined;
            for (const [socket, value] of Object.entries(node.values ?? {})) {
                if (!("node" in value) || !getterNodes.has(value.node)) {
                    continue;
                }
                const collection = this._getPointerReferenceCollection(node, mapping, socket);
                if (collection === null) {
                    return null;
                }
                if (collection) {
                    collections.add(collection);
                }
            }
        }
        return collections.size === 1 ? collections.values().next().value : collections.size > 1 ? null : undefined;
    }

    private _getPointerReferenceCollection(node: IKHRInteractivity_Node, mapping: IGLTFToFlowGraphMapping | undefined, socket: string): string | null | undefined {
        for (const [key, property] of Object.entries(mapping?.configuration ?? {})) {
            if (!property.pointerTemplate) {
                continue;
            }
            const pointer = node.configuration?.[key]?.value?.[0];
            if (typeof pointer !== "string") {
                continue;
            }
            const segments = pointer.split("/");
            const placeholderIndex = segments.findIndex((segment) => segment === `{${socket}}`);
            if (placeholderIndex > 1) {
                const parentSegment = segments[placeholderIndex - 1];
                const parentPlaceholder = /^\{([^\{\}]+)\}$/.exec(parentSegment);
                const parentValue = parentPlaceholder ? node.values?.[parentPlaceholder[1]] : undefined;
                const parentReference = parentValue && !("node" in parentValue) ? parentValue.value?.[0] : undefined;
                const collection = (parentPlaceholder && typeof parentReference === "string" ? (/^\/([^/]+)$/.exec(parentReference)?.[1] ?? "") : parentSegment)
                    .replace(/~1/g, "/")
                    .replace(/~0/g, "~");
                if (_KnownIndexedRootCollections.has(collection)) {
                    return collection;
                }
                if (parentPlaceholder) {
                    return null;
                }
            }
        }
        return undefined;
    }

    private _getRemappedRootIndex(collection: KhrInteractivityRootCollection, sourceIndex: number, context: IKHRInteractivitySerializerContext): number | undefined {
        const indices = new Set(
            this._getSourceRootObjects(collection, sourceIndex)
                .map((target) => this._getExportedObjectIndex(collection, target, context))
                .filter((index): index is number => index !== undefined)
        );
        return indices.size === 1 ? indices.values().next().value : undefined;
    }

    private _getSourceRootObjects(collection: KhrInteractivityRootCollection, sourceIndex: number): object[] {
        const sourceGLTF = this._options.sourceGLTF;
        switch (collection) {
            case "nodes":
                return sourceGLTF?.nodes?.[sourceIndex]?._babylonTransformNode ? [sourceGLTF.nodes[sourceIndex]._babylonTransformNode!] : [];
            case "animations":
                return sourceGLTF?.animations?.[sourceIndex]?._babylonAnimationGroup ? [sourceGLTF.animations[sourceIndex]._babylonAnimationGroup!] : [];
            case "cameras":
                return sourceGLTF?.cameras?.[sourceIndex]?._babylonCamera ? [sourceGLTF.cameras[sourceIndex]._babylonCamera!] : [];
            case "materials":
                return Array.from(new Set(Object.values(sourceGLTF?.materials?.[sourceIndex]?._data ?? {}).map((entry) => entry.babylonMaterial)));
            case "meshes":
                return Array.from(
                    new Set([
                        ...(sourceGLTF?.meshes?.[sourceIndex]?.primitives.flatMap((primitive) => (primitive._instanceData ? [primitive._instanceData.babylonSourceMesh] : [])) ??
                            []),
                        ...(sourceGLTF?.nodes
                            ?.filter((node) => node.mesh === sourceIndex)
                            .flatMap((node) => [...(node._babylonTransformNode ? [node._babylonTransformNode] : []), ...(node._primitiveBabylonMeshes ?? [])]) ?? []),
                    ])
                );
            case "textures":
                return sourceGLTF?.textures?.[sourceIndex]?._babylonTextures?.slice() ?? [];
            case "images":
                return Array.from(
                    new Set(
                        sourceGLTF?.textures
                            ?.flatMap((texture) => texture._babylonTextureSources ?? [])
                            .filter((source) => source.imageIndex === sourceIndex)
                            .map((source) => source.babylonTexture) ?? []
                    )
                );
            case "samplers":
                return Array.from(
                    new Set(
                        sourceGLTF?.textures
                            ?.flatMap((texture) => texture._babylonTextureSources ?? [])
                            .filter((source) => source.samplerIndex === sourceIndex)
                            .map((source) => source.babylonTexture) ?? []
                    )
                );
            case "skins":
                return sourceGLTF?.skins?.[sourceIndex]?._data?.babylonSkeleton ? [sourceGLTF.skins[sourceIndex]._data!.babylonSkeleton] : [];
            case "scenes":
                return sourceIndex === (sourceGLTF?.scene ?? 0) && this._flowGraphs[0]?.scene ? [this._flowGraphs[0].scene] : [];
        }
    }

    private _getSourceRootIndex(collection: KhrInteractivityRootCollection, target: object): number | undefined {
        const roots = this._options.sourceGLTF?.[collection];
        if (!roots) {
            return undefined;
        }
        const matches: number[] = [];
        for (let index = 0; index < roots.length; index++) {
            if (this._getSourceRootObjects(collection, index).includes(target)) {
                matches.push(index);
            }
        }
        return matches.length === 1 ? matches[0] : undefined;
    }

    private _getExportedObjectIndex(collection: KhrInteractivityRootCollection, target: object, context: IKHRInteractivitySerializerContext): number | undefined {
        if (context.getRootIndex) {
            return context.getRootIndex(collection, target);
        }
        switch (collection) {
            case "nodes":
                return context.getNodeIndex(target as Node);
            case "animations":
                return context.getAnimationIndex(target as AnimationGroup);
            case "cameras":
                return context.getCameraIndex(target as Camera);
            case "materials":
                return context.getMaterialIndex(target as Material);
            default:
                return undefined;
        }
    }

    private _remapReferenceToCollection(
        reference: string,
        targetCollection: string,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number,
        nodeIndex?: number
    ): string {
        if (!this._validateExtensionReferencePreservation(reference, targetCollection, diagnostics, graphIndex, nodeIndex)) {
            return reference;
        }
        const match = reference.match(/^\/([^/]+)\/(0|[1-9]\d*)(\/.*)?$/);
        if (!match || !_KnownIndexedRootCollections.has(match[1])) {
            return this._remapReference(reference, context, diagnostics, graphIndex, nodeIndex);
        }
        const targets = this._getSourceRootObjects(targetCollection as KhrInteractivityRootCollection, parseInt(match[2], 10));
        const targetIndices = new Set(
            targets
                .map((target) => this._getExportedObjectIndex(targetCollection as KhrInteractivityRootCollection, target, context))
                .filter((index): index is number => index !== undefined)
        );
        const targetIndex = targetIndices.size === 1 ? targetIndices.values().next().value : undefined;
        if (targetIndex === undefined) {
            _PushDiagnostic(diagnostics, {
                code: "REFERENCE_UNRESOLVED",
                graphIndex,
                nodeIndex,
                path: `/graphs/${graphIndex}${nodeIndex === undefined ? "" : `/nodes/${nodeIndex}`}`,
                message: `Reference "${reference}" cannot be remapped to the exported ${targetCollection} collection.`,
            });
            return reference;
        }
        return `/${targetCollection}/${targetIndex}${match[3] ?? ""}`;
    }

    private _remapReference(
        reference: string,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number,
        nodeIndex?: number
    ): string {
        if (!reference || reference.startsWith("/extensions/KHR_interactivity/events/") || reference.startsWith("/extensions/KHR_interactivity/delays/")) {
            return reference;
        }
        const extensionCollection = /^\/extensions\/([^/]+)\/[^/]+\/(0|[1-9]\d*)(?:\/|$)/.exec(reference);
        if (extensionCollection && extensionCollection[1] !== "KHR_interactivity") {
            _PushDiagnostic(diagnostics, {
                code: "REFERENCE_UNRESOLVED",
                graphIndex,
                nodeIndex,
                path: `/graphs/${graphIndex}${nodeIndex === undefined ? "" : `/nodes/${nodeIndex}`}`,
                message: `Indexed reference "${reference}" belongs to ${extensionCollection[1]}, whose serializer index mapping is unavailable.`,
            });
            return reference;
        }
        const match = reference.match(/^\/([^/]+)\/(0|[1-9]\d*)(\/.*)?$/);
        if (!match || !_KnownIndexedRootCollections.has(match[1])) {
            return reference;
        }
        if (!this._validateExtensionReferencePreservation(reference, match[1], diagnostics, graphIndex, nodeIndex)) {
            return reference;
        }
        const collection = match[1];
        const sourceIndex = parseInt(match[2], 10);
        const targetIndex = this._getRemappedRootIndex(collection as KhrInteractivityRootCollection, sourceIndex, context);
        if (targetIndex === undefined) {
            _PushDiagnostic(diagnostics, {
                code: "REFERENCE_UNRESOLVED",
                graphIndex,
                nodeIndex,
                path: `/graphs/${graphIndex}${nodeIndex === undefined ? "" : `/nodes/${nodeIndex}`}`,
                message: `Reference "${reference}" cannot be remapped because its ${collection} target was not exported uniquely.`,
            });
            return reference;
        }
        return `/${collection}/${targetIndex}${match[3] ?? ""}`;
    }

    private _validateExtensionReferencePreservation(
        reference: string,
        resolvedCollection: string,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number,
        nodeIndex?: number,
        path = `/graphs/${graphIndex}${nodeIndex === undefined ? "" : `/nodes/${nodeIndex}`}`
    ): boolean {
        const nestedExtensions = _GetPointerExtensionNames(reference).filter((extension) => extension !== "KHR_interactivity");
        if (nestedExtensions.length === 0 || _CanPreserveNestedExtensionPointer(reference, resolvedCollection)) {
            return true;
        }
        _PushDiagnostic(diagnostics, {
            code: "REFERENCE_UNRESOLVED",
            graphIndex,
            nodeIndex,
            path,
            message: `Reference "${reference}" observes extension-backed data (${nestedExtensions.join(
                ", "
            )}) that the serializer cannot guarantee will retain its source semantics.`,
        });
        return false;
    }

    private _collectAdditionalExtensions(): string[] {
        const extensions = new Set<string>();
        const collectReferenceExtension = (value: unknown): void => {
            if (typeof value !== "string") {
                return;
            }
            for (const extensionName of _GetPointerExtensionNames(value)) {
                if (extensionName !== "KHR_interactivity") {
                    extensions.add(extensionName);
                }
            }
        };
        const collectPropertyExtensions = (value: unknown): void => {
            if (Array.isArray(value)) {
                value.forEach(collectPropertyExtensions);
                return;
            }
            if (value === null || typeof value !== "object") {
                return;
            }
            const object = value as Record<string, unknown>;
            for (const [key, entry] of Object.entries(object)) {
                if (key === "extras") {
                    continue;
                }
                if (key === "extensions" && entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
                    for (const [extensionName, extensionPayload] of Object.entries(entry as Record<string, unknown>)) {
                        if (extensionName !== "KHR_interactivity") {
                            extensions.add(extensionName);
                        }
                        collectPropertyExtensions(extensionPayload);
                    }
                    continue;
                }
                if (key !== "extensions") {
                    collectPropertyExtensions(entry);
                }
            }
        };
        collectPropertyExtensions(this._options.document?.source);
        for (const analysis of this._graphAnalyses) {
            collectPropertyExtensions(analysis.source);
            for (const variable of analysis.source.variables ?? []) {
                if (analysis.source.types?.[variable.type]?.signature === "ref") {
                    variable.value?.forEach(collectReferenceExtension);
                }
            }
            for (const event of analysis.source.events ?? []) {
                for (const value of Object.values(event.values ?? {})) {
                    if (value && typeof value === "object" && analysis.source.types?.[value.type]?.signature === "ref") {
                        value.value?.forEach(collectReferenceExtension);
                    }
                }
            }
            for (const declaration of analysis.source.declarations ?? []) {
                if (declaration.extension) {
                    extensions.add(declaration.extension);
                }
            }
            for (const node of analysis.source.nodes ?? []) {
                for (const value of Object.values(node.values ?? {})) {
                    if (value && typeof value === "object" && !("node" in value) && analysis.source.types?.[value.type]?.signature === "ref") {
                        value.value?.forEach(collectReferenceExtension);
                    }
                }
                const declaration = analysis.source.declarations?.[node.declaration];
                const mapping = declaration ? getMappingForDeclaration(declaration, false) : undefined;
                for (const [key, property] of Object.entries(mapping?.configuration ?? {})) {
                    if (property.pointerTemplate) {
                        node.configuration?.[key]?.value?.forEach(collectReferenceExtension);
                    }
                }
            }
        }
        for (const node of this._options.sourceGLTF?.nodes ?? []) {
            for (const extensionName of _CompanionNodeExtensions) {
                const extension = node.extensions?.[extensionName];
                if (extension) {
                    extensions.add(extensionName);
                    collectPropertyExtensions(extension);
                }
            }
        }
        return Array.from(extensions).sort();
    }

    private _writeCompanionNodeExtensions(context: IKHRInteractivitySerializerContext, diagnostics: IKHRInteractivityExportDiagnostic[]): void {
        for (let sourceIndex = 0; sourceIndex < (this._options.sourceGLTF?.nodes?.length ?? 0); sourceIndex++) {
            const sourceNode = this._options.sourceGLTF!.nodes![sourceIndex];
            for (const extensionName of _CompanionNodeExtensions) {
                const value = sourceNode.extensions?.[extensionName];
                if (!value) {
                    continue;
                }
                const targetIndex = sourceNode._babylonTransformNode ? context.getNodeIndex(sourceNode._babylonTransformNode) : undefined;
                if (targetIndex === undefined) {
                    _PushDiagnostic(diagnostics, {
                        code: "REFERENCE_UNRESOLVED",
                        path: `/nodes/${sourceIndex}/extensions/${extensionName}`,
                        message: `Companion extension "${extensionName}" targets a node that was not exported.`,
                    });
                    continue;
                }
                context.setNodeExtension(targetIndex, extensionName, _CloneJson(value));
            }
        }
    }

    private _sortDiagnostics(diagnostics: IKHRInteractivityExportDiagnostic[]): IKHRInteractivityExportDiagnostic[] {
        return diagnostics
            .slice()
            .sort(
                (left, right) =>
                    (left.graphIndex ?? -1) - (right.graphIndex ?? -1) ||
                    (left.nodeIndex ?? -1) - (right.nodeIndex ?? -1) ||
                    left.path.localeCompare(right.path) ||
                    left.code.localeCompare(right.code)
            );
    }
}

/**
 * Creates a detached KHR_interactivity export plan without mutating the FlowGraphs.
 * @param flowGraphs graphs to export in root graph order
 * @param options canonical source and serializer settings
 * @returns reusable representability/export provider
 */
export function CreateKHRInteractivityExportPlan(flowGraphs: readonly FlowGraph[], options: IKHRInteractivityExportOptions = {}): KHRInteractivityExportPlan {
    return new KHRInteractivityExportPlan(flowGraphs, options);
}
