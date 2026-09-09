/* eslint-disable @typescript-eslint/naming-convention */
import {
    type IKHRInteractivity,
    type IKHRInteractivity_Declaration,
    type IKHRInteractivity_Graph,
    type IKHRInteractivity_Node,
    type IKHRInteractivity_Variable,
} from "babylonjs-gltf2interface";
import { getMappingForDeclaration, getNoOpMappingForDeclaration, type IGLTFToFlowGraphMapping, type IGLTFToFlowGraphMappingObject } from "./declarationMapper";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";

/**
 * Ratified KHR_interactivity specification baseline used by this importer.
 */
export const KHR_INTERACTIVITY_SPECIFICATION_COMMIT = "f798712c5685bc9223a628140fba707db8889300";

/**
 * Runtime representation of every ratified built-in KHR_interactivity type.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const gltfTypeToBabylonType: {
    [key: string]: { length: number; flowGraphType: FlowGraphTypes; elementType: "number" | "boolean" | "string" | "any" };
} = {
    float: { length: 1, flowGraphType: FlowGraphTypes.Number, elementType: "number" },
    bool: { length: 1, flowGraphType: FlowGraphTypes.Boolean, elementType: "boolean" },
    float2: { length: 2, flowGraphType: FlowGraphTypes.Vector2, elementType: "number" },
    float3: { length: 3, flowGraphType: FlowGraphTypes.Vector3, elementType: "number" },
    float4: { length: 4, flowGraphType: FlowGraphTypes.Vector4, elementType: "number" },
    float4x4: { length: 16, flowGraphType: FlowGraphTypes.Matrix, elementType: "number" },
    float2x2: { length: 4, flowGraphType: FlowGraphTypes.Matrix2D, elementType: "number" },
    float3x3: { length: 9, flowGraphType: FlowGraphTypes.Matrix3D, elementType: "number" },
    int: { length: 1, flowGraphType: FlowGraphTypes.Integer, elementType: "number" },
    ref: { length: 1, flowGraphType: FlowGraphTypes.String, elementType: "string" },
    custom: { length: 1, flowGraphType: FlowGraphTypes.Any, elementType: "any" },
};

/**
 * Classification of a KHR_interactivity declaration.
 */
export type KHRInteractivityDeclarationSupport = "core" | "extension" | "unsupported-extension" | "unknown-core";

/**
 * A structured KHR_interactivity import diagnostic.
 */
export interface IKHRInteractivityDiagnostic {
    /** JSON pointer identifying the source location. */
    path: string;
    /** Human-readable diagnostic text. */
    message: string;
    /** Diagnostic severity. */
    severity: "error" | "warning";
}

/**
 * Canonical declaration information retained during import.
 */
export interface IKHRInteractivityDeclarationModel {
    /** Declaration index in the source graph. */
    index: number;
    /** Full operation name, including the defining extension when present. */
    operation: string;
    /** Whether Babylon can execute the declaration. */
    support: KHRInteractivityDeclarationSupport;
    /** Exact source declaration. */
    source: IKHRInteractivity_Declaration;
}

/**
 * Canonical graph information retained during import.
 */
export interface IKHRInteractivityGraphModel {
    /** Graph index in the root extension. */
    index: number;
    /** Stable source path. */
    path: string;
    /** Human-readable graph name. */
    name: string;
    /** Exact source graph, including extension and extras payloads. */
    source: IKHRInteractivity_Graph;
    /** Canonical declarations in source order. */
    declarations: IKHRInteractivityDeclarationModel[];
    /** Validation diagnostics for this graph. */
    diagnostics: IKHRInteractivityDiagnostic[];
    /** Whether this graph is valid and can be lowered to FlowGraph. */
    valid: boolean;
}

/**
 * Lossless canonical representation of a KHR_interactivity root extension.
 */
export interface IKHRInteractivityDocument {
    /** Ratified specification revision used for validation. */
    specificationCommit: string;
    /** Exact source extension, including unknown extensions and extras. */
    source: IKHRInteractivity;
    /** Default graph index, or -1 when the source selection is invalid. */
    defaultGraphIndex: number;
    /** Canonical graph models in source order. */
    graphs: IKHRInteractivityGraphModel[];
    /** Root-level validation diagnostics. */
    diagnostics: IKHRInteractivityDiagnostic[];
}

