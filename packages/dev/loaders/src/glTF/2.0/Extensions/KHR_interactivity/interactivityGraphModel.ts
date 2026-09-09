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
            Object.defineProperty(clone, key, {
                configurable: true,
                enumerable: true,
                value: _cloneJson(entry),
                writable: true,
            });
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

function _addWarning(diagnostics: IKHRInteractivityDiagnostic[], path: string, message: string): void {
    diagnostics.push({ path, message, severity: "warning" });
}

function _isValidJsonPointer(value: string): boolean {
    return value === "" || /^(?:\/(?:[^~]|~[01])*)*$/.test(value);
}

function _matchesSocket(mapping: { [name: string]: IGLTFToFlowGraphMappingObject } | undefined, socket: string, defaultSocket?: string): boolean {
    if (mapping?.[socket]) {
        return true;
    }
    if (socket === defaultSocket && mapping?.[defaultSocket]) {
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
                valid = typeof component === "number" && Number.isInteger(component) && component >= -2147483648 && component <= 2147483647;
                break;
            case "float":
            case "float2":
            case "float3":
            case "float4":
            case "float2x2":
            case "float3x3":
            case "float4x4":
                valid = typeof component === "number" && Number.isFinite(component);
                break;
            case "ref":
                valid = typeof component === "string" && _isValidJsonPointer(component);
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
    graph: IKHRInteractivity_Graph,
    supportedExtensions?: ReadonlySet<string>
): {
    mapping: IGLTFToFlowGraphMapping | undefined;
    support: KHRInteractivityDeclarationSupport;
} {
    const extensionEnabled = !declaration.extension || !supportedExtensions || supportedExtensions.has(declaration.extension);
    const mapping = extensionEnabled ? getMappingForDeclaration(declaration, false) : undefined;
    if (mapping) {
        if (declaration.extension && mapping.declarationSchema && !_isCompatibleExtensionDeclaration(declaration, graph, mapping.declarationSchema)) {
            return { mapping: undefined, support: "unsupported-extension" };
        }
        return { mapping, support: declaration.extension ? "extension" : "core" };
    }

    return {
        mapping: undefined,
        support: declaration.extension ? "unsupported-extension" : "unknown-core",
    };
}

function _isCompatibleExtensionDeclaration(
    declaration: IKHRInteractivity_Declaration,
    graph: IKHRInteractivity_Graph,
    schema: NonNullable<IGLTFToFlowGraphMapping["declarationSchema"]>
): boolean {
    const matches = (actual: typeof declaration.inputValueSockets, expected: Record<string, string>): boolean => {
        const actualKeys = Object.keys(actual ?? {}).sort();
        const expectedKeys = Object.keys(expected).sort();
        if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
            return false;
        }
        return actualKeys.every((key) => graph.types?.[actual![key].type]?.signature === expected[key]);
    };
    return matches(declaration.inputValueSockets, schema.inputValueSockets) && matches(declaration.outputValueSockets, schema.outputValueSockets);
}

function _validateConfigurationValue(value: unknown[] | undefined, type: IGLTFToFlowGraphMappingObject["configurationType"]): boolean {
    if (!value) {
        return false;
    }
    const isInt = (entry: unknown) => typeof entry === "number" && Number.isInteger(entry) && entry >= -2147483648 && entry <= 2147483647;
    switch (type) {
        case "bool":
            return value.length === 1 && typeof value[0] === "boolean";
        case "int":
            return value.length === 1 && isInt(value[0]);
        case "int[]":
            return value.every(isInt);
        case "string":
            return value.length === 1 && typeof value[0] === "string";
        default:
            return value.length > 0;
    }
}

function _getIndexedArrayLength(graph: IKHRInteractivity_Graph, source: IGLTFToFlowGraphMappingObject["indexSource"], assetNodeCount?: number): number {
    switch (source) {
        case "types":
            return graph.types?.length ?? 0;
        case "variables":
            return graph.variables?.length ?? 0;
        case "events":
            return graph.events?.length ?? 0;
        case "nodes":
            return graph.nodes?.length ?? 0;
        case "assetNodes":
            return assetNodeCount ?? 0;
        default:
            return 0;
    }
}

function _getPointerTemplateSockets(pointer: string): { name: string; signature: "int" | "ref" }[] {
    const sockets: { name: string; signature: "int" | "ref" }[] = [];
    for (const segment of pointer.split("/")) {
        const signature = segment.startsWith("[") && !segment.startsWith("[[") ? "int" : segment.startsWith("{") && !segment.startsWith("{{") ? "ref" : undefined;
        if (signature) {
            const name = segment
                .substring(1, segment.length - 1)
                .replace(/~1/g, "/")
                .replace(/~0/g, "~");
            sockets.push({ name, signature });
        }
    }
    return sockets;
}

