import type { IKHRInteractivity, IKHRInteractivity_Configuration, IKHRInteractivity_Node } from "babylonjs-gltf2interface";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph";
import { FlowGraphLogBlock, FlowGraphSceneReadyEventBlock, FlowGraphTimerBlock } from "core/FlowGraph";
import type { ISerializedFlowGraph, ISerializedFlowGraphBlock, ISerializedFlowGraphConnection, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import { RandomGUID } from "core/Misc";

const gltfToFlowGraphTypeMap: { [key: string]: string } = {
    "lifecycle/onStart": FlowGraphSceneReadyEventBlock.ClassName,
    log: FlowGraphLogBlock.ClassName,
    "flow/delay": FlowGraphTimerBlock.ClassName,
};

function convertConfiguration(gltfBlock: IKHRInteractivity_Node): IFlowGraphBlockConfiguration {
    const converted: IFlowGraphBlockConfiguration = {};
    const configurationList: IKHRInteractivity_Configuration[] = gltfBlock.configuration ?? [];
    for (const configObject of configurationList) {
        converted[configObject.id] = configObject.value;
    }
    return converted;
}

function convertBlock(gltfBlock: IKHRInteractivity_Node): ISerializedFlowGraphBlock {
    const className = gltfToFlowGraphTypeMap[gltfBlock.type];
    if (!className) {
        throw new Error(`Unknown block type: ${gltfBlock.type}`);
    }
    const config = convertConfiguration(gltfBlock);
    const uniqueId = gltfBlock.id.toString();
    const metadata = gltfBlock.metadata;
    // the data inputs and outputs will be saved at a later step?
    const dataInputs: ISerializedFlowGraphConnection[] = [];
    const dataOutputs: ISerializedFlowGraphConnection[] = [];
    return {
        className,
        config,
        uniqueId,
        metadata,
        dataInputs,
        dataOutputs,
    };
}

export function convertGLTFToJson(gltf: IKHRInteractivity): ISerializedFlowGraph {
    const context: ISerializedFlowGraphContext = {
        uniqueId: RandomGUID(),
        _userVariables: {},
        _connectionValues: {},
    };
    const executionContexts = [context];

    const blocksMap: Map<string, ISerializedFlowGraphBlock> = new Map();

    // Parse the blocks
    for (const gltfBlock of gltf.nodes) {
        const block = convertBlock(gltfBlock);
        blocksMap.set(block.uniqueId, block);
    }

    const allBlocks = [];
    // Parse the connections
    for (let i = 0; i < gltf.nodes.length; i++) {
        const gltfBlock = gltf.nodes[i];
        const fgBlock = blocksMap.get(gltfBlock.id.toString())!;
        const gltfFlows = gltfBlock.flows ?? [];
        for (const flow of gltfFlows) {
            // todo how to connect
        }
        allBlocks.push(fgBlock);
    }

    return {
        allBlocks,
        executionContexts,
    };
}