function _cloneJson<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((entry) => _cloneJson(entry)) as T;
    }
    if (value !== null && typeof value === "object") {
        const clone: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            clone[key] = _cloneJson(entry);
        }
        return clone as T;
    }
    return value;
}

/**
 * Creates a detached JSON copy of a KHR_interactivity graph.
 * @param graph source graph
 * @returns a lossless JSON copy
 */
export function CloneKHRInteractivityGraph(graph: IKHRInteractivity_Graph): IKHRInteractivity_Graph {
    return _cloneJson(graph);
}

function _isValidIndex(value: unknown, length: number): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length;
}

function _addError(diagnostics: IKHRInteractivityDiagnostic[], path: string, message: string): void {
    diagnostics.push({ path, message, severity: "error" });
}

function _matchesSocket(mapping: { [name: string]: IGLTFToFlowGraphMappingObject } | undefined, socket: string, defaultSocket?: string): boolean {
    if (socket === defaultSocket || mapping?.[socket]) {
        return true;
    }
    return Object.keys(mapping ?? {}).some((name) => name.startsWith("[") && name.endsWith("]"));
}

function _validateTypeIndex(typeIndex: unknown, graph: IKHRInteractivity_Graph, diagnostics: IKHRInteractivityDiagnostic[], path: string): typeIndex is number {
    if (!_isValidIndex(typeIndex, graph.types?.length ?? 0)) {
        _addError(diagnostics, path, `Type index ${String(typeIndex)} is out of range.`);
        return false;
    }
    return true;
}

function _validateValue(value: IKHRInteractivity_Variable, graph: IKHRInteractivity_Graph, diagnostics: IKHRInteractivityDiagnostic[], path: string): void {
    if (!_validateTypeIndex(value.type, graph, diagnostics, `${path}/type`)) {
        return;
    }
    if (value.value === undefined) {
        return;
    }
    const type = graph.types![value.type];
    const runtimeType = gltfTypeToBabylonType[type.signature];
    if (runtimeType && value.value.length !== runtimeType.length) {
        _addError(diagnostics, `${path}/value`, `Expected ${runtimeType.length} value component(s) for type "${type.signature}", received ${value.value.length}.`);
    }
    for (let componentIndex = 0; componentIndex < value.value.length; componentIndex++) {
        const component = value.value[componentIndex];
        let valid = true;
        switch (type.signature) {
            case "bool":
                valid = typeof component === "boolean";
                break;
            case "int":
                valid =
                    (typeof component === "number" || (typeof component === "string" && component.trim() !== "")) &&
                    Number.isInteger(Number(component)) &&
                    Number(component) >= -2147483648 &&
                    Number(component) <= 2147483647;
                break;
            case "float":
            case "float2":
            case "float3":
            case "float4":
            case "float2x2":
            case "float3x3":
            case "float4x4":
                valid = typeof component === "number" || (typeof component === "string" && component.trim() !== "" && !Number.isNaN(Number(component))) || component === "NaN";
                break;
            case "ref":
                valid = typeof component === "string" && (component === "" || component.startsWith("/"));
                break;
            default:
                break;
        }
        if (!valid) {
            _addError(diagnostics, `${path}/value/${componentIndex}`, `Value component is invalid for type "${type.signature}".`);
        }
    }
}

function _getDeclarationMapping(
    declaration: IKHRInteractivity_Declaration,
    supportedExtensions?: ReadonlySet<string>
): {
    mapping: IGLTFToFlowGraphMapping | undefined;
    support: KHRInteractivityDeclarationSupport;
} {
    const extensionEnabled = !declaration.extension || !supportedExtensions || supportedExtensions.has(declaration.extension);
    const mapping = extensionEnabled ? getMappingForDeclaration(declaration, false) : undefined;
    if (mapping) {
        return { mapping, support: declaration.extension ? "extension" : "core" };
    }
    return {
        mapping: undefined,
        support: declaration.extension ? "unsupported-extension" : "unknown-core",
    };
}

