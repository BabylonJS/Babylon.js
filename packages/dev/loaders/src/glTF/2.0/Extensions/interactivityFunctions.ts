/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity, IKHRInteractivity_Configuration, IKHRInteractivity_Node, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { ISerializedFlowGraph, ISerializedFlowGraphBlock, ISerializedFlowGraphConnection, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import { RandomGUID } from "core/Misc/guid";
import type { IConvertedInteractivityObject, IGLTFToFlowGraphMapping, InteractivityEvent, InteractivityVariable } from "./interactivityUtils";
import { gltfTypeToBabylonType, convertGLTFValueToFlowGraph, getMappingForType } from "./interactivityUtils";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import { Logger } from "core/Misc/logger";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import type { IGLTF } from "../glTFLoaderInterfaces";

function convertVariableValueWithType(configObject: IKHRInteractivity_Variable, types: FlowGraphTypes[], index: number) {
    if (configObject.type !== undefined) {
        // get the type on the gltf definition
        const className = types[configObject.type];
        if (!className) {
            throw new Error(`/extensions/KHR_interactivity/variables/${index}: Unknown type: ${configObject.type}`);
        }
        const value = (() => {
            switch (className) {
                case FlowGraphTypes.Boolean:
                case FlowGraphTypes.Integer:
                case FlowGraphTypes.Number:
                    // value might not be defined, this way it is just a placeholder with a type.
                    return configObject.value?.[0];
                default:
                    return configObject.value;
            }
        })();
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
    convertedObject: IConvertedInteractivityObject,
    blockType: FlowGraphBlockNames
): IFlowGraphBlockConfiguration {
    const converted: IFlowGraphBlockConfiguration = {};
    const configurationList: IKHRInteractivity_Configuration[] = gltfBlock.configuration ?? [];
    for (const configObject of configurationList) {
        // parse every configuration object, based on the mapping
        const configMapping = mapping.configuration?.[configObject.id];
        if (configMapping) {
            const belongsToBlock = configMapping.toBlock === blockType || mapping.blocks.indexOf(blockType) === 0;
            if (belongsToBlock) {
                const { key, value } = convertGLTFValueToFlowGraph(configObject.value, configMapping, convertedObject);
                converted[key] = value;
            }
        }
    }
    // TODO - we need to deal with pointers here?
    return converted;
}

function convertBlocks(id: number, gltfBlock: IKHRInteractivity_Node, _definition: IKHRInteractivity, convertedObject: IConvertedInteractivityObject) {
    const mapping = getMappingForType(gltfBlock.type);
    if (!mapping) {
        Logger.Warn(`/extensions/KHR_interactivity/nodes/${id}: Unknown block type: ${gltfBlock.type}`);
        return;
    }
    const blocks = [] as ISerializedFlowGraphBlock[];
    for (const className of mapping.blocks) {
        const uniqueId = id.toString();
        const config = convertConfiguration(gltfBlock, mapping, convertedObject, className);
        const metadata = { glTFNodeId: id, glTFNodeType: gltfBlock.type, ...gltfBlock.metadata };
        const dataInputs: ISerializedFlowGraphConnection[] = [];
        const dataOutputs: ISerializedFlowGraphConnection[] = [];
        const signalInputs: ISerializedFlowGraphConnection[] = [];
        const signalOutputs: ISerializedFlowGraphConnection[] = [];
        const block: ISerializedFlowGraphBlock = {
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
        blocks.push(block);
    }
    return blocks;
}

/**
 * @internal
 * Converts a glTF Interactivity Extension to a serialized flow graph.
 * @param gltf the interactivity data
 * @returns a serialized flow graph
 */
export function convertGLTFToSerializedFlowGraph(gltf: IKHRInteractivity, referenceGLTF: IGLTF): ISerializedFlowGraph {
    // tasks for this function - parse types, events, variables and nodes, and then convert them all to the corresponding babylon types

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
    // actually not really needed TODO - try to avoid this array
    const flowGraphJsonBlocks: ISerializedFlowGraphBlock[] = [];

    const flowGraphBlocksMap: { blocks: ISerializedFlowGraphBlock[]; type: string }[] = [];

    const converted: IConvertedInteractivityObject = {
        types,
        events,
        variables,
        nodes: flowGraphJsonBlocks,
    };

    for (let i = 0; i < gltf.nodes.length; i++) {
        const gltfNode = gltf.nodes[i];
        const blocks = convertBlocks(i, gltfNode, gltf, converted);
        if (blocks?.length) {
            flowGraphJsonBlocks.push(...blocks);
            flowGraphBlocksMap.push({
                blocks,
                type: gltfNode.type,
            });
        }
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
        // get the blocks of this node
        const flowGraphBlocks = flowGraphBlocksMap[i];
        if (!flowGraphBlocks) {
            throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Could not find blocks for node ${i}`);
        }
        const outputMapper = getMappingForType(gltfBlock.type);
        // make sure the mapper exists
        if (!outputMapper) {
            throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Unknown block type: ${gltfBlock.type}`);
        }
        const gltfFlows = gltfBlock.flows ?? [];
        // for each output flow of the gltf block
        for (const flow of gltfFlows) {
            const flowMapping = outputMapper.outputs?.flows?.[flow.id];
            const socketOutName = flowMapping?.name || flow.id;
            // create an output connection for the flow graph block
            const socketOut: ISerializedFlowGraphConnection = {
                uniqueId: RandomGUID(),
                name: socketOutName,
                _connectionType: FlowGraphConnectionType.Output, // Output
                connectedPointIds: [],
            };
            const block = (flowMapping && flowMapping.toBlock && flowGraphBlocks.blocks.find((b) => b.className === flowMapping.toBlock)) || flowGraphBlocks.blocks[0];
            block.signalOutputs.push(socketOut);
            // get the input node of this flow
            const nodeInId = flow.node;
            // find the corresponding flow graph node
            const nodeIn = flowGraphBlocksMap[nodeInId];
            if (!nodeIn) {
                throw new Error(
                    `/extensions/KHR_interactivity/nodes/${i}: Could not find node with id ${nodeInId} that connects its input with with node ${i}'s output ${socketOutName}`
                );
            }
            const inputMapper = getMappingForType(nodeIn.type);
            if (!inputMapper) {
                throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Unknown block type: ${nodeIn.type}`);
            }
            const flowInMapping = inputMapper.inputs?.flows?.[flow.socket];
            const nodeInSocketName = flowInMapping?.name || flow.socket;

            const inputBlock = (flowInMapping && flowInMapping.toBlock && nodeIn.blocks.find((b) => b.className === flowInMapping.toBlock)) || nodeIn.blocks[0];
            // in all of the flow graph input connections, find the one with the same name as the socket
            let socketIn = inputBlock.signalInputs.find((s) => s.name === nodeInSocketName);
            // if the socket doesn't exist, create the input socket for the connection
            if (!socketIn) {
                socketIn = {
                    uniqueId: RandomGUID(),
                    name: nodeInSocketName,
                    _connectionType: FlowGraphConnectionType.Input, // Input
                    connectedPointIds: [],
                };
                inputBlock.signalInputs.push(socketIn);
            }
            // connect the sockets
            socketIn.connectedPointIds.push(socketOut.uniqueId);
            socketOut.connectedPointIds.push(socketIn.uniqueId);
        }
        // for each input value of the gltf block
        const gltfValues = gltfBlock.values ?? [];
        for (const value of gltfValues) {
            const valueMapping = outputMapper.outputs?.values?.[value.id];
            const socketInName = valueMapping?.name || value.id;
            // create an input data connection for the flow graph block
            const socketIn: ISerializedFlowGraphConnection = {
                uniqueId: RandomGUID(),
                name: socketInName,
                _connectionType: FlowGraphConnectionType.Input,
                connectedPointIds: [],
            };
            const block = (valueMapping && valueMapping.toBlock && flowGraphBlocks.blocks.find((b) => b.className === valueMapping.toBlock)) || flowGraphBlocks.blocks[0];
            block.dataInputs.push(socketIn);
            if (value.value !== undefined) {
                // if the value is set on the socket itself, store it in the context
                const convertedValue = convertVariableValueWithType(value as IKHRInteractivity_Variable, types, i);
                context._connectionValues[socketIn.uniqueId] = convertedValue;
            } else if (value.node !== undefined && value.socket !== undefined) {
                // if the value is connected with the output data of another socket, connect the two
                const nodeOutId = value.node;
                const nodeOutSocketName = value.socket;
                // find the flow graph node that owns that output socket
                const nodeOut = flowGraphBlocksMap[nodeOutId];
                if (!nodeOut) {
                    throw new Error(
                        `/extensions/KHR_interactivity/nodes/${i}: Could not find node with id ${nodeOutId} that connects its output with node${i}'s input ${socketInName}`
                    );
                }
                const outputMapper = getMappingForType(nodeOut.type);
                if (!outputMapper) {
                    throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Unknown block type: ${nodeOut.type}`);
                }
                const valueMapping = outputMapper.outputs?.values?.[nodeOutSocketName];
                const socketOutName = valueMapping?.name || nodeOutSocketName;
                const outBlock = (valueMapping && valueMapping.toBlock && nodeOut.blocks.find((b) => b.className === valueMapping.toBlock)) || nodeOut.blocks[0];
                let socketOut = outBlock.dataOutputs.find((s) => s.name === socketOutName);
                // if the socket doesn't exist, create it
                if (!socketOut) {
                    socketOut = {
                        uniqueId: RandomGUID(),
                        name: socketOutName,
                        _connectionType: FlowGraphConnectionType.Output,
                        connectedPointIds: [],
                    };
                    outBlock.dataOutputs.push(socketOut);
                }
                // connect the sockets
                socketIn.connectedPointIds.push(socketOut.uniqueId);
                socketOut.connectedPointIds.push(socketIn.uniqueId);
            } else {
                throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Invalid socket ${socketInName} in node ${i}`);
            }
        }

        if (outputMapper.extraProcessor) {
            outputMapper.extraProcessor(gltfBlock, outputMapper, converted, flowGraphBlocks.blocks, context, referenceGLTF);
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
