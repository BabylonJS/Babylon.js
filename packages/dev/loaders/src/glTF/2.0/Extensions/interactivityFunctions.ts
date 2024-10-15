/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity, IKHRInteractivity_Configuration, IKHRInteractivity_Node, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { ISerializedFlowGraph, ISerializedFlowGraphBlock, ISerializedFlowGraphConnection, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import { RandomGUID } from "core/Misc/guid";
import type { IGLTFToFlowGraphMapping } from "./interactivityUtils";
import { gltfTypeToBabylonType, gltfToFlowGraphMapping, convertGLTFValueToFlowGraph } from "./interactivityUtils";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import { Logger } from "core/Misc/logger";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";

interface InteractivityVariable {
    name: string;
    value: {
        className: string;
        value: any;
    };
}

interface InteractivityEvent {
    eventId: string;
    eventData?: { [key: string]: string };
}

function convertVariableValueWithType(configObject: IKHRInteractivity_Variable, types: FlowGraphTypes[], index: number) {
    if (configObject.type !== undefined) {
        // get the type on the gltf definition
        const className = types[configObject.type];
        if (!className) {
            throw new Error(`/extensions/KHR_interactivity/variables/${index}: Unknown type: ${configObject.type}`);
        }
        const value = () => {
            switch (className) {
                case FlowGraphTypes.Boolean:
                case FlowGraphTypes.Integer:
                case FlowGraphTypes.Number:
                    // value might not be defined, this way it is just a placeholder with a type.
                    return configObject.value?.[0];
                default:
                    return configObject.value;
            }
        };
        return {
            value,
            className,
        };
    } else {
        throw new Error(`/extensions/KHR_interactivity/variables/${index}: No type defined`);
    }
}

function convertConfiguration(
    gltfBlock: IKHRInteractivity_Node,
    mapping: IGLTFToFlowGraphMapping,
    indexArray: { types: FlowGraphTypes[]; variables: InteractivityVariable[]; events: InteractivityEvent[] }
): IFlowGraphBlockConfiguration {
    const converted: IFlowGraphBlockConfiguration = {};
    const configurationList: IKHRInteractivity_Configuration[] = gltfBlock.configuration ?? [];
    for (const configObject of configurationList) {
        // parse every configuration object, based on the mapping
        const configMapping = mapping.configuration?.[configObject.id];
        if (configMapping) {
            const { key, value } = convertGLTFValueToFlowGraph(configObject.value, configMapping, indexArray);
            converted[key] = value;
        }
    }
    // now search for other connections that are set to be isOptions.

    // let internalEventCounter = 0;
    //     if (configObject.id === "customEvent") {
    //         const customEvent = definition.events && definition.events[configObject.value];
    //         if (!customEvent) {
    //             throw new Error(`/extensions/KHR_interactivity/nodes/${id}: Unknown custom event: ${configObject.value}`);
    //         }
    //         converted.eventId = customEvent.id || "internalEvent_" + internalEventCounter++;
    //         if (customEvent.values) {
    //             // eventData is a dictionary of the values of the custom event, so we need to convert it to an array
    //             converted.eventData = customEvent.values.reduce(
    //                 (acc, value, currIndex) => {
    //                     acc[value.id] = customEvent.values[currIndex];
    //                     // check if there is a type for the value
    //                     if (value.type !== undefined && definition.types) {
    //                         acc[value.id].type = gltfTypeToBabylonType[definition.types?.[value.type].signature];
    //                     }
    //                     return acc;
    //                 },
    //                 {} as Record<string, any>
    //             );
    //         }
    //     } else if (configObject.id === "variable") {
    //         const variable = definition.variables && definition.variables[configObject.value];
    //         if (!variable) {
    //             throw new Error(`/extensions/KHR_interactivity/nodes/${id}: Unknown variable: ${configObject.value}`);
    //         }
    //         converted.variableName = variable.id;
    //     } else if (configObject.id === "pointer") {
    //         // Convert from a GLTF path to a reference to the Babylon.js object
    //         const pathValue = configObject.value as string;
    //         converted.path = pathValue;
    //     } else {
    //         converted[configObject.id] = convertVariableValueWithType(configObject, definition, `/extensions/KHR_interactivity/nodes/${id}`);
    //     }
    // }
    return converted;
}

function convertBlock(id: number, gltfBlock: IKHRInteractivity_Node, definition: IKHRInteractivity): ISerializedFlowGraphBlock[] | undefined {
    const mapping = gltfToFlowGraphMapping[gltfBlock.type];
    if (!mapping) {
        Logger.Warn(`/extensions/KHR_interactivity/nodes/${id}: Unknown block type: ${gltfBlock.type}`);
        return;
    }
    const className = mapping.blocks[0];
    const uniqueId = id.toString();
    const config = convertConfiguration(gltfBlock, definition, uniqueId);
    const metadata = gltfBlock.metadata;
    const dataInputs: ISerializedFlowGraphConnection[] = [];
    const dataOutputs: ISerializedFlowGraphConnection[] = [];
    const signalInputs: ISerializedFlowGraphConnection[] = [];
    const signalOutputs: ISerializedFlowGraphConnection[] = [];
    return {
        className,
        type: gltfBlock.type,
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
 * @internal
 * Converts a glTF Interactivity Extension to a serialized flow graph.
 * @param gltf the interactivity data
 * @returns a serialized flow graph
 */
export function convertGLTFToSerializedFlowGraph(gltf: IKHRInteractivity): ISerializedFlowGraph {
    // tasks for this function - parse types, events, variables and nodes, and then convet them all to the corresponding babylon types

    // Types - convert the types array to a babylon types array
    const types = [] as FlowGraphTypes[];
    if (gltf.types) {
        for (let i = 0; i < gltf.types.length; ++i) {
            types.push(gltfTypeToBabylonType[gltf.types[i].signature]);
        }
    }

    // events data - this should be expended when we have better understanding of custom events and their signature
    const events = [] as InteractivityEvent[];
    let internalEventCounter = 0;
    if (gltf.events) {
        for (let i = 0; i < gltf.events.length; ++i) {
            const customEvent = gltf.events[i];
            const converted: InteractivityEvent = {
                eventId: customEvent.id || "internalEvent_" + internalEventCounter++,
            };
            if (customEvent.values) {
                // eventData is a dictionary of the values of the custom event, so we need to convert it to an array
                converted.eventData = customEvent.values.reduce(
                    (acc, value, currIndex) => {
                        acc[value.id] = customEvent.values[currIndex];
                        // check if there is a type for the value
                        if (value.type !== undefined) {
                            acc[value.id].type = types[value.type];
                        }
                        return acc;
                    },
                    {} as Record<string, any>
                );
            }
            events.push(converted);
        }
    }

    const variables = [] as InteractivityVariable[];
    if (gltf.variables) {
        for (let i = 0; i < gltf.variables.length; ++i) {
            const v: IKHRInteractivity_Variable = gltf.variables[i];
            const name = v.id;
            const value = convertVariableValueWithType(v, types, i);
            variables.push({
                name,
                value,
            });
        }
    }

    // now create the base nodes. Afterwards we will connect them.

    // Blocks converted to the flow graph json format
    const flowGraphJsonBlocks: ISerializedFlowGraphBlock[] = [];

    for (let i = 0; i < gltf.nodes.length; i++) {
        const gltfBlock = gltf.nodes[i];
        const flowGraphJsonBlock = convertBlock(i, gltfBlock, gltf);
        if (!flowGraphJsonBlock) {
            continue;
        }
        flowGraphJsonBlocks.push(...flowGraphJsonBlock);
    }

    // now that we have the arrays populated, we can do the connections and populate the context.

    // create an empty serialized context to store the values of the connections
    const context: ISerializedFlowGraphContext = {
        uniqueId: RandomGUID(),
        _userVariables: {},
        _connectionValues: {},
    };
    const executionContexts = [context];
    // Parse the connections
    for (let i = 0; i < gltf.nodes.length; i++) {
        const gltfBlock = gltf.nodes[i];
        // get the block that was created in the previous step
        const fgBlock = flowGraphJsonBlocks[i];
        const outputMapper = gltfToFlowGraphMapping[fgBlock.type];
        const gltfFlows = gltfBlock.flows ?? [];
        // for each output flow of the gltf block
        for (const flow of gltfFlows) {
            const socketOutName = outputMapper.outputs.flows?.[flow.id].name || flow.id;
            // create an output connection for the flow graph block
            const socketOut: ISerializedFlowGraphConnection = {
                uniqueId: RandomGUID(),
                name: socketOutName,
                _connectionType: FlowGraphConnectionType.Output, // Output
                connectedPointIds: [],
            };
            fgBlock.signalOutputs.push(socketOut);
            // get the input node of this flow
            const nodeInId = flow.node;
            // find the corresponding flow graph node
            const nodeIn = flowGraphJsonBlocks[nodeInId];
            if (!nodeIn) {
                throw new Error(
                    `/extensions/KHR_interactivity/nodes/${i}: Could not find node with id ${nodeInId} that connects its input with with node ${i}'s output ${socketOutName}`
                );
            }
            const inputMapper = gltfToFlowGraphMapping[nodeIn.type];
            const nodeInSocketName = inputMapper.inputs.flows?.[flow.socket].name || flow.socket;
            // in all of the flow graph input connections, find the one with the same name as the socket
            let socketIn = nodeIn.signalInputs.find((s) => s.name === nodeInSocketName);
            // if the socket doesn't exist, create the input socket for the connection
            if (!socketIn) {
                socketIn = {
                    uniqueId: RandomGUID(),
                    name: nodeInSocketName,
                    _connectionType: FlowGraphConnectionType.Input, // Input
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
                _connectionType: FlowGraphConnectionType.Input,
                connectedPointIds: [],
            };
            fgBlock.dataInputs.push(socketIn);
            if (value.value !== undefined) {
                // if the value is set on the socket itself, store it in the context
                const convertedValue = convertVariableValueWithType(value as IKHRInteractivity_Configuration, gltf, `/extensions/KHR_interactivity/nodes/${i}`);
                // convertBlockInputType(gltfBlock, value, convertedValue, `/extensions/KHR_interactivity/nodes/${i}`);
                context._connectionValues[socketIn.uniqueId] = convertedValue;
            } else if (value.node !== undefined && value.socket !== undefined) {
                // if the value is connected with the output data of another socket, connect the two
                const nodeOutId = value.node;
                const nodeOutSocketName = value.socket;
                // find the flow graph node that owns that output socket
                const nodeOut = flowGraphJsonBlocks[nodeOutId];
                if (!nodeOut) {
                    throw new Error(
                        `/extensions/KHR_interactivity/nodes/${i}: Could not find node with id ${nodeOutId} that connects its output with node${i}'s input ${socketInName}`
                    );
                }
                let socketOut = nodeOut.dataOutputs.find((s) => s.name === nodeOutSocketName);
                // if the socket doesn't exist, create it
                if (!socketOut) {
                    socketOut = {
                        uniqueId: RandomGUID(),
                        name: nodeOutSocketName,
                        _connectionType: FlowGraphConnectionType.Output,
                        connectedPointIds: [],
                    };
                    nodeOut.dataOutputs.push(socketOut);
                }
                // connect the sockets
                socketIn.connectedPointIds.push(socketOut.uniqueId);
                socketOut.connectedPointIds.push(socketIn.uniqueId);
            } else {
                throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Invalid socket ${socketInName} in node ${i}`);
            }
        }
    }

    // Set variables in context
    for (let i = 0; i < variables.length; i++) {
        const variable = variables[i];
        const variableName = variable.name;
        context._userVariables[variableName] = variable.value;
    }

    return {
        allBlocks: flowGraphJsonBlocks,
        executionContexts,
    };
}