function _validateNode(
    node: IKHRInteractivity_Node,
    nodeIndex: number,
    graph: IKHRInteractivity_Graph,
    declarations: IKHRInteractivityDeclarationModel[],
    diagnostics: IKHRInteractivityDiagnostic[],
    graphPath: string
): void {
    const path = `${graphPath}/nodes/${nodeIndex}`;
    if (!_isValidIndex(node.declaration, declarations.length)) {
        _addError(diagnostics, `${path}/declaration`, `Declaration index ${String(node.declaration)} is out of range.`);
        return;
    }

    const declarationModel = declarations[node.declaration];
    const mapping =
        declarationModel.support === "unsupported-extension" ? getNoOpMappingForDeclaration(declarationModel.source) : getMappingForDeclaration(declarationModel.source, false);
    if (declarationModel.support === "unknown-core" || !mapping) {
        return;
    }

    for (const [key, configuration] of Object.entries(node.configuration ?? {})) {
        if (configuration.value === undefined || (!configuration.value.length && !mapping.configuration?.[key]?.isArray)) {
            _addError(diagnostics, `${path}/configuration/${key}/value`, "Configuration values must contain at least one item.");
        }
    }
    for (const [key, value] of Object.entries(node.values ?? {})) {
        if (declarationModel.support === "unsupported-extension" && !declarationModel.source.inputValueSockets?.[key]) {
            _addError(diagnostics, `${path}/values/${key}`, `Input value socket "${key}" is not defined by operation "${declarationModel.operation}".`);
        }
        if ("node" in value) {
            if (!_isValidIndex(value.node, graph.nodes?.length ?? 0)) {
                _addError(diagnostics, `${path}/values/${key}/node`, `Node index ${String(value.node)} is out of range.`);
                continue;
            }
            if (value.type !== undefined) {
                _validateTypeIndex(value.type, graph, diagnostics, `${path}/values/${key}/type`);
            }
            const sourceNode = graph.nodes![value.node];
            if (_isValidIndex(sourceNode.declaration, declarations.length)) {
                const sourceDeclaration = declarations[sourceNode.declaration];
                const sourceMapping =
                    sourceDeclaration.support === "unsupported-extension"
                        ? getNoOpMappingForDeclaration(sourceDeclaration.source)
                        : getMappingForDeclaration(sourceDeclaration.source, false);
                const sourceSocket = value.socket ?? "value";
                if (sourceDeclaration.support === "unsupported-extension" && sourceMapping && !_matchesSocket(sourceMapping.outputs?.values, sourceSocket, "value")) {
                    _addError(diagnostics, `${path}/values/${key}/socket`, `Output value socket "${sourceSocket}" does not exist on node ${value.node}.`);
                }
                const declaredOutputType = sourceDeclaration.source.outputValueSockets?.[sourceSocket]?.type;
                if (value.type !== undefined && declaredOutputType !== undefined && value.type !== declaredOutputType) {
                    _addError(diagnostics, `${path}/values/${key}/type`, `Type assertion does not match output socket "${sourceSocket}".`);
                }
            }
        } else {
            _validateValue(value, graph, diagnostics, `${path}/values/${key}`);
        }
    }

    for (const [key, flow] of Object.entries(node.flows ?? {})) {
        if (!_isValidIndex(flow.node, graph.nodes?.length ?? 0)) {
            _addError(diagnostics, `${path}/flows/${key}/node`, `Node index ${String(flow.node)} is out of range.`);
            continue;
        }
        const targetNode = graph.nodes![flow.node];
        if (_isValidIndex(targetNode.declaration, declarations.length)) {
            const targetDeclaration = declarations[targetNode.declaration];
            const targetMapping =
                targetDeclaration.support === "unsupported-extension"
                    ? getNoOpMappingForDeclaration(targetDeclaration.source)
                    : getMappingForDeclaration(targetDeclaration.source, false);
            const targetSocket = flow.socket ?? "in";
            if (targetDeclaration.support === "unsupported-extension" && targetMapping && !_matchesSocket(targetMapping.inputs?.flows, targetSocket, "in")) {
                _addError(diagnostics, `${path}/flows/${key}/socket`, `Input flow socket "${targetSocket}" does not exist on node ${flow.node}.`);
            }
        }
    }
}

/**
 * Creates and validates a canonical copy of one KHR_interactivity graph.
 * @param graph source graph
 * @param index graph index in the root extension
 * @param supportedExtensions enabled extensions that may provide executable operations
 * @returns the canonical graph model
 */