function _resolveValueTypeIndex(
    value: IKHRInteractivity_Variable | { node: number; socket?: string; type?: number },
    graph: IKHRInteractivity_Graph,
    declarations: readonly IKHRInteractivityDeclarationModel[],
    visited: Set<string> = new Set()
): number | undefined {
    if ("node" in value) {
        return _resolveOutputTypeIndex(value.node, value.socket ?? "value", graph, declarations, visited);
    }
    return value.type;
}

function _resolveOutputTypeIndex(
    nodeIndex: number,
    socket: string,
    graph: IKHRInteractivity_Graph,
    declarations: readonly IKHRInteractivityDeclarationModel[],
    visited: Set<string> = new Set()
): number | undefined {
    const key = `${nodeIndex}:${socket}`;
    if (visited.has(key)) {
        return undefined;
    }
    visited.add(key);
    if (!_isValidIndex(nodeIndex, graph.nodes?.length ?? 0)) {
        return undefined;
    }
    const sourceNode = graph.nodes![nodeIndex];
    if (!_isValidIndex(sourceNode.declaration, declarations.length)) {
        return undefined;
    }
    const declaration = declarations[sourceNode.declaration];
    const declaredType = declaration.source.outputValueSockets?.[socket]?.type;
    if (declaredType !== undefined) {
        return declaredType;
    }
    const booleanType = () => graph.types?.findIndex((type) => type.signature === "bool");
    if (socket === "isValid") {
        return booleanType();
    }
    if (declaration.operation === "pointer/get" && socket === "value") {
        const configuredType = sourceNode.configuration?.type?.value?.[0];
        return typeof configuredType === "number" ? configuredType : undefined;
    }
    if (declaration.operation === "variable/get" && socket === "value") {
        const variableIndex = sourceNode.configuration?.variable?.value?.[0];
        return typeof variableIndex === "number" ? graph.variables?.[variableIndex]?.type : undefined;
    }
    if (declaration.operation === "math/switch" && socket === "value") {
        const defaultInput = sourceNode.values?.default;
        return defaultInput ? _resolveValueTypeIndex(defaultInput, graph, declarations, visited) : undefined;
    }
    const fixedSignature = _getFixedOutputSignature(declaration.operation, socket);
    if (fixedSignature) {
        return graph.types?.findIndex((type) => type.signature === fixedSignature);
    }
    const mapping = getMappingForDeclaration(declaration.source, false);
    const outputMapping = mapping?.outputs?.values?.[socket];
    const mappedType = outputMapping?.gltfType;
    const signature = mappedType === "number" ? "float" : mappedType === "boolean" ? "bool" : mappedType;
    if (signature && signature in gltfTypeToBabylonType) {
        return graph.types?.findIndex((type) => type.signature === signature);
    }
    const typeSource = outputMapping?.typeSourceInput ? sourceNode.values?.[outputMapping.typeSourceInput] : undefined;
    return typeSource ? _resolveValueTypeIndex(typeSource, graph, declarations, visited) : undefined;
}

function _getFixedOutputSignature(operation: string, socket: string): keyof typeof gltfTypeToBabylonType | undefined {
    if (socket !== "value") {
        if (
            (operation === "math/rgbToOkLCh" && ["l", "c", "h"].includes(socket)) ||
            (operation === "math/rgbFromOkLCh" && ["r", "g", "b"].includes(socket)) ||
            operation.startsWith("math/extract")
        ) {
            return "float";
        }
        if (operation === "math/matDecompose") {
            return socket === "rotation" ? "float4" : socket === "translation" || socket === "scale" ? "float3" : undefined;
        }
        if (operation === "math/quatToAxisAngle") {
            return socket === "axis" ? "float3" : socket === "angle" ? "float" : undefined;
        }
        if ((operation === "flow/doN" && socket === "currentCount") || (operation === "flow/for" && socket === "index")) {
            return "int";
        }
        if (operation === "flow/setDelay" && socket === "lastDelay") {
            return "ref";
        }
        if (operation === "flow/throttle" && socket === "lastRemainingTime") {
            return "float";
        }
        if ((operation === "event/onStart" || operation === "event/onTick" || operation === "event/receive") && socket === "event") {
            return "ref";
        }
        if (operation === "event/onTick" && socket === "timeSinceLastTick") {
            return "float";
        }
        if (operation === "event/onTick" && socket === "timeSinceStart") {
            return "float";
        }
        return undefined;
    }
    if (["math/E", "math/Pi", "math/Tau", "math/Inf", "math/NaN", "math/random", "math/length", "math/dot", "math/determinant", "math/quatAngleBetween"].includes(operation)) {
        return "float";
    }
    if (["math/eq", "ref/eq", "math/lt", "math/le", "math/gt", "math/ge", "math/isNaN", "math/isInf", "type/intToBool", "type/floatToBool"].includes(operation)) {
        return "bool";
    }
    if (["math/clz", "math/ctz", "math/popcnt", "type/boolToInt", "type/floatToInt"].includes(operation)) {
        return "int";
    }
    if (["type/boolToFloat", "type/intToFloat"].includes(operation)) {
        return "float";
    }
    return undefined;
}

