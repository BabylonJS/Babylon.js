/* eslint-disable @typescript-eslint/naming-convention */
import type {
    IKHRInteractivity,
    IKHRInteractivity_Configuration,
    IKHRInteractivity_Node,
    IKHRInteractivity_ValueWithMaybeType,
    IKHRInteractivity_Variable,
} from "babylonjs-gltf2interface";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph";
import type { ISerializedFlowGraph, ISerializedFlowGraphBlock, ISerializedFlowGraphConnection, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import { RandomGUID } from "core/Misc";
import type { GLTFLoader } from "../../glTFLoader";
import { gltfPropertyNameToBabylonPropertyName, gltfToFlowGraphTypeMap, gltfTypeToBabylonType } from "./utils";

function convertType(configObject: IKHRInteractivity_ValueWithMaybeType, definition: IKHRInteractivity) {
    if (configObject.type !== undefined) {
        // get the type on the gltf definition
        const type = definition.types[configObject.type];
        if (!type) {
            throw new Error(`Unknown type: ${configObject.type}`);
        }
        const signature = type.signature;
        if (!signature) {
            throw new Error(`Type ${configObject.type} has no signature`);
        }
        const convertedType = gltfTypeToBabylonType[signature];
        return {
            value: configObject.value,
            className: convertedType,
        };
    } else {
        return configObject.value;
    }
}

function convertConfiguration(gltfBlock: IKHRInteractivity_Node, definition: IKHRInteractivity, loader: GLTFLoader): IFlowGraphBlockConfiguration {
    const converted: IFlowGraphBlockConfiguration = {};
    const configurationList: IKHRInteractivity_Configuration[] = gltfBlock.configuration ?? [];
    for (const configObject of configurationList) {
        if (configObject.id === "customEvent") {
            const customEvent = definition.customEvents[configObject.value];
            if (!customEvent) {
                throw new Error(`Unknown custom event: ${configObject.value}`);
            }
            converted.eventId = customEvent.id;
            converted.eventData = customEvent.values.map((v) => v.id);
        } else if (configObject.id === "variable") {
            const variable = definition.variables[configObject.value];
            if (!variable) {
                throw new Error(`Unknown variable: ${configObject.value}`);
            }
            converted.variableName = variable.id;
        } else if (configObject.id === "path") {
            // Convert from a GLTF path to a reference to the Babylon.js object
            let pathValue = configObject.value as string;
            if (!pathValue.startsWith("/")) {
                pathValue = `/${pathValue}`;
            }
            // A path can be:
            // /[nodes|materials|animations]/[numericIndex|substitutionString]/propertyName
            // Basically the first two parts are part of the path, and from then on it's part of the property?
            const pathParts = pathValue.split("/");
            if (pathParts.length < 4) {
                throw new Error(`Invalid path: ${pathValue}`);
            }
            const path = `/${pathParts[1]}/${pathParts[2]}`;
            const isSecondPartNumeric = !isNaN(Number(pathParts[2]));
            if (!isSecondPartNumeric) {
                converted.subString = pathParts[2];
            } else {
                converted.subString = "";
            }
            converted.path = path;
            let property = "";
            for (let i = 3; i < pathParts.length; i++) {
                property += pathParts[i];
                if (i < pathParts.length - 1) {
                    property += ".";
                }
            }
            if (gltfPropertyNameToBabylonPropertyName[property]) {
                property = gltfPropertyNameToBabylonPropertyName[property];
            }
            converted.property = property;
        } else {
            converted[configObject.id] = convertType(configObject, definition);
        }
    }
    return converted;
}

function convertBlock(gltfBlock: IKHRInteractivity_Node, definition: IKHRInteractivity, loader: GLTFLoader): ISerializedFlowGraphBlock {
    const className = gltfToFlowGraphTypeMap[gltfBlock.type];
    if (!className) {
        throw new Error(`Unknown block type: ${gltfBlock.type}`);
    }
    const config = convertConfiguration(gltfBlock, definition, loader);
    if (gltfBlock.id === undefined) {
        throw new Error(`Block of type ${gltfBlock.type} has no id`);
    }
    const uniqueId = gltfBlock.id.toString();
    const metadata = gltfBlock.metadata;
    // the data inputs and outputs will be saved at a later step?
    const dataInputs: ISerializedFlowGraphConnection[] = [];
    const dataOutputs: ISerializedFlowGraphConnection[] = [];
    const signalInputs: ISerializedFlowGraphConnection[] = [];
    const signalOutputs: ISerializedFlowGraphConnection[] = [];
    return {
        className,
        config,
        uniqueId,
        metadata,
        dataInputs,
        dataOutputs,
        signalInputs,
        signalOutputs,
    };
}

/**
 * Converts a glTF Interactivity Extension to a serialized flow graph.
 * @param gltf the interactivity data
 * @param loader the glTF loader
 * @returns a serialized flow graph
 */
export function convertGLTFToJson(gltf: IKHRInteractivity, loader: GLTFLoader): ISerializedFlowGraph {
    // create an empty serialized context to store the values of the connections
    const context: ISerializedFlowGraphContext = {
        uniqueId: RandomGUID(),
        _userVariables: {},
        _connectionValues: {},
        pathMap: {},
    };
    const executionContexts = [context];

    // map from uniqueId of the block to the block
    const blocksMap: Map<string, ISerializedFlowGraphBlock> = new Map();

    // Parse the blocks and add them to the map
    for (const gltfBlock of gltf.nodes) {
        const block = convertBlock(gltfBlock, gltf, loader);
        blocksMap.set(block.uniqueId, block);
    }

    const allBlocks = [];
    // Parse the connections
    for (let i = 0; i < gltf.nodes.length; i++) {
        const gltfBlock = gltf.nodes[i];
        // get the block created for the flow graph
        const fgBlock = blocksMap.get(gltfBlock.id.toString())!;
        const gltfFlows = gltfBlock.flows ?? [];
        // for each output flow of the gltf block
        for (const flow of gltfFlows) {
            const nodeOutName = flow.id;
            // create an output connection for the flow graph block
            const socketOut: ISerializedFlowGraphConnection = {
                uniqueId: RandomGUID(),
                name: nodeOutName,
                _connectionType: 1, // Output
                connectedPointIds: [],
            };
            fgBlock.signalOutputs.push(socketOut);
            // get the input node of this flow
            const nodeInId = flow.node;
            const nodeInSocketName = flow.socket;
            // find the corresponding flow graph node
            const nodeIn = blocksMap.get(nodeInId.toString());
            if (!nodeIn) {
                throw new Error(`Could not find node with id ${nodeInId}`);
            }
            // in all of the flow graph input connections, find the one with the same name as the socket
            let socketIn = nodeIn.signalInputs.find((s) => s.name === nodeInSocketName);
            // if the socket doesn't exist, create the input socket for the connection
            if (!socketIn) {
                socketIn = {
                    uniqueId: RandomGUID(),
                    name: nodeInSocketName,
                    _connectionType: 0, // Input
                    connectedPointIds: [],
                };
                nodeIn.signalInputs.push(socketIn);
            }
            // connect the sockets
            socketIn.connectedPointIds.push(socketOut.uniqueId);
            socketOut.connectedPointIds.push(socketIn.uniqueId);
        }
        // for each input value of the gltf block
        const gltfValues = gltfBlock.values ?? [];
        for (const value of gltfValues) {
            const socketInName = value.id;
            // create an input data connection for the flow graph block
            const socketIn: ISerializedFlowGraphConnection = {
                uniqueId: RandomGUID(),
                name: socketInName,
                _connectionType: 0, // input: todo see why enum is failing
                connectedPointIds: [],
            };
            fgBlock.dataInputs.push(socketIn);
            if (value.value !== undefined) {
                // if the value is set on the socket itself, store it in the context
                context._connectionValues[socketIn.uniqueId] = convertType(value as IKHRInteractivity_ValueWithMaybeType, gltf);
            } else if (value.node !== undefined && value.socket !== undefined) {
                // if the value is connected with the output data of another socket, connect the two
                const nodeOutId = value.node;
                const nodeOutSocketName = value.socket;
                // find the flow graph node that owns that output socket
                const nodeOut = blocksMap.get(nodeOutId.toString());
                if (!nodeOut) {
                    throw new Error(`Could not find node with id ${nodeOutId}`);
                }
                let socketOut = nodeOut.dataOutputs.find((s) => s.name === nodeOutSocketName);
                // if the socket doesn't exist, create it
                if (!socketOut) {
                    socketOut = {
                        uniqueId: RandomGUID(),
                        name: nodeOutSocketName,
                        _connectionType: 1, // Output
                        connectedPointIds: [],
                    };
                    nodeOut.dataOutputs.push(socketOut);
                }
                // connect the sockets
                socketIn.connectedPointIds.push(socketOut.uniqueId);
                socketOut.connectedPointIds.push(socketIn.uniqueId);
            } else {
                throw new Error(`Invalid socket ${socketInName}`);
            }
        }
        allBlocks.push(fgBlock);
    }

    const variables = gltf.variables ?? [];
    // Parse variables
    for (let i = 0; i < variables.length; i++) {
        const variable: IKHRInteractivity_Variable = variables[i];
        const variableName = variable.id;
        context._userVariables[variableName] = convertType(variable as IKHRInteractivity_ValueWithMaybeType, gltf);
    }
    return {
        allBlocks,
        executionContexts,
    };
}
