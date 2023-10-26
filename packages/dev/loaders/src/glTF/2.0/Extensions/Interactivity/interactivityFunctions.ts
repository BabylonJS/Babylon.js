import type { IKHRInteractivity, IKHRInteractivity_Configuration, IKHRInteractivity_Node } from "babylonjs-gltf2interface";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph";
import { FlowGraphLogBlock, FlowGraphSceneReadyEventBlock, FlowGraphSendCustomEventBlock, FlowGraphTimerBlock } from "core/FlowGraph";
import type { ISerializedFlowGraph, ISerializedFlowGraphConnection, ISerializedFlowGraphContext, ISerializedFlowGraphExecutionBlock } from "core/FlowGraph/typeDefinitions";
import { RandomGUID } from "core/Misc";

const gltfToFlowGraphTypeMap: { [key: string]: string } = {
    "lifecycle/onStart": FlowGraphSceneReadyEventBlock.ClassName,
    log: FlowGraphLogBlock.ClassName,
    "flow/delay": FlowGraphTimerBlock.ClassName,
    "customEvent/send": FlowGraphSendCustomEventBlock.ClassName,
};

function convertConfiguration(gltfBlock: IKHRInteractivity_Node, definition: IKHRInteractivity): IFlowGraphBlockConfiguration {
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
        } else {
            converted[configObject.id] = configObject.value;
        }
    }
    return converted;
}

function convertBlock(gltfBlock: IKHRInteractivity_Node, definition: IKHRInteractivity): ISerializedFlowGraphExecutionBlock {
    const className = gltfToFlowGraphTypeMap[gltfBlock.type];
    if (!className) {
        throw new Error(`Unknown block type: ${gltfBlock.type}`);
    }
    const config = convertConfiguration(gltfBlock, definition);
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

export function convertGLTFToJson(gltf: IKHRInteractivity): ISerializedFlowGraph {
    const context: ISerializedFlowGraphContext = {
        uniqueId: RandomGUID(),
        _userVariables: {},
        _connectionValues: {},
    };
    const executionContexts = [context];

    const blocksMap: Map<string, ISerializedFlowGraphExecutionBlock> = new Map();

    // Parse the blocks
    for (const gltfBlock of gltf.nodes) {
        const block = convertBlock(gltfBlock, gltf);
        blocksMap.set(block.uniqueId, block);
    }

    const allBlocks = [];
    // Parse the connections
    for (let i = 0; i < gltf.nodes.length; i++) {
        const gltfBlock = gltf.nodes[i];
        const fgBlock = blocksMap.get(gltfBlock.id.toString())!;
        const gltfFlows = gltfBlock.flows ?? [];
        for (const flow of gltfFlows) {
            const nodeOutName = flow.id;
            const socketOut: ISerializedFlowGraphConnection = {
                uniqueId: RandomGUID(),
                name: nodeOutName,
                _connectionType: 1, // Output todo: see why the enum is failing
                connectedPointIds: [],
            };
            fgBlock.signalOutputs.push(socketOut);
            const nodeInId = flow.node;
            const nodeInSocketName = flow.socket;
            const nodeIn = blocksMap.get(nodeInId.toString());
            if (!nodeIn) {
                throw new Error(`Could not find node with id ${nodeInId}`);
            }
            let socketIn = nodeIn.signalInputs.find((s) => s.name === nodeInSocketName);
            // if the socket doesn't exist, create it
            if (!socketIn) {
                socketIn = {
                    uniqueId: RandomGUID(),
                    name: nodeInSocketName,
                    _connectionType: 0, // input: todo see why enum is failing
                    connectedPointIds: [],
                };
                nodeIn.signalInputs.push(socketIn);
            }
            socketIn.connectedPointIds.push(socketOut.uniqueId);
            socketOut.connectedPointIds.push(socketIn.uniqueId);
        }
        const gltfValues = gltfBlock.values ?? [];
        for (const value of gltfValues) {
            const socketInName = value.id;
            const socketIn: ISerializedFlowGraphConnection = {
                uniqueId: RandomGUID(),
                name: socketInName,
                _connectionType: 0, // input: todo see why enum is failing
                connectedPointIds: [],
            };
            fgBlock.dataInputs.push(socketIn);
            if (value.value) {
                context._connectionValues[socketIn.uniqueId] = value.value;
            } else if (value.node !== undefined && value.socket !== undefined) {
                const nodeOutId = value.node;
                const nodeOutSocketName = value.socket;
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
                        _connectionType: 1, // Output todo: see why the enum is failing
                        connectedPointIds: [],
                    };
                    nodeOut.dataOutputs.push(socketOut);
                }
                socketIn.connectedPointIds.push(socketOut.uniqueId);
                socketOut.connectedPointIds.push(socketIn.uniqueId);
            } else {
                throw new Error(`Invalid socket ${socketInName}`);
            }
        }
        allBlocks.push(fgBlock);
    }
    return {
        allBlocks,
        executionContexts,
    };
}