function _validateNode(
    node: IKHRInteractivity_Node,
    nodeIndex: number,
    graph: IKHRInteractivity_Graph,
    declarations: IKHRInteractivityDeclarationModel[],
    diagnostics: IKHRInteractivityDiagnostic[],
    graphPath: string,
    assetNodeCount?: number
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

    const reportConfigurationIssue = (property: IGLTFToFlowGraphMappingObject, issuePath: string, message: string): void => {
        if (property.invalidUsesDefault || property.defaultValue !== undefined) {
            _addWarning(diagnostics, issuePath, `${message} The default configuration will be used.`);
        } else {
            _addError(diagnostics, issuePath, message);
        }
    };
    for (const [key, configuration] of Object.entries(node.configuration ?? {})) {
        if (configuration.value && configuration.value.length === 0) {
            _addError(diagnostics, `${path}/configuration/${key}/value`, "Configuration value arrays must contain at least one item when present.");
        }
    }
    for (const [key, property] of Object.entries(mapping.configuration ?? {})) {
        const configuration = node.configuration?.[key];
        const isConfigurationValid = !!configuration && _validateConfigurationValue(configuration.value, property.configurationType);
        if (!configuration && property.required) {
            _addError(diagnostics, `${path}/configuration/${key}`, `Required configuration "${key}" is missing.`);
        } else if (configuration && !isConfigurationValid) {
            reportConfigurationIssue(property, `${path}/configuration/${key}`, `Configuration "${key}" is invalid.`);
        }
        if (isConfigurationValid && configuration.value && property.minItems !== undefined && configuration.value.length < property.minItems) {
            _addError(diagnostics, `${path}/configuration/${key}/value`, `Configuration "${key}" requires at least ${property.minItems} value(s).`);
        }
        if (isConfigurationValid && configuration.value && property.indexSource) {
            const length = _getIndexedArrayLength(graph, property.indexSource, assetNodeCount);
            for (let index = 0; index < configuration.value.length; index++) {
                if (!_isValidIndex(configuration.value[index], length)) {
                    reportConfigurationIssue(property, `${path}/configuration/${key}/value/${index}`, `Index is out of range for graph ${property.indexSource}.`);
                }
            }
        }
        if (isConfigurationValid && configuration.value && property.allowedSignatures) {
            const typeIndex = configuration.value[0];
            const signature = typeof typeIndex === "number" ? graph.types?.[typeIndex]?.signature : undefined;
            if (!signature || !property.allowedSignatures.includes(signature)) {
                reportConfigurationIssue(property, `${path}/configuration/${key}/value/0`, `Type "${String(signature)}" is not supported by this operation.`);
            }
        }
        if (isConfigurationValid && configuration.value && (property.minimum !== undefined || property.maximum !== undefined)) {
            const numericValue = configuration.value[0] as number;
            if ((property.minimum !== undefined && numericValue < property.minimum) || (property.maximum !== undefined && numericValue > property.maximum)) {
                reportConfigurationIssue(
                    property,
                    `${path}/configuration/${key}/value/0`,
                    `Configuration "${key}" must be between ${String(property.minimum)} and ${String(property.maximum)}.`
                );
            }
        }
        if (isConfigurationValid && configuration.value && property.generatesInputValueSockets) {
            for (const configuredIndex of configuration.value) {
                if (typeof configuredIndex !== "number" || !_isValidIndex(configuredIndex, graph.variables?.length ?? 0)) {
                    continue;
                }
                const socket = node.values?.[String(configuredIndex)];
                if (!socket) {
                    _addError(diagnostics, `${path}/values/${configuredIndex}`, `Required configured input value socket "${configuredIndex}" is missing.`);
                } else if (_resolveValueTypeIndex(socket, graph, declarations) !== graph.variables![configuredIndex].type) {
                    _addError(diagnostics, `${path}/values/${configuredIndex}/type`, `Configured input value socket "${configuredIndex}" has the wrong type.`);
                }
            }
        }
        if (isConfigurationValid && configuration.value && property.generatesCaseInputValueSockets) {
            const defaultType = node.values?.default ? _resolveValueTypeIndex(node.values.default, graph, declarations) : undefined;
            for (const caseValue of configuration.value) {
                const socket = node.values?.[String(caseValue)];
                if (!socket) {
                    _addError(diagnostics, `${path}/values/${caseValue}`, `Required case input value socket "${caseValue}" is missing.`);
                } else if (defaultType !== undefined && _resolveValueTypeIndex(socket, graph, declarations) !== defaultType) {
                    _addError(diagnostics, `${path}/values/${caseValue}/type`, `Case input value socket "${caseValue}" must match the default socket type.`);
                }
            }
        }
        if (isConfigurationValid && configuration.value && property.pointerTemplate && typeof configuration.value[0] === "string") {
            for (const socketDefinition of _getPointerTemplateSockets(configuration.value[0])) {
                const socket = node.values?.[socketDefinition.name];
                const expectedType = graph.types?.findIndex((type) => type.signature === socketDefinition.signature) ?? -1;
                if (!socket) {
                    _addError(diagnostics, `${path}/values/${socketDefinition.name}`, `Required pointer template input "${socketDefinition.name}" is missing.`);
                } else if (expectedType < 0 || _resolveValueTypeIndex(socket, graph, declarations) !== expectedType) {
                    _addError(
                        diagnostics,
                        `${path}/values/${socketDefinition.name}/type`,
                        `Pointer template input "${socketDefinition.name}" must have type "${socketDefinition.signature}".`
                    );
                }
            }
        }
    }

    for (const [key, property] of Object.entries(mapping.inputs?.values ?? {})) {
        if (!key.startsWith("[") && !node.values?.[key]) {
            _addError(diagnostics, `${path}/values/${key}`, `Required input value socket "${key}" is missing.`);
        }
        const expectedSignature = property.gltfType === "number" ? "float" : property.gltfType === "boolean" ? "bool" : property.gltfType;
        const source = node.values?.[key];
        if (source && expectedSignature && expectedSignature in gltfTypeToBabylonType) {
            const typeIndex = _resolveValueTypeIndex(source, graph, declarations);
            if (typeIndex !== undefined && graph.types?.[typeIndex]?.signature !== expectedSignature) {
                _addError(diagnostics, `${path}/values/${key}/type`, `Input value socket "${key}" must have type "${expectedSignature}".`);
            }
        }
    }
    if (mapping.validation) {
        try {
            const validationNode = _cloneJson(node);
            for (const value of Object.values(validationNode.values ?? {})) {
                if (value.type === undefined) {
                    value.type = _resolveValueTypeIndex(value, graph, declarations);
                }
            }
            const result = mapping.validation(validationNode, graph);
            if (!result.valid) {
                _addError(diagnostics, path, result.error ?? `Operation "${declarationModel.operation}" is invalid.`);
            }
        } catch (error) {
            _addError(diagnostics, path, (error as Error).message);
        }
    }
    for (const [key, value] of Object.entries(node.values ?? {})) {
        if (declarationModel.support === "unsupported-extension" && !declarationModel.source.inputValueSockets?.[key]) {
            _addError(diagnostics, `${path}/values/${key}`, `Input value socket "${key}" is not defined by operation "${declarationModel.operation}".`);
        }
        if ("node" in value) {
            if ("value" in value) {
                _addError(diagnostics, `${path}/values/${key}`, "An input value socket cannot define both inline and node sources.");
            }
            if (!_isValidIndex(value.node, graph.nodes?.length ?? 0)) {
                _addError(diagnostics, `${path}/values/${key}/node`, `Node index ${String(value.node)} is out of range.`);
                continue;
            }
            if (value.node >= nodeIndex) {
                _addError(diagnostics, `${path}/values/${key}/node`, "Value connections must reference an earlier node.");
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
                const hasMappedSocket = _matchesSocket(sourceMapping?.outputs?.values, sourceSocket, "value");
                if (sourceMapping && !hasMappedSocket) {
                    _addError(diagnostics, `${path}/values/${key}/socket`, `Output value socket "${sourceSocket}" does not exist on node ${value.node}.`);
                }
                const declaredOutputType = sourceDeclaration.source.outputValueSockets?.[sourceSocket]?.type;
                const effectiveOutputType = declaredOutputType ?? _resolveOutputTypeIndex(value.node, sourceSocket, graph, declarations);
                if (value.type !== undefined && effectiveOutputType !== undefined && value.type !== effectiveOutputType) {
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
        if (flow.node <= nodeIndex) {
            _addError(diagnostics, `${path}/flows/${key}/node`, "Flow connections must reference a later node.");
        }
    }
}

/**
 * Creates and validates a canonical copy of one KHR_interactivity graph.
 * @param graph source graph
 * @param index graph index in the root extension
 * @param supportedExtensions enabled extensions that may provide executable operations
 * @param assetNodeCount number of nodes in the containing glTF asset
 * @returns the canonical graph model
 */
export function CreateKHRInteractivityGraphModel(
    graph: IKHRInteractivity_Graph,
    index: number = 0,
    supportedExtensions?: ReadonlySet<string>,
    assetNodeCount?: number
): IKHRInteractivityGraphModel {
    graph = CloneKHRInteractivityGraph(graph);
    const diagnostics: IKHRInteractivityDiagnostic[] = [];
    const path = `/extensions/KHR_interactivity/graphs/${index}`;
    for (const key of ["types", "variables", "events", "declarations", "nodes"] as const) {
        if (graph[key] && graph[key]!.length === 0) {
            _addError(diagnostics, `${path}/${key}`, `"${key}" must contain at least one item when present.`);
        }
    }
    for (let eventIndex = 0; eventIndex < (graph.events?.length ?? 0); eventIndex++) {
        if (graph.events![eventIndex].values && Object.keys(graph.events![eventIndex].values!).length === 0) {
            _addError(diagnostics, `${path}/events/${eventIndex}/values`, '"values" must contain at least one property when present.');
        }
    }
    for (let declarationIndex = 0; declarationIndex < (graph.declarations?.length ?? 0); declarationIndex++) {
        const declaration = graph.declarations![declarationIndex];
        for (const key of ["inputValueSockets", "outputValueSockets"] as const) {
            if (declaration[key] && Object.keys(declaration[key]!).length === 0) {
                _addError(diagnostics, `${path}/declarations/${declarationIndex}/${key}`, `"${key}" must contain at least one property when present.`);
            }
        }
    }
    for (let nodeIndex = 0; nodeIndex < (graph.nodes?.length ?? 0); nodeIndex++) {
        const node = graph.nodes![nodeIndex];
        for (const key of ["configuration", "values", "flows"] as const) {
            if (node[key] && Object.keys(node[key]!).length === 0) {
                _addError(diagnostics, `${path}/nodes/${nodeIndex}/${key}`, `"${key}" must contain at least one property when present.`);
            }
        }
    }
    const declarationKeys = new Set<string>();
    const declarations = (graph.declarations ?? []).map((declaration, declarationIndex) => {
        const inputSockets = Object.keys(declaration.inputValueSockets ?? {})
            .sort()
            .map((key) => `${JSON.stringify(key)}:${declaration.inputValueSockets![key].type}`)
            .join(",");
        const declarationKey = `${JSON.stringify(declaration.op)}:${JSON.stringify(declaration.extension ?? "")}:${inputSockets}`;
        if (declarationKeys.has(declarationKey)) {
            _addError(diagnostics, `${path}/declarations/${declarationIndex}`, "Duplicate equivalent declaration.");
        }
        declarationKeys.add(declarationKey);
        const { support } = _getDeclarationMapping(declaration, graph, supportedExtensions);
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
        const eventId = graph.events![eventIndex].id;
        if (eventId !== undefined && graph.events!.slice(0, eventIndex).some((event) => event.id === eventId)) {
            _addError(diagnostics, `${path}/events/${eventIndex}/id`, `Duplicate event id "${eventId}".`);
        }
        for (const [socket, value] of Object.entries(graph.events![eventIndex].values ?? {})) {
            _validateValue(value, graph, diagnostics, `${path}/events/${eventIndex}/values/${socket}`);
        }
    }
    for (let nodeIndex = 0; nodeIndex < (graph.nodes?.length ?? 0); nodeIndex++) {
        _validateNode(graph.nodes![nodeIndex], nodeIndex, graph, declarations, diagnostics, path, assetNodeCount);
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
 * @param assetNodeCount number of nodes in the containing glTF asset
 * @returns the canonical document
 */
export function CreateKHRInteractivityDocument(extension: IKHRInteractivity, supportedExtensions?: ReadonlySet<string>, assetNodeCount?: number): IKHRInteractivityDocument {
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
        graphs: (source.graphs ?? []).map((graph, index) => CreateKHRInteractivityGraphModel(graph, index, supportedExtensions, assetNodeCount)),
        diagnostics,
    };
}
