import { type IKHRInteractivity_Graph, type IKHRInteractivity_Node, type IKHRInteractivity_OutputSocketReference, type IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import { type IGLTF } from "../../glTFLoaderInterfaces";
import { type IGLTFToFlowGraphMapping, getMappingForDeclaration, getNoOpMappingForDeclaration } from "./declarationMapper";
import { Logger } from "core/Misc/logger";
import { type ISerializedFlowGraph, type ISerializedFlowGraphBlock, type ISerializedFlowGraphConnection, type ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import { RandomGUID } from "core/Misc/guid";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
import { CloneKHRInteractivityGraph, gltfTypeToBabylonType, type IKHRInteractivityDeclarationModel } from "./interactivityGraphModel";

/**
 * Description of a KHR_interactivity custom event, as parsed from the
 * glTF `events` array. Used by the importer to register the event with the
 * FlowGraph send/receive event blocks.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface InteractivityEvent {
    /** Identifier of the event, used to match send and receive blocks. */
    eventId: string;
    /**
     * Optional payload schema for the event. Each entry describes one
     * value carried by the event: an `id` (the FlowGraph data socket name),
     * a `type` (glTF interactivity type name) and an optional default
     * `value`. `eventData` (the boolean) is currently unused.
     */
    eventData?: {
        eventData: boolean;
        id: string;
        type: string;
        value?: any;
    }[];
}
export { gltfTypeToBabylonType } from "./interactivityGraphModel";

/**
 * Parses a KHR_interactivity graph definition (the raw glTF JSON object) into
 * the serialized FlowGraph form consumed by {@link ParseFlowGraphAsync}.
 *
 * The class walks the interactivity types, declarations, variables, events
 * and nodes in order and emits an {@link ISerializedFlowGraph} via
 * {@link serializeToFlowGraph}.
 */
export class InteractivityGraphToFlowGraphParser {
    /**
     * Note - the graph should be rejected if the same type is defined twice.
     * We currently don't validate that.
     */
    private _types: { length: number; flowGraphType: FlowGraphTypes; elementType: "number" | "boolean" | "string" | "any" }[] = [];
    private _mappings: { flowGraphMapping: IGLTFToFlowGraphMapping; fullOperationName: string; declaration: IKHRInteractivityDeclarationModel }[] = [];
    private _staticVariables: { type: FlowGraphTypes; value: any[] }[] = [];
    private _events: InteractivityEvent[] = [];
    private _internalEventsCounter: number = 0;
    private _nodes: { blocks: ISerializedFlowGraphBlock[]; fullOperationName: string }[] = [];
    /**
     * Extra blocks the parser inserts between existing nodes (e.g. the seconds→frames multiply for
     * connected animation-time inputs). Kept separate from any node's `blocks` array so per-node
     * post-processing that indexes into that array (such as the animation extraProcessors targeting
     * the last block) is not disturbed, then concatenated into the serialized graph.
     */
    private _insertedBlocks: ISerializedFlowGraphBlock[] = [];

    constructor(
        interactivityGraph: IKHRInteractivity_Graph,
        private _gltf: IGLTF,
        public _animationTargetFps: number = 60,
        private _graphIndex: number = 0,
        private _supportedExtensions?: ReadonlySet<string>,
        private _declarationModels?: readonly IKHRInteractivityDeclarationModel[]
    ) {
        this._interactivityGraph = CloneKHRInteractivityGraph(interactivityGraph);
        // start with types
        this._parseTypes();
        // continue with declarations
        this._parseDeclarations();
        this._parseVariables();
        this._parseEvents();
        this._parseNodes();
    }

    private _interactivityGraph: IKHRInteractivity_Graph;

    private get _strictValidation(): boolean {
        return !!this._declarationModels;
    }

    private _hasDefaultFlowInput(operation: string): boolean {
        return (
            operation.startsWith("flow/") ||
            operation.startsWith("animation/") ||
            operation === "pointer/set" ||
            operation === "pointer/interpolate" ||
            operation === "variable/set" ||
            operation === "variable/interpolate" ||
            operation === "event/send" ||
            operation === "event/stopPropagation" ||
            operation === "flow/log:BABYLON"
        );
    }

    private _getAllowedDynamicValueSockets(operation: string, node: IKHRInteractivity_Node, direction: "input" | "output"): ReadonlySet<string> | undefined {
        if ((operation === "event/send" && direction === "input") || (operation === "event/receive" && direction === "output")) {
            const eventIndex = node.configuration?.event?.value?.[0];
            if (typeof eventIndex === "number") {
                return new Set(Object.keys(this._interactivityGraph.events?.[eventIndex]?.values ?? {}));
            }
        }
        if (operation === "variable/set" && direction === "input") {
            return new Set((node.configuration?.variables?.value ?? []).map(String));
        }
        if (operation === "math/switch" && direction === "input") {
            return new Set((node.configuration?.cases?.value ?? []).map(String));
        }
        if ((operation === "pointer/get" || operation === "pointer/set" || operation === "pointer/interpolate") && direction === "input") {
            const pointer = node.configuration?.pointer?.value?.[0];
            if (typeof pointer === "string") {
                return new Set(
                    pointer
                        .split("/")
                        .filter((segment) => (segment.startsWith("[") && !segment.startsWith("[[")) || (segment.startsWith("{") && !segment.startsWith("{{")))
                        .map((segment) =>
                            segment
                                .substring(1, segment.length - 1)
                                .replace(/~1/g, "/")
                                .replace(/~0/g, "~")
                        )
                );
            }
        }
        return undefined;
    }

    private _getAllowedDynamicFlowSockets(node: IKHRInteractivity_Node, mapping: IGLTFToFlowGraphMapping, direction: "input" | "output"): ReadonlySet<string> | undefined {
        for (const [key, property] of Object.entries(mapping.configuration ?? {})) {
            const generatesSockets = direction === "input" ? property.generatesInputFlowSockets : property.generatesOutputFlowSockets;
            if (!generatesSockets) {
                continue;
            }
            const configuredValues = node.configuration?.[key]?.value;
            const validValues =
                configuredValues &&
                configuredValues.length > 0 &&
                (property.configurationType !== "int" || configuredValues.length === 1) &&
                configuredValues.every(
                    (value) => typeof value === "number" && Number.isInteger(value) && value >= (property.minimum ?? -2147483648) && value <= (property.maximum ?? 2147483647)
                );
            const values = validValues ? configuredValues : property.defaultValue;
            if (direction === "input") {
                const count = Array.isArray(values) && typeof values[0] === "number" ? values[0] : 0;
                return new Set(Array.from({ length: count }, (_, index) => String(index)));
            }
            return new Set(Array.isArray(values) ? values.map(String) : []);
        }
        return undefined;
    }

    public get arrays() {
        return {
            types: this._types,
            mappings: this._mappings,
            staticVariables: this._staticVariables,
            events: this._events,
            nodes: this._nodes,
        };
    }

    private _parseTypes() {
        if (!this._interactivityGraph.types) {
            return;
        }
        for (const type of this._interactivityGraph.types) {
            this._types.push(gltfTypeToBabylonType[type.signature]);
        }
    }

    private _parseDeclarations() {
        if (!this._interactivityGraph.declarations) {
            return;
        }
        for (let index = 0; index < this._interactivityGraph.declarations.length; index++) {
            const declaration = this._interactivityGraph.declarations[index];
            const declarationModel = this._declarationModels?.[index];
            const extensionEnabled = !declaration.extension || !this._supportedExtensions || this._supportedExtensions.has(declaration.extension);
            const supportedMapping =
                declarationModel?.support === "unsupported-extension" ? undefined : extensionEnabled ? getMappingForDeclaration(declaration, false) : undefined;
            if (!supportedMapping && !declaration.extension) {
                throw new Error(`Unknown core KHR_interactivity operation "${declaration.op}".`);
            }
            const mapping = supportedMapping ?? (declaration.extension ? getNoOpMappingForDeclaration(declaration) : undefined);
            if (!mapping) {
                Logger.Error(["No mapping found for declaration", declaration]);
                throw new Error("Error parsing declarations");
            }
            this._mappings.push({
                flowGraphMapping: mapping,
                fullOperationName: declaration.extension ? declaration.op + ":" + declaration.extension : declaration.op,
                declaration:
                    declarationModel ??
                    ({
                        index,
                        operation: declaration.extension ? `${declaration.op}:${declaration.extension}` : declaration.op,
                        support: supportedMapping ? (declaration.extension ? "extension" : "core") : "unsupported-extension",
                        source: declaration,
                    } satisfies IKHRInteractivityDeclarationModel),
            });
        }
    }

    private _parseVariables() {
        if (!this._interactivityGraph.variables) {
            return;
        }
        for (const variable of this._interactivityGraph.variables) {
            const parsed = this._parseVariable(variable);
            // set the default values here
            this._staticVariables.push(parsed);
        }
    }

    private _parseVariable(variable: IKHRInteractivity_Variable, dataTransform?: (value: any, parser: InteractivityGraphToFlowGraphParser) => any) {
        const type = this._types[variable.type];
        if (!type) {
            Logger.Error(["No type found for variable", variable]);
            throw new Error("Error parsing variables");
        }
        if (variable.value) {
            if (variable.value.length !== type.length) {
                Logger.Error(["Invalid value length for variable", variable, type]);
                throw new Error("Error parsing variables");
            }
        }
        const value = variable.value ? variable.value.slice() : [];
        if (!value.length) {
            switch (type.flowGraphType) {
                case FlowGraphTypes.Boolean:
                    value.push(false);
                    break;
                case FlowGraphTypes.Integer:
                    value.push(0);
                    break;
                case FlowGraphTypes.Number:
                    value.push(NaN);
                    break;
                case FlowGraphTypes.String:
                    // Default for a `ref`-typed value is the null reference, encoded as the empty string.
                    value.push("" as any);
                    break;
                case FlowGraphTypes.Vector2:
                    value.push(NaN, NaN);
                    break;
                case FlowGraphTypes.Vector3:
                    value.push(NaN, NaN, NaN);
                    break;
                case FlowGraphTypes.Vector4:
                case FlowGraphTypes.Matrix2D:
                case FlowGraphTypes.Quaternion:
                    value.push(NaN, NaN, NaN, NaN);
                    break;
                case FlowGraphTypes.Matrix:
                    for (let i = 0; i < 16; i++) {
                        value.push(NaN);
                    }
                    break;
                case FlowGraphTypes.Matrix3D:
                    for (let i = 0; i < 9; i++) {
                        value.push(NaN);
                    }
                    break;
                default:
                    break;
            }
        }
        // in case of NaN, Infinity, we need to parse the string to the object itself
        if (type.elementType === "number" && typeof value[0] === "string") {
            value[0] = parseFloat(value[0]);
        }
        return { type: type.flowGraphType, value: dataTransform ? dataTransform(value, this) : value };
    }

    private _parseEvents() {
        if (!this._interactivityGraph.events) {
            return;
        }
        for (const event of this._interactivityGraph.events) {
            const converted: InteractivityEvent = {
                eventId: event.id || "internalEvent_" + this._internalEventsCounter++,
            };
            if (event.values) {
                converted.eventData = Object.keys(event.values).map((key) => {
                    const eventValue = event.values?.[key];
                    if (!eventValue) {
                        Logger.Error(["No value found for event key", key]);
                        throw new Error("Error parsing events");
                    }
                    const type = this._types[eventValue.type];
                    if (!type) {
                        Logger.Error(["No type found for event value", eventValue]);
                        throw new Error("Error parsing events");
                    }
                    const value = typeof eventValue.value !== "undefined" ? this._parseVariable(eventValue) : undefined;
                    return {
                        id: key,
                        type: type.flowGraphType,
                        eventData: true,
                        value,
                    };
                });
            }
            this._events.push(converted);
        }
    }

    private _parseNodes() {
        if (!this._interactivityGraph.nodes) {
            return;
        }
        for (let nodeIndex = 0; nodeIndex < this._interactivityGraph.nodes.length; nodeIndex++) {
            const node = this._interactivityGraph.nodes[nodeIndex];
            // some validation
            if (typeof node.declaration !== "number") {
                Logger.Error(["No declaration found for node", node]);
                throw new Error("Error parsing nodes");
            }
            const mapping = this._mappings[node.declaration];
            if (!mapping) {
                Logger.Error(["No mapping found for node", node]);
                throw new Error("Error parsing nodes");
            }
            if (mapping.flowGraphMapping.validation) {
                const validationResult = mapping.flowGraphMapping.validation(node, this._interactivityGraph, this._gltf);
                if (!validationResult.valid) {
                    throw new Error(`Error validating interactivity node ${this._interactivityGraph.declarations?.[node.declaration].op} - ${validationResult.error}`);
                }
            }
            const blocks: ISerializedFlowGraphBlock[] = [];
            if (mapping.declaration.support === "unsupported-extension") {
                blocks.push(this._createUnsupportedExtensionBlock(node, nodeIndex, mapping));
            }
            // create block(s) for this node using the mapping
            for (let role = 0; role < mapping.flowGraphMapping.blocks.length; role++) {
                const blockType = mapping.flowGraphMapping.blocks[role];
                const block = this._getEmptyBlock(blockType, mapping.fullOperationName, nodeIndex, node.declaration, role);
                this._parseNodeConfiguration(node, block, mapping.flowGraphMapping, blockType);
                blocks.push(block);
            }
            this._nodes.push({ blocks, fullOperationName: mapping.fullOperationName });
        }
    }

    private _getEmptyBlock(className: string, type: string, nodeIndex?: number, declarationIndex?: number, role?: number): ISerializedFlowGraphBlock {
        return {
            uniqueId: RandomGUID(),
            className,
            dataInputs: [],
            dataOutputs: [],
            signalInputs: [],
            signalOutputs: [],
            config: {},
            type,
            metadata:
                nodeIndex === undefined
                    ? {}
                    : {
                          khrInteractivity: {
                              graphIndex: this._graphIndex,
                              nodeIndex,
                              declarationIndex,
                              operation: type,
                              role: role ?? 0,
                              sourcePath: `/extensions/KHR_interactivity/graphs/${this._graphIndex}/nodes/${nodeIndex}`,
                          },
                      },
        };
    }

    private _createUnsupportedExtensionBlock(
        node: IKHRInteractivity_Node,
        nodeIndex: number,
        mapping: { flowGraphMapping: IGLTFToFlowGraphMapping; fullOperationName: string; declaration: IKHRInteractivityDeclarationModel }
    ): ISerializedFlowGraphBlock {
        const block = this._getEmptyBlock("KHR_interactivity/FlowGraphUnsupportedInteractivityBlock", mapping.fullOperationName, nodeIndex, node.declaration, 0);
        const inputFlowSockets = new Set<string>();
        for (const sourceNode of this._interactivityGraph.nodes ?? []) {
            for (const flow of Object.values(sourceNode.flows ?? {})) {
                if (flow.node === nodeIndex) {
                    inputFlowSockets.add(flow.socket ?? "in");
                }
            }
        }
        const toSockets = (sockets: typeof mapping.declaration.source.inputValueSockets) =>
            Object.entries(sockets ?? {}).map(([name, definition]) => ({
                name,
                type: this._types[definition.type]?.flowGraphType,
                signature: this._interactivityGraph.types?.[definition.type]?.signature,
            }));
        block.config = {
            operation: mapping.fullOperationName,
            inputValueSockets: toSockets(mapping.declaration.source.inputValueSockets),
            outputValueSockets: toSockets(mapping.declaration.source.outputValueSockets),
            inputFlowSockets: Array.from(inputFlowSockets).sort(),
            outputFlowSockets: Object.keys(node.flows ?? {}).sort(),
        };
        for (const socket of block.config.inputValueSockets) {
            block.dataInputs.push(this._createNewSocketConnection(socket.name));
        }
        for (const socket of block.config.outputValueSockets) {
            block.dataOutputs.push(this._createNewSocketConnection(socket.name, true));
        }
        for (const socket of block.config.inputFlowSockets) {
            block.signalInputs.push(this._createNewSocketConnection(socket));
        }
        for (const socket of block.config.outputFlowSockets) {
            block.signalOutputs.push(this._createNewSocketConnection(socket, true));
        }
        return block;
    }

    private _parseNodeConfiguration(node: IKHRInteractivity_Node, block: ISerializedFlowGraphBlock, nodeMapping: IGLTFToFlowGraphMapping, blockType: FlowGraphBlockNames | string) {
        const gltfConfiguration = node.configuration;
        if (gltfConfiguration) {
            for (const key in gltfConfiguration) {
                const gltfProperty = gltfConfiguration[key];
                if (!gltfProperty) {
                    throw new Error("Error parsing node configuration");
                }

                const propertyMapping = nodeMapping.configuration?.[key];
                if (!propertyMapping && this._strictValidation) {
                    continue;
                }
                if (propertyMapping?.validationOnly) {
                    continue;
                }
                const belongsToBlock = propertyMapping && propertyMapping.toBlock ? propertyMapping.toBlock === blockType : nodeMapping.blocks.indexOf(blockType) === 0;
                if (belongsToBlock) {
                    let value = propertyMapping?.defaultValue;
                    if (gltfProperty?.value) {
                        value = gltfProperty.value;
                    }

                    if (!propertyMapping?.isArray) {
                        if (value.length !== 1) {
                            Logger.Warn(`Invalid non-array value length: ${value.length}`);
                        }

                        value = value[0];
                    }

                    if (propertyMapping?.dataTransformer) {
                        value = propertyMapping.dataTransformer(value, this);
                    }

                    if (value !== undefined) {
                        // Update the flow graph block config.
                        block.config[propertyMapping?.name || key] = {
                            value: value,
                        };
                    }
                }
            }
        }
    }

    private _parseNodeConnections(context: ISerializedFlowGraphContext) {
        for (let i = 0; i < this._nodes.length; i++) {
            // get the corresponding gltf node
            const gltfNode = this._interactivityGraph.nodes?.[i];
            if (!gltfNode) {
                // should never happen but let's still check
                Logger.Error(["No node found for interactivity node", this._nodes[i]]);
                throw new Error("Error parsing node connections");
            }
            const flowGraphBlocks = this._nodes[i];
            const outputMapper = this._mappings[gltfNode.declaration];
            // validate
            if (!outputMapper) {
                Logger.Error(["No mapping found for node", gltfNode]);
                throw new Error("Error parsing node connections");
            }
            // KHR_interactivity spec section 3.2.4 "Unsupported Operations":
            // nodes referring to unsupported operations are demoted to no-ops.
            // Activations of their input flow sockets are ignored, their output
            // flow sockets are never activated, and their output value sockets
            // return constant type-default values. They have no backing
            // FlowGraph blocks (blocks.length === 0), so there is nothing to
            // wire for this node — skip all of its connections.
            if (flowGraphBlocks.blocks.length === 0) {
                Logger.Warn(`Skipping connections for no-op node #${i} (unsupported operation: ${flowGraphBlocks.fullOperationName})`);
                continue;
            }
            const flowsFromGLTF = gltfNode.flows || {};
            const flowsKeys = Object.keys(flowsFromGLTF).sort(); // sorting as some operations require sorted keys
            // connect the flows
            for (const flowKey of flowsKeys) {
                const flow = flowsFromGLTF[flowKey];
                let flowMapping = outputMapper.flowGraphMapping.outputs?.flows?.[flowKey];
                let outputArrayMapping = false;
                if (!flowMapping) {
                    for (const key in outputMapper.flowGraphMapping.outputs?.flows) {
                        if (key.startsWith("[") && key.endsWith("]")) {
                            outputArrayMapping = true;
                            flowMapping = outputMapper.flowGraphMapping.outputs?.flows?.[key];
                            break;
                        }
                    }
                }
                const allowedDynamicOutputs = outputArrayMapping ? this._getAllowedDynamicFlowSockets(gltfNode, outputMapper.flowGraphMapping, "output") : undefined;
                if (this._strictValidation && allowedDynamicOutputs && !allowedDynamicOutputs.has(flowKey)) {
                    flowMapping = undefined;
                }
                if (this._strictValidation && !flowMapping) {
                    continue;
                }
                const socketOutName = flowMapping ? (outputArrayMapping ? flowMapping.name.replace("$1", flowKey) : flowMapping.name) : flowKey;
                // get the input node of this block
                const inputNodeId = flow.node;
                const nodeIn = this._nodes[inputNodeId];
                if (!nodeIn) {
                    Logger.Error(["No node found for input node id", inputNodeId]);
                    throw new Error("Error parsing node connections");
                }
                // Spec 3.2.4: input flow activations on no-op nodes are ignored,
                // so a flow connection into a no-op target is itself a no-op.
                // Drop it instead of crashing on the missing target block.
                if (nodeIn.blocks.length === 0) {
                    Logger.Warn(`Dropping flow connection from node #${i} "${flowKey}" to no-op node #${inputNodeId} (unsupported operation: ${nodeIn.fullOperationName})`);
                    continue;
                }
                // create a serialized socket
                const block = (flowMapping && flowMapping.toBlock && flowGraphBlocks.blocks.find((b) => b.className === flowMapping.toBlock)) || flowGraphBlocks.blocks[0];
                const socketOut = block.signalOutputs.find((socket) => socket.name === socketOutName) ?? this._createNewSocketConnection(socketOutName, true);
                if (!block.signalOutputs.includes(socketOut)) {
                    block.signalOutputs.push(socketOut);
                }
                // get the mapper for the input node - in case it mapped to multiple blocks
                const inputMapper = this._mappings[this._interactivityGraph.nodes![inputNodeId].declaration]?.flowGraphMapping;
                if (!inputMapper) {
                    Logger.Error(["No mapping found for input node", nodeIn]);
                    throw new Error("Error parsing node connections");
                }
                let flowInMapping = inputMapper.inputs?.flows?.[flow.socket || "in"];
                let arrayMapping = false;
                if (!flowInMapping) {
                    for (const key in inputMapper.inputs?.flows) {
                        if (key.startsWith("[") && key.endsWith("]")) {
                            arrayMapping = true;
                            flowInMapping = inputMapper.inputs?.flows?.[key];
                        }
                    }
                    const allowedDynamicInputs = arrayMapping ? this._getAllowedDynamicFlowSockets(this._interactivityGraph.nodes![inputNodeId], inputMapper, "input") : undefined;
                    if (this._strictValidation && allowedDynamicInputs && !allowedDynamicInputs.has(flow.socket ?? "in")) {
                        flowInMapping = undefined;
                    }
                    if (!flowInMapping && (flow.socket ?? "in") === "in" && this._hasDefaultFlowInput(nodeIn.fullOperationName)) {
                        flowInMapping = { name: "in" };
                    }
                    if (this._strictValidation && !flowInMapping) {
                        continue;
                    }
                }
                const nodeInSocketName = flowInMapping ? (arrayMapping ? flowInMapping.name.replace("$1", flow.socket || "") : flowInMapping.name) : flow.socket || "in";
                const inputBlock = (flowInMapping && flowInMapping.toBlock && nodeIn.blocks.find((b) => b.className === flowInMapping.toBlock)) || nodeIn.blocks[0];
                // in all of the flow graph input connections, find the one with the same name as the socket
                let socketIn = inputBlock.signalInputs.find((s) => s.name === nodeInSocketName);
                // if the socket doesn't exist, create the input socket for the connection
                if (!socketIn) {
                    socketIn = this._createNewSocketConnection(nodeInSocketName);
                    inputBlock.signalInputs.push(socketIn);
                }
                // connect the sockets
                socketIn.connectedPointIds.push(socketOut.uniqueId);
                socketOut.connectedPointIds.push(socketIn.uniqueId);
            }
            // connect the values
            const valuesFromGLTF = gltfNode.values || {};
            const valuesKeys = Object.keys(valuesFromGLTF);
            for (const valueKey of valuesKeys) {
                const value = valuesFromGLTF[valueKey];
                let valueMapping = outputMapper.flowGraphMapping.inputs?.values?.[valueKey];
                let arrayMapping = false;
                if (!valueMapping) {
                    for (const key in outputMapper.flowGraphMapping.inputs?.values) {
                        if (key.startsWith("[") && key.endsWith("]")) {
                            arrayMapping = true;
                            valueMapping = outputMapper.flowGraphMapping.inputs?.values?.[key];
                        }
                    }
                }
                const allowedDynamicInputs = arrayMapping ? this._getAllowedDynamicValueSockets(outputMapper.fullOperationName, gltfNode, "input") : undefined;
                if (this._strictValidation && (!valueMapping || (allowedDynamicInputs && !allowedDynamicInputs.has(valueKey)))) {
                    continue;
                }
                const socketInName = valueMapping ? (arrayMapping ? valueMapping.name.replace("$1", valueKey) : valueMapping.name) : valueKey;
                // create a serialized socket
                const block = (valueMapping && valueMapping.toBlock && flowGraphBlocks.blocks.find((b) => b.className === valueMapping.toBlock)) || flowGraphBlocks.blocks[0];
                const socketIn = block.dataInputs.find((socket) => socket.name === socketInName) ?? this._createNewSocketConnection(socketInName);
                if (!block.dataInputs.includes(socketIn)) {
                    block.dataInputs.push(socketIn);
                }
                // Captured before the connected branch below shadows `valueMapping`. When set and the
                // value is supplied by a connection, the seconds→frames `dataTransformer` cannot run
                // (it is parse-time only), so the raw connected value is scaled by a runtime multiply.
                const convertConnectedTimeToFrames = !!valueMapping?.convertConnectedTimeToFrames;
                if ((value as IKHRInteractivity_Variable).value !== undefined) {
                    const convertedValue = this._parseVariable(value as IKHRInteractivity_Variable, valueMapping && valueMapping.dataTransformer);
                    context._connectionValues[socketIn.uniqueId] = convertedValue;
                } else if (typeof (value as IKHRInteractivity_OutputSocketReference).node !== "undefined") {
                    const nodeOutId = (value as IKHRInteractivity_OutputSocketReference).node;
                    const nodeOutSocketName = (value as IKHRInteractivity_OutputSocketReference).socket || "value";
                    const nodeOut = this._nodes[nodeOutId];
                    if (!nodeOut) {
                        Logger.Error(["No node found for output socket reference", value]);
                        throw new Error("Error parsing node connections");
                    }
                    // Spec 3.2.4: output value sockets of no-op nodes return
                    // constant type-default values. Leave the consumer's
                    // dataInput unconnected (no connectedPointIds) so the
                    // FlowGraph runtime falls back to the RichType default.
                    if (nodeOut.blocks.length === 0) {
                        Logger.Warn(
                            `Dropping value connection from no-op node #${nodeOutId} (unsupported operation: ${nodeOut.fullOperationName}) into node #${i} "${valueKey}"; consumer will use type-default value`
                        );
                        continue;
                    }
                    const outputMapper = this._mappings[this._interactivityGraph.nodes![nodeOutId].declaration]?.flowGraphMapping;
                    if (!outputMapper) {
                        Logger.Error(["No mapping found for output socket reference", value]);
                        throw new Error("Error parsing node connections");
                    }
                    let valueMapping = outputMapper.outputs?.values?.[nodeOutSocketName];
                    let arrayMapping = false;
                    // check if there is an array mapping defined
                    if (!valueMapping) {
                        // search for a value mapping that has an array mapping
                        for (const key in outputMapper.outputs?.values) {
                            if (key.startsWith("[") && key.endsWith("]")) {
                                arrayMapping = true;
                                valueMapping = outputMapper.outputs?.values?.[key];
                            }
                        }
                        const allowedDynamicOutputs = arrayMapping
                            ? this._getAllowedDynamicValueSockets(nodeOut.fullOperationName, this._interactivityGraph.nodes![nodeOutId], "output")
                            : undefined;
                        if (this._strictValidation && (!valueMapping || (allowedDynamicOutputs && !allowedDynamicOutputs.has(nodeOutSocketName)))) {
                            continue;
                        }
                    }
                    const socketOutName = valueMapping ? (arrayMapping ? valueMapping.name.replace("$1", nodeOutSocketName) : valueMapping?.name) : nodeOutSocketName;
                    const outBlock = (valueMapping && valueMapping.toBlock && nodeOut.blocks.find((b) => b.className === valueMapping.toBlock)) || nodeOut.blocks[0];
                    let socketOut = outBlock.dataOutputs.find((s) => s.name === socketOutName);
                    // if the socket doesn't exist, create it
                    if (!socketOut) {
                        socketOut = this._createNewSocketConnection(socketOutName, true);
                        outBlock.dataOutputs.push(socketOut);
                    }
                    // connect the sockets
                    if (convertConnectedTimeToFrames) {
                        this._connectWithSecondsToFramesConversion(context, socketOut, socketIn, i, gltfNode.declaration);
                    } else {
                        socketIn.connectedPointIds.push(socketOut.uniqueId);
                        socketOut.connectedPointIds.push(socketIn.uniqueId);
                    }
                } else {
                    Logger.Error(["Invalid value for value connection", value]);
                    throw new Error("Error parsing node connections");
                }
            }

            // inter block connections
            if (outputMapper.flowGraphMapping.interBlockConnectors) {
                for (const connector of outputMapper.flowGraphMapping.interBlockConnectors) {
                    const input = connector.input;
                    const output = connector.output;
                    const isVariable = connector.isVariable;
                    this._connectFlowGraphNodes(input, output, flowGraphBlocks.blocks[connector.inputBlockIndex], flowGraphBlocks.blocks[connector.outputBlockIndex], isVariable);
                }
            }

            if (outputMapper.flowGraphMapping.extraProcessor) {
                const declaration = this._interactivityGraph.declarations?.[gltfNode.declaration];
                if (!declaration) {
                    Logger.Error(["No declaration found for extra processor", gltfNode]);
                    throw new Error("Error parsing node connections");
                }
                flowGraphBlocks.blocks = outputMapper.flowGraphMapping.extraProcessor(
                    gltfNode,
                    declaration,
                    outputMapper.flowGraphMapping,
                    this,
                    flowGraphBlocks.blocks,
                    context,
                    this._gltf
                );
            }
        }
    }

    private _createNewSocketConnection(name: string, isOutput?: boolean): ISerializedFlowGraphConnection {
        return {
            uniqueId: RandomGUID(),
            name,
            _connectionType: isOutput ? FlowGraphConnectionType.Output : FlowGraphConnectionType.Input,
            connectedPointIds: [],
        };
    }

    /**
     * Wires an upstream data output into a downstream data input through a runtime multiply block that
     * scales the value by the animation target fps. This converts a KHR animation time (seconds),
     * delivered by a connection (e.g. a `pointer/get` on the `maxTime` animation pointer), into the
     * Babylon animation frames expected by the play/stop-animation blocks. Literal times are already
     * converted at parse time by the input's `dataTransformer`, so this is only used for connections.
     * @param context the serialized flow graph context that stores literal socket values
     * @param upstreamOutput the data output socket providing the time value (in seconds)
     * @param downstreamInput the data input socket that expects the time in frames
     * @param nodeIndex source node receiving the converted value
     * @param declarationIndex source declaration used by the receiving node
     */
    private _connectWithSecondsToFramesConversion(
        context: ISerializedFlowGraphContext,
        upstreamOutput: ISerializedFlowGraphConnection,
        downstreamInput: ISerializedFlowGraphConnection,
        nodeIndex: number,
        declarationIndex: number
    ): void {
        const multiplyBlock = this._getEmptyBlock(FlowGraphBlockNames.Multiply, FlowGraphBlockNames.Multiply, nodeIndex, declarationIndex, -1);
        // Scalar (float) multiply; matches how the `math/mul` mapping configures the block.
        multiplyBlock.config = { type: FlowGraphTypes.Number };
        const inputA = this._createNewSocketConnection("a");
        const inputB = this._createNewSocketConnection("b");
        const output = this._createNewSocketConnection("value", true);
        multiplyBlock.dataInputs.push(inputA, inputB);
        multiplyBlock.dataOutputs.push(output);
        // The second factor is the constant animation target fps.
        context._connectionValues[inputB.uniqueId] = { type: FlowGraphTypes.Number, value: [this._animationTargetFps] };
        // upstream time output -> multiply.a
        inputA.connectedPointIds.push(upstreamOutput.uniqueId);
        upstreamOutput.connectedPointIds.push(inputA.uniqueId);
        // multiply.value (frames) -> downstream time input
        downstreamInput.connectedPointIds.push(output.uniqueId);
        output.connectedPointIds.push(downstreamInput.uniqueId);
        // Register the inserted block separately so serializeToFlowGraph picks it up without
        // appending to any node's block list (which would break per-node extraProcessors).
        this._insertedBlocks.push(multiplyBlock);
    }

    private _connectFlowGraphNodes(input: string, output: string, serializedInput: ISerializedFlowGraphBlock, serializedOutput: ISerializedFlowGraphBlock, isVariable?: boolean) {
        const inputArray = isVariable ? serializedInput.dataInputs : serializedInput.signalInputs;
        const outputArray = isVariable ? serializedOutput.dataOutputs : serializedOutput.signalOutputs;
        const inputConnection = inputArray.find((s) => s.name === input) || this._createNewSocketConnection(input);
        const outputConnection = outputArray.find((s) => s.name === output) || this._createNewSocketConnection(output, true);
        // of not found add it to the array
        if (!inputArray.find((s) => s.name === input)) {
            inputArray.push(inputConnection);
        }
        if (!outputArray.find((s) => s.name === output)) {
            outputArray.push(outputConnection);
        }
        // connect the sockets
        inputConnection.connectedPointIds.push(outputConnection.uniqueId);
        outputConnection.connectedPointIds.push(inputConnection.uniqueId);
    }

    /**
     * Returns the deterministic FlowGraph user-variable name used for the
     * static variable at the given declaration index.
     * @param index zero-based index into the interactivity graph's `variables` array.
     * @returns the FlowGraph variable name (e.g. `staticVariable_3`).
     */
    public getVariableName(index: number) {
        return "staticVariable_" + index;
    }

    /**
     * Serializes the parsed interactivity graph into the {@link ISerializedFlowGraph}
     * payload consumed by `ParseFlowGraphAsync`. Performs node-connection wiring
     * and seeds the execution context with the graph's static variables.
     * @returns the serialized FlowGraph for the parsed KHR_interactivity graph.
     */
    public serializeToFlowGraph(): ISerializedFlowGraph {
        const context: ISerializedFlowGraphContext = {
            uniqueId: RandomGUID(),
            _userVariables: {},
            _connectionValues: {},
        };
        this._parseNodeConnections(context);
        for (let i = 0; i < this._staticVariables.length; i++) {
            const variable = this._staticVariables[i];
            context._userVariables[this.getVariableName(i)] = variable;
        }

        const allBlocks = this._nodes.reduce((acc, val) => acc.concat(val.blocks), [] as ISerializedFlowGraphBlock[]).concat(this._insertedBlocks);

        return {
            name: this._interactivityGraph.name ?? `Graph ${this._graphIndex + 1}`,
            rightHanded: true,
            allBlocks,
            executionContexts: [context],
        };
    }
}
