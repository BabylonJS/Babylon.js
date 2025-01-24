import type { IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_OutputSocketReference, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import type { IGLTF } from "../../glTFLoaderInterfaces";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
import type { IGLTFToFlowGraphMapping } from "./declarationMapper";
import { getMappingForDeclaration, getMappingForFullOperationName } from "./declarationMapper";
import { Logger } from "core/Misc/logger";
import type { ISerializedFlowGraph, ISerializedFlowGraphBlock, ISerializedFlowGraphConnection, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import { RandomGUID } from "core/Misc/guid";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";

export interface InteractivityEvent {
    eventId: string;
    eventData?: {
        eventData: boolean;
        id: string;
        type: string;
        value?: any;
    }[];
}
export const gltfTypeToBabylonType: {
    [key: string]: FlowGraphTypes;
} = {
    float: FlowGraphTypes.Number,
    bool: FlowGraphTypes.Boolean,
    float2: FlowGraphTypes.Vector2,
    float3: FlowGraphTypes.Vector3,
    float4: FlowGraphTypes.Vector4,
    float4x4: FlowGraphTypes.Matrix,
    float2x2: FlowGraphTypes.Matrix2D, // we don't have matrix3 and matrix2. We only have 4x4
    float3x3: FlowGraphTypes.Matrix3D, // we don't have matrix3 and matrix2. We only have 4x4
    int: FlowGraphTypes.Integer,
};

export class InteractivityGraphToFlowGraphParser {
    /**
     * Note - the graph should be rejected if the same type is defined twice.
     * We currently don't validate that.
     */
    private _types: FlowGraphTypes[] = [];
    private _mappings: { flowGraphMapping: IGLTFToFlowGraphMapping; fullOperationName: string }[] = [];
    private _staticVariables: { type: FlowGraphTypes; value: any[] }[] = [];
    private _events: InteractivityEvent[] = [];
    private _internalEventsCounter: number = 0;
    private _nodes: { blocks: ISerializedFlowGraphBlock[]; fullOperationName: string }[] = [];

    constructor(
        private _interactivityGraph: IKHRInteractivity_Graph,
        private _gltf: IGLTF
    ) {
        // start with types
        this._parseTypes();
        // continue with declarations
        this._parseDeclarations();
        this._parseVariables();
        this._parseEvents();
        this._parseNodes();
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
        for (const declaration of this._interactivityGraph.declarations) {
            // make sure we have the mapping for this operation
            const mapping = getMappingForDeclaration(declaration);
            // mapping is defined, because we generate an empty mapping if it's not found
            if (!mapping) {
                Logger.Error(["No mapping found for declaration", declaration]);
                throw new Error("Error parsing declarations");
            }
            this._mappings.push({
                flowGraphMapping: mapping,
                fullOperationName: declaration.extension ? declaration.op + ":" + declaration.extension : declaration.op,
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

    private _parseVariable(variable: IKHRInteractivity_Variable) {
        const type = this._types[variable.type];
        if (!type) {
            Logger.Error(["No type found for variable", variable]);
            throw new Error("Error parsing variables");
        }
        const value = variable.value || [];
        if (!value.length) {
            switch (type) {
                case FlowGraphTypes.Boolean:
                    value.push(false);
                    break;
                case FlowGraphTypes.Integer:
                    value.push(0);
                    break;
                case FlowGraphTypes.Number:
                    value.push(NaN);
                    break;
                case FlowGraphTypes.Vector2:
                    value.push(NaN, NaN);
                    break;
                case FlowGraphTypes.Vector3:
                    value.push(NaN, NaN, NaN);
                    break;
                case FlowGraphTypes.Vector4:
                case FlowGraphTypes.Matrix2D:
                    value.push(NaN, NaN, NaN, NaN);
                    break;
                case FlowGraphTypes.Matrix:
                    value.push(NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN);
                    break;
                case FlowGraphTypes.Matrix3D:
                    value.push(NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN);
                    break;
                default:
                    break;
            }
        }
        return { type, value };
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
                // converted.eventData = event.values.map((value) => {
                //     return {
                //         id: value.id,
                //         type: types[value.type],
                //         eventData: true,
                //     };
                // });
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
                    return {
                        id: key,
                        type,
                        eventData: true,
                        value: eventValue.value,
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
        for (const node of this._interactivityGraph.nodes) {
            // some validation
            if (!node.declaration) {
                Logger.Error(["No declaration found for node", node]);
                throw new Error("Error parsing nodes");
            }
            const mapping = this._mappings[node.declaration];
            if (!mapping) {
                Logger.Error(["No mapping found for node", node]);
                throw new Error("Error parsing nodes");
            }
            const blocks: ISerializedFlowGraphBlock[] = [];
            // create block(s) for this node using the mapping
            for (const blockType of mapping.flowGraphMapping.blocks) {
                const block = this._getEmptyBlock(blockType, mapping.fullOperationName);
                this._parseNodeConfiguration(node, block, mapping.flowGraphMapping, blockType);
                blocks.push(block);
            }
            this._nodes.push({ blocks, fullOperationName: mapping.fullOperationName });
        }
    }

    private _getEmptyBlock(className: string, type: string): ISerializedFlowGraphBlock {
        const uniqueId = RandomGUID();
        const dataInputs: ISerializedFlowGraphConnection[] = [];
        const dataOutputs: ISerializedFlowGraphConnection[] = [];
        const signalInputs: ISerializedFlowGraphConnection[] = [];
        const signalOutputs: ISerializedFlowGraphConnection[] = [];
        const config: IFlowGraphBlockConfiguration = {};
        const metadata = {};
        return {
            uniqueId,
            className,
            dataInputs,
            dataOutputs,
            signalInputs,
            signalOutputs,
            config,
            type,
            metadata,
        };
    }

    private _parseNodeConfiguration(node: IKHRInteractivity_Node, block: ISerializedFlowGraphBlock, nodeMapping: IGLTFToFlowGraphMapping, blockType: FlowGraphBlockNames) {
        const configuration = block.config;
        if (node.configuration) {
            Object.keys(node.configuration).forEach((key) => {
                const value = node.configuration?.[key];
                // value is always an array, never a number or string
                if (!value) {
                    Logger.Error(["No value found for node configuration", key]);
                    throw new Error("Error parsing node configuration");
                }
                const configMapping = nodeMapping.configuration?.[key];
                const belongsToBlock = configMapping && configMapping.toBlock ? configMapping.toBlock === blockType : nodeMapping.blocks.indexOf(blockType) === 0;
                if (belongsToBlock) {
                    configuration[key] = value;
                }
            });
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
            const flowsFromGLTF = gltfNode.flows || {};
            const flowsKeys = Object.keys(flowsFromGLTF);
            // connect the flows
            for (const flowKey of flowsKeys) {
                const flow = flowsFromGLTF[flowKey];
                const flowMapping = outputMapper.flowGraphMapping.outputs?.flows?.[flowKey];
                const socketOutName = flowMapping?.name || flowKey;
                // create a serialized socket
                const socketOut = this._createNewSocketConnection(socketOutName, true);
                const block = (flowMapping && flowMapping.toBlock && flowGraphBlocks.blocks.find((b) => b.className === flowMapping.toBlock)) || flowGraphBlocks.blocks[0];
                block.signalOutputs.push(socketOut);
                // get the input node of this block
                const inputNodeId = flow.node;
                const nodeIn = this._nodes[inputNodeId];
                if (!nodeIn) {
                    Logger.Error(["No node found for input node id", inputNodeId]);
                    throw new Error("Error parsing node connections");
                }
                // get the mapper for the input node - in case it mapped to multiple blocks
                const inputMapper = getMappingForFullOperationName(nodeIn.fullOperationName);
                if (!inputMapper) {
                    Logger.Error(["No mapping found for input node", nodeIn]);
                    throw new Error("Error parsing node connections");
                }
                const flowInMapping = inputMapper.inputs?.flows?.[flow.socket || "in"];
                const nodeInSocketName = flowInMapping?.name || flow.socket || "in";
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
                const socketInName = valueMapping ? (arrayMapping ? valueMapping.name.replace("$1", valueKey) : valueMapping.name) : valueKey;
                // create a serialized socket
                const socketIn = this._createNewSocketConnection(socketInName);
                const block = (valueMapping && valueMapping.toBlock && flowGraphBlocks.blocks.find((b) => b.className === valueMapping!.toBlock)) || flowGraphBlocks.blocks[0];
                block.dataInputs.push(socketIn);
                if ((value as IKHRInteractivity_Variable).value !== undefined) {
                    const convertedValue = this._parseVariable(value as IKHRInteractivity_Variable);
                    context._connectionValues[socketIn.uniqueId] = convertedValue;
                } else if ((value as IKHRInteractivity_OutputSocketReference).node) {
                    const nodeOutId = (value as IKHRInteractivity_OutputSocketReference).node;
                    const nodeOutSocketName = (value as IKHRInteractivity_OutputSocketReference).socket || "value";
                    const nodeOut = this._nodes[nodeOutId];
                    if (!nodeOut) {
                        Logger.Error(["No node found for output socket reference", value]);
                        throw new Error("Error parsing node connections");
                    }
                    const outputMapper = getMappingForFullOperationName(nodeOut.fullOperationName);
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
                    }
                    const socketOutName = valueMapping ? (arrayMapping ? valueMapping.name.replace("$1", nodeOutSocketName) : valueMapping?.name) : nodeOutSocketName;
                    const outBlock = (valueMapping && valueMapping.toBlock && nodeOut.blocks.find((b) => b.className === valueMapping!.toBlock)) || nodeOut.blocks[0];
                    let socketOut = outBlock.dataOutputs.find((s) => s.name === socketOutName);
                    // if the socket doesn't exist, create it
                    if (!socketOut) {
                        socketOut = this._createNewSocketConnection(socketOutName, true);
                        outBlock.dataOutputs.push(socketOut);
                    }
                    // connect the sockets
                    socketIn.connectedPointIds.push(socketOut.uniqueId);
                    socketOut.connectedPointIds.push(socketIn.uniqueId);
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

            // TODO run the extra processor here.
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

    public serializeToFlowGraph(): ISerializedFlowGraph {
        const context: ISerializedFlowGraphContext = {
            uniqueId: RandomGUID(),
            _userVariables: {},
            _connectionValues: {},
        };
        this._parseNodeConnections(context);
        for (let i = 0; i < this._staticVariables.length; i++) {
            const variable = this._staticVariables[i];
            context._userVariables["staticVariable_" + i] = variable;
        }

        const allBlocks = this._nodes.reduce((acc, val) => acc.concat(val.blocks), [] as ISerializedFlowGraphBlock[]);

        return {
            rightHanded: true,
            allBlocks,
            executionContexts: [context],
        };
    }
}