export function CreateKHRInteractivityGraphModel(graph: IKHRInteractivity_Graph, index: number = 0, supportedExtensions?: ReadonlySet<string>): IKHRInteractivityGraphModel {
    graph = CloneKHRInteractivityGraph(graph);
    const diagnostics: IKHRInteractivityDiagnostic[] = [];
    const path = `/extensions/KHR_interactivity/graphs/${index}`;
    const declarations = (graph.declarations ?? []).map((declaration, declarationIndex) => {
        const { support } = _getDeclarationMapping(declaration, supportedExtensions);
        if (support === "unknown-core") {
            _addError(diagnostics, `${path}/declarations/${declarationIndex}/op`, `Unknown core operation "${declaration.op}".`);
        }
        if (!declaration.extension && (declaration.inputValueSockets || declaration.outputValueSockets)) {
            _addError(diagnostics, `${path}/declarations/${declarationIndex}`, "Core operation declarations cannot define dynamic value sockets.");
        }
        for (const [socket, definition] of Object.entries(declaration.inputValueSockets ?? {})) {
            _validateTypeIndex(definition.type, graph, diagnostics, `${path}/declarations/${declarationIndex}/inputValueSockets/${socket}/type`);
        }
        for (const [socket, definition] of Object.entries(declaration.outputValueSockets ?? {})) {
            _validateTypeIndex(definition.type, graph, diagnostics, `${path}/declarations/${declarationIndex}/outputValueSockets/${socket}/type`);
        }
        return {
            index: declarationIndex,
            operation: declaration.extension ? `${declaration.op}:${declaration.extension}` : declaration.op,
            support,
            source: declaration,
        };
    });

    const signatures = new Set<string>();
    for (let typeIndex = 0; typeIndex < (graph.types?.length ?? 0); typeIndex++) {
        const signature = graph.types![typeIndex].signature;
        if (signature !== "custom" && signatures.has(signature)) {
            _addError(diagnostics, `${path}/types/${typeIndex}/signature`, `Duplicate built-in type signature "${signature}".`);
        }
        signatures.add(signature);
        if (signature !== "custom" && !gltfTypeToBabylonType[signature]) {
            _addError(diagnostics, `${path}/types/${typeIndex}/signature`, `Unknown built-in type signature "${signature}".`);
        }
    }

    for (let variableIndex = 0; variableIndex < (graph.variables?.length ?? 0); variableIndex++) {
        _validateValue(graph.variables![variableIndex], graph, diagnostics, `${path}/variables/${variableIndex}`);
    }
    for (let eventIndex = 0; eventIndex < (graph.events?.length ?? 0); eventIndex++) {
        for (const [socket, value] of Object.entries(graph.events![eventIndex].values ?? {})) {
            _validateValue(value, graph, diagnostics, `${path}/events/${eventIndex}/values/${socket}`);
        }
    }
    for (let nodeIndex = 0; nodeIndex < (graph.nodes?.length ?? 0); nodeIndex++) {
        _validateNode(graph.nodes![nodeIndex], nodeIndex, graph, declarations, diagnostics, path);
    }

    return {
        index,
        path,
        name: graph.name ?? `Graph ${index + 1}`,
        source: graph,
        declarations,
        diagnostics,
        valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    };
}

/**
 * Creates an immutable canonical KHR_interactivity document and validates all graph-local references.
 * @param extension source extension object from the glTF document
 * @param supportedExtensions enabled extensions that may provide executable operations
 * @returns the canonical document
 */
export function CreateKHRInteractivityDocument(extension: IKHRInteractivity, supportedExtensions?: ReadonlySet<string>): IKHRInteractivityDocument {
    const source = _cloneJson(extension);
    const diagnostics: IKHRInteractivityDiagnostic[] = [];
    if (!source.graphs?.length) {
        _addError(diagnostics, "/extensions/KHR_interactivity/graphs", "At least one behavior graph is required.");
    }
    const requestedDefaultGraphIndex = source.graph ?? 0;
    const defaultGraphIndex = _isValidIndex(requestedDefaultGraphIndex, source.graphs?.length ?? 0) ? requestedDefaultGraphIndex : -1;
    if (defaultGraphIndex === -1) {
        _addError(diagnostics, "/extensions/KHR_interactivity/graph", `Default graph index ${String(requestedDefaultGraphIndex)} is out of range.`);
    }

    return {
        specificationCommit: KHR_INTERACTIVITY_SPECIFICATION_COMMIT,
        source,
        defaultGraphIndex,
        graphs: (source.graphs ?? []).map((graph, index) => CreateKHRInteractivityGraphModel(graph, index, supportedExtensions)),
        diagnostics,
    };
}
