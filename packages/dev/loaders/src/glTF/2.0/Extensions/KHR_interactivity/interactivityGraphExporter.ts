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
import { type Material } from "core/Materials/material";
import { type Node } from "core/node";
import { type Camera } from "core/Cameras/camera";
import { type IGLTF } from "../../glTFLoaderInterfaces";
import { GetInteractivityOperationRegistry, getMappingForDeclaration, type IGLTFToFlowGraphMapping, type IGLTFToFlowGraphMappingObject } from "./declarationMapper";
import {
    CloneKHRInteractivityGraph,
    type IKHRInteractivityBlockProvenance,
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
        | "DEPENDENCY_CYCLE";
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
 * Final glTF remapping context supplied by the serializer extension.
 */
export interface IKHRInteractivitySerializerContext {
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
    /** Canonical Phase 1 document associated with the FlowGraphs. */
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
    blocks: FlowGraphBlock[];
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

const _KnownIndexedRootCollections = new Set(["nodes", "animations", "cameras", "materials", "meshes", "textures", "images", "samplers", "skins", "scenes"]);
const _UnsupportedBlockClassName = "FlowGraphUnsupportedInteractivityBlock";

function _CloneJson<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((entry) => _CloneJson(entry)) as T;
    }
    if (value !== null && typeof value === "object") {
        const clone: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            clone[key] = _CloneJson(entry);
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

function _FindSignalOutput(blocks: readonly FlowGraphBlock[], nodeIndex: number, socket: string): FlowGraphSignalConnection | undefined {
    for (const block of blocks) {
        if (!(block instanceof FlowGraphExecutionBlock)) {
            continue;
        }
        for (const output of block.signalOutputs) {
            const provenance = _GetSocketProvenance(output);
            if (provenance?.nodeIndex === nodeIndex && provenance.kind === "flow" && provenance.direction === "output" && provenance.socket === socket) {
                return output;
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
    sourceGraph: IKHRInteractivity_Graph
): unknown[] | undefined {
    const block = _GetConfigurationBlock(logicalNode, property);
    if (!block) {
        return undefined;
    }
    const value = block.config?.[property.name];
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
        const match = value.match(/(0|[1-9]\d*)$/);
        return match ? [parseInt(match[1], 10)] : undefined;
    }
    if (key === "useSlerp") {
        return [value === "Quaternion"];
    }
    return _NormalizeValue(value);
}

function _PushDiagnostic(
    diagnostics: IKHRInteractivityExportDiagnostic[],
    diagnostic: Omit<IKHRInteractivityExportDiagnostic, "severity"> & { severity?: IKHRInteractivityExportDiagnostic["severity"] }
): void {
    diagnostics.push({ severity: "error", ...diagnostic });
}

/**
 * Detached representability and export plan for one or more FlowGraphs.
 */
export class KHRInteractivityExportPlan implements IKHRInteractivityExportProvider {
    private readonly _analysis: IKHRInteractivityExportAnalysis;
    private readonly _graphAnalyses: IGraphAnalysis[];
    private readonly _additionalExtensionsUsed: string[];

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
        this._graphAnalyses = this._analyzeGraphs();
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
        const buildDiagnostics = this._validateBuildWithSourceIndices();
        const diagnostics = this._sortDiagnostics(
            this._graphAnalyses.flatMap((graph) => graph.diagnostics.concat(graph.nodes.flatMap((node) => node.diagnostics))).concat(buildDiagnostics)
        );
        this._analysis = {
            representable: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
            nodes,
            diagnostics,
        };
        this._additionalExtensionsUsed = Array.from(new Set([...this._collectAdditionalExtensions(), ...this.additionalExtensionsRequired])).sort();
    }

    /**
     * Gets the detached representability analysis.
     * @returns current analysis
     */
    public analyze(): IKHRInteractivityExportAnalysis {
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
            getNodeIndex: (node) => indexOrUndefined(sourceGLTF?.nodes?.findIndex((candidate) => candidate._babylonTransformNode === node)),
            getAnimationIndex: (animation) => indexOrUndefined(sourceGLTF?.animations?.findIndex((candidate) => candidate._babylonAnimationGroup === animation)),
            getCameraIndex: (camera) => indexOrUndefined(sourceGLTF?.cameras?.findIndex((candidate) => candidate._babylonCamera === camera)),
            getMaterialIndex: (material) =>
                indexOrUndefined(sourceGLTF?.materials?.findIndex((candidate) => Object.values(candidate._data ?? {}).some((entry) => entry.babylonMaterial === material))),
            setNodeExtension: () => {},
        };
        for (const analysis of this._graphAnalyses) {
            this._buildGraph(analysis, context, diagnostics);
        }
        this._writeCompanionNodeExtensions(context, diagnostics);
        return diagnostics;
    }

    private _analyzeGraphs(): IGraphAnalysis[] {
        const analyses: IGraphAnalysis[] = [];
        if (this._options.document && this._options.document.graphs.length !== this._flowGraphs.length) {
            const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
            _PushDiagnostic(diagnostics, {
                code: "GRAPH_COUNT_MISMATCH",
                path: "/extensions/KHR_interactivity/graphs",
                message: `Canonical source has ${this._options.document.graphs.length} graph(s), but ${this._flowGraphs.length} FlowGraph(s) were supplied.`,
            });
            analyses.push({
                graph: this._flowGraphs[0],
                graphIndex: 0,
                source: {},
                nodes: [],
                diagnostics,
            });
            return analyses;
        }
        for (let graphIndex = 0; graphIndex < this._flowGraphs.length; graphIndex++) {
            const graph = this._flowGraphs[graphIndex];
            const source = this._getSourceGraph(graph, graphIndex);
            const diagnostics: IKHRInteractivityExportDiagnostic[] = [];
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
            const operation = declaration ? _FullOperationName(declaration.op, declaration.extension) : "";
            const mapping = declaration ? getMappingForDeclaration(declaration, false) : undefined;
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
                }
            } else {
                this._validateMappedBlocks(graphIndex, nodeIndex, operation, mapping!, blocks, diagnostics);
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
        for (const block of blocks) {
            const connections = [
                ...block.dataInputs,
                ...block.dataOutputs,
                ...(block instanceof FlowGraphExecutionBlock ? block.signalInputs : []),
                ...(block instanceof FlowGraphExecutionBlock ? block.signalOutputs : []),
            ];
            for (const connection of connections) {
                if (!connection.isConnected() || _GetSocketProvenance(connection)) {
                    continue;
                }
                const hasExternalConnection = connection._connectedPoint.some((peer) => !blocks.includes(peer._ownerBlock));
                if (hasExternalConnection) {
                    _PushDiagnostic(diagnostics, {
                        code: "SOCKET_PROVENANCE_MISSING",
                        graphIndex,
                        nodeIndex,
                        blockId: block.uniqueId,
                        socket: connection.name,
                        path: `/blocks/${block.uniqueId}/${connection.name}`,
                        message: `Connected socket "${connection.name}" is not part of the "${operation}" inverse mapping.`,
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
        const logicalBySourceIndex = new Map(analysis.nodes.filter((node) => node.sourceIndex >= 0).map((node) => [node.sourceIndex, node]));
        const rebuiltNodes = (graph.nodes ?? []).map((sourceNode, nodeIndex) => {
            const logicalNode = logicalBySourceIndex.get(nodeIndex)!;
            return this._rebuildNode(graph, sourceNode, logicalNode, analysis, context, diagnostics);
        });
        this._updateVariables(graph, analysis.graph, context, diagnostics, analysis.graphIndex);
        const ordered = this._topologicallyOrderNodes(rebuiltNodes, analysis.graphIndex, diagnostics);
        if (!ordered) {
            return graph;
        }
        graph.nodes = ordered;
        this._remapGraphReferences(graph, context, diagnostics, analysis.graphIndex);
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
        for (const socket of Object.keys(sourceNode.values ?? {}).sort()) {
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
            node.values![socket] = this._rebuildInputValue(graph, sourceNode.values![socket], input, mappingObject, logicalNode, graphAnalysis, context, diagnostics);
        }
        for (const socket of Object.keys(sourceNode.flows ?? {}).sort()) {
            const output = _FindSignalOutput(logicalNode.blocks, logicalNode.sourceIndex, socket);
            if (!output) {
                _PushDiagnostic(diagnostics, {
                    code: "SOCKET_PROVENANCE_MISSING",
                    graphIndex: graphAnalysis.graphIndex,
                    nodeIndex: logicalNode.sourceIndex,
                    socket,
                    path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/flows/${socket}`,
                    message: `Output flow socket "${socket}" no longer has KHR_interactivity provenance.`,
                });
                continue;
            }
            if (output._connectedPoint.length !== 1) {
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
            const provenance = _GetSocketProvenance(target);
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
            node.flows![socket] = {
                node: provenance.nodeIndex,
                ...(provenance.socket === "in" ? {} : { socket: provenance.socket }),
            };
        }
        if (mapping) {
            this._rebuildConfiguration(graph, node, logicalNode, graphAnalysis.graphIndex, context, diagnostics);
        }
        return node;
    }

    private _getMappingObject(mapping: { [name: string]: IGLTFToFlowGraphMappingObject } | undefined, socket: string): IGLTFToFlowGraphMappingObject | undefined {
        if (mapping?.[socket]) {
            return mapping[socket];
        }
        return Object.entries(mapping ?? {}).find(([key]) => key.startsWith("[") && key.endsWith("]"))?.[1];
    }

    private _rebuildInputValue(
        graph: IKHRInteractivity_Graph,
        sourceValue: IKHRInteractivity_Variable | IKHRInteractivity_OutputSocketReference,
        input: FlowGraphDataConnection<any>,
        mappingObject: IGLTFToFlowGraphMappingObject | undefined,
        logicalNode: ILogicalNode,
        graphAnalysis: IGraphAnalysis,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): IKHRInteractivity_Variable | IKHRInteractivity_OutputSocketReference {
        let upstream: FlowGraphDataConnection<any> | undefined = input._connectedPoint[0];
        if (input.isConnected() && mappingObject?.convertConnectedTimeToFrames) {
            upstream = this._unwrapAnimationTimeHelper(input, logicalNode, graphAnalysis.graphIndex, diagnostics);
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
            return {
                node: provenance.nodeIndex,
                ...(provenance.socket === "value" ? {} : { socket: provenance.socket }),
                ...("type" in sourceValue && sourceValue.type !== undefined ? { type: sourceValue.type } : {}),
            };
        }
        const original = "node" in sourceValue ? undefined : sourceValue;
        const type = original?.type;
        if (!original || type === undefined || !graph.types?.[type]) {
            _PushDiagnostic(diagnostics, {
                code: "VALUE_UNREPRESENTABLE",
                graphIndex: graphAnalysis.graphIndex,
                nodeIndex: logicalNode.sourceIndex,
                path: `/graphs/${graphAnalysis.graphIndex}/nodes/${logicalNode.sourceIndex}/values`,
                message: "A newly inlined value has no canonical KHR type.",
            });
            return sourceValue;
        }
        const flowContext = graphAnalysis.graph.getContext(0);
        const current = _NormalizeValue(flowContext ? input.getValue(flowContext) : (input as any)._defaultValue);
        const expected = _GetSourceValue(graph, original, mappingObject, this._options.targetFps ?? 60);
        if (_ValuesEqual(current, expected)) {
            return _CloneJson(original);
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
        return { type, value: this._remapValueArray(current, graph.types[type].signature, context, diagnostics, graphAnalysis.graphIndex, logicalNode.sourceIndex) };
    }

    private _unwrapAnimationTimeHelper(
        input: FlowGraphDataConnection<any>,
        logicalNode: ILogicalNode,
        graphIndex: number,
        diagnostics: IKHRInteractivityExportDiagnostic[]
    ): FlowGraphDataConnection<any> | undefined {
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
        if (!factor || factor.isConnected() || _NormalizeValue((factor as any)._defaultValue)?.[0] !== expectedFactor) {
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
        for (const [key, property] of Object.entries(logicalNode.mapping?.configuration ?? {})) {
            const current = _GetMappedConfigurationValue(logicalNode, key, property, graph);
            const source = node.configuration?.[key]?.value;
            if (property.validationOnly && current === undefined) {
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
            if (property.indexSource === "assetNodes" && current.length === 1 && typeof current[0] === "number") {
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
            (node.configuration ??= {})[key] = { value: current as NonNullable<IKHRInteractivity_Configuration["value"]> };
        }
        if (node.configuration) {
            for (const configuration of Object.values(node.configuration)) {
                if (configuration.value) {
                    configuration.value = configuration.value.map((value) =>
                        typeof value === "string" ? this._remapReference(value, context, diagnostics, graphIndex, logicalNode.sourceIndex) : value
                    );
                }
            }
        }
    }

    private _updateVariables(
        graph: IKHRInteractivity_Graph,
        flowGraph: FlowGraph,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number
    ): void {
        const flowContext = flowGraph.getContext(0);
        if (!flowContext) {
            return;
        }
        for (let index = 0; index < (graph.variables?.length ?? 0); index++) {
            const variable = graph.variables![index];
            const current = flowContext.userVariables[`staticVariable_${index}`];
            if (current === undefined) {
                continue;
            }
            const normalized = _NormalizeValue(current);
            const signature = graph.types?.[variable.type]?.signature;
            if (!normalized || !signature || _ValuesEqual(normalized, variable.value ?? _GetTypeDefault(signature))) {
                continue;
            }
            variable.value = this._remapValueArray(normalized, signature, context, diagnostics, graphIndex);
        }
    }

    private _remapValueArray(
        value: unknown[],
        signature: string,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number,
        nodeIndex?: number
    ): NonNullable<IKHRInteractivity_Variable["value"]> {
        if (signature !== "ref") {
            return value as NonNullable<IKHRInteractivity_Variable["value"]>;
        }
        return value.map((entry) => (typeof entry === "string" ? this._remapReference(entry, context, diagnostics, graphIndex, nodeIndex) : entry)) as NonNullable<
            IKHRInteractivity_Variable["value"]
        >;
    }

    private _topologicallyOrderNodes(nodes: IKHRInteractivity_Node[], graphIndex: number, diagnostics: IKHRInteractivityExportDiagnostic[]): IKHRInteractivity_Node[] | undefined {
        const outgoing = nodes.map(() => new Set<number>());
        const indegree = nodes.map(() => 0);
        const addEdge = (source: number, target: number) => {
            if (source === target || source < 0 || target < 0 || source >= nodes.length || target >= nodes.length || outgoing[source].has(target)) {
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
        return ordered;
    }

    private _remapGraphReferences(
        graph: IKHRInteractivity_Graph,
        context: IKHRInteractivitySerializerContext,
        diagnostics: IKHRInteractivityExportDiagnostic[],
        graphIndex: number
    ): void {
        for (const variable of graph.variables ?? []) {
            if (graph.types?.[variable.type]?.signature === "ref" && variable.value) {
                variable.value = this._remapValueArray(variable.value, "ref", context, diagnostics, graphIndex);
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
            for (const value of Object.values(node.values ?? {})) {
                if (!("node" in value) && graph.types?.[value.type]?.signature === "ref" && value.value) {
                    value.value = this._remapValueArray(value.value, "ref", context, diagnostics, graphIndex, nodeIndex);
                }
            }
            for (const configuration of Object.values(node.configuration ?? {})) {
                if (configuration.value) {
                    configuration.value = configuration.value.map((value) =>
                        typeof value === "string" ? this._remapReference(value, context, diagnostics, graphIndex, nodeIndex) : value
                    );
                }
            }
        }
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
        const match = reference.match(/^\/([^/]+)\/(0|[1-9]\d*)(\/.*)?$/);
        if (!match || !_KnownIndexedRootCollections.has(match[1])) {
            return reference;
        }
        const collection = match[1];
        const sourceIndex = parseInt(match[2], 10);
        let targetIndex: number | undefined;
        switch (collection) {
            case "nodes": {
                const target = this._options.sourceGLTF?.nodes?.[sourceIndex]?._babylonTransformNode;
                targetIndex = target ? context.getNodeIndex(target) : undefined;
                break;
            }
            case "animations": {
                const target = this._options.sourceGLTF?.animations?.[sourceIndex]?._babylonAnimationGroup;
                targetIndex = target ? context.getAnimationIndex(target) : undefined;
                break;
            }
            case "cameras": {
                const target = this._options.sourceGLTF?.cameras?.[sourceIndex]?._babylonCamera;
                targetIndex = target ? context.getCameraIndex(target) : undefined;
                break;
            }
            case "materials": {
                const target = Object.values(this._options.sourceGLTF?.materials?.[sourceIndex]?._data ?? {})[0]?.babylonMaterial;
                targetIndex = target ? context.getMaterialIndex(target) : undefined;
                break;
            }
            default:
                break;
        }
        if (targetIndex === undefined) {
            _PushDiagnostic(diagnostics, {
                code: "REFERENCE_UNRESOLVED",
                graphIndex,
                nodeIndex,
                path: `/graphs/${graphIndex}${nodeIndex === undefined ? "" : `/nodes/${nodeIndex}`}`,
                message: `Reference "${reference}" cannot be remapped because its ${collection} target was not exported.`,
            });
            return reference;
        }
        return `/${collection}/${targetIndex}${match[3] ?? ""}`;
    }

    private _collectAdditionalExtensions(): string[] {
        const extensions = new Set<string>();
        const collectPropertyExtensions = (value: unknown): void => {
            if (Array.isArray(value)) {
                value.forEach(collectPropertyExtensions);
                return;
            }
            if (value === null || typeof value !== "object") {
                return;
            }
            const object = value as Record<string, unknown>;
            if (object.extensions !== null && typeof object.extensions === "object" && !Array.isArray(object.extensions)) {
                for (const extensionName of Object.keys(object.extensions as Record<string, unknown>)) {
                    if (extensionName !== "KHR_interactivity") {
                        extensions.add(extensionName);
                    }
                }
            }
            Object.values(object).forEach(collectPropertyExtensions);
        };
        collectPropertyExtensions(this._options.document?.source);
        for (const analysis of this._graphAnalyses) {
            collectPropertyExtensions(analysis.source);
            for (const declaration of analysis.source.declarations ?? []) {
                if (declaration.extension) {
                    extensions.add(declaration.extension);
                }
            }
        }
        for (const node of this._options.sourceGLTF?.nodes ?? []) {
            if (node.extensions?.KHR_node_selectability) {
                extensions.add("KHR_node_selectability");
            }
            if (node.extensions?.KHR_node_hoverability) {
                extensions.add("KHR_node_hoverability");
            }
        }
        return Array.from(extensions).sort();
    }

    private _writeCompanionNodeExtensions(context: IKHRInteractivitySerializerContext, diagnostics: IKHRInteractivityExportDiagnostic[]): void {
        for (let sourceIndex = 0; sourceIndex < (this._options.sourceGLTF?.nodes?.length ?? 0); sourceIndex++) {
            const sourceNode = this._options.sourceGLTF!.nodes![sourceIndex];
            for (const extensionName of ["KHR_node_selectability", "KHR_node_hoverability"] as const) {
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
