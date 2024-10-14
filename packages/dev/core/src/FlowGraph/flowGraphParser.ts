import { blockFactory } from "./Blocks/flowGraphBlockFactory";
import type { FlowGraphBlockNames } from "./Blocks/flowGraphBlockNames";
import type { FlowGraph, IFlowGraphParseOptions } from "./flowGraph";
import type { FlowGraphBlock, IFlowGraphBlockParseOptions } from "./flowGraphBlock";
import type { FlowGraphContext, IFlowGraphContextParseOptions } from "./flowGraphContext";
import type { FlowGraphCoordinatorParseOptions } from "./flowGraphCoordinator";
import { FlowGraphCoordinator } from "./flowGraphCoordinator";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";
import { defaultValueParseFunction, needsPathConverter } from "./serialization";
import type { ISerializedFlowGraph, ISerializedFlowGraphBlock, ISerializedFlowGraphContext } from "./typeDefinitions";

/**
 * Given a list of blocks, find an output data connection that has a specific unique id
 * @param blocks a list of flow graph blocks
 * @param uniqueId the unique id of a connection
 * @returns the connection that has this unique id. throws an error if none was found
 */
export function GetDataOutConnectionByUniqueId(blocks: FlowGraphBlock[], uniqueId: string): FlowGraphDataConnection<any> {
    for (const block of blocks) {
        for (const dataOut of block.dataOutputs) {
            if (dataOut.uniqueId === uniqueId) {
                return dataOut;
            }
        }
    }
    throw new Error("Could not find data out connection with unique id " + uniqueId);
}

/**
 * Given a list of blocks, find an input signal connection that has a specific unique id
 * @param blocks a list of flow graph blocks
 * @param uniqueId the unique id of a connection
 * @returns the connection that has this unique id. throws an error if none was found
 */
export function GetSignalInConnectionByUniqueId(blocks: FlowGraphBlock[], uniqueId: string): FlowGraphSignalConnection {
    for (const block of blocks) {
        if (block instanceof FlowGraphExecutionBlock) {
            for (const signalIn of block.signalInputs) {
                if (signalIn.uniqueId === uniqueId) {
                    return signalIn;
                }
            }
        }
    }
    throw new Error("Could not find signal in connection with unique id " + uniqueId);
}

/**
 * Parses a serialized coordinator.
 * @param serializedObject the object to parse
 * @param options the options to use when parsing
 * @returns the parsed coordinator
 */
export async function ParseCoordinatorAsync(serializedObject: any, options: FlowGraphCoordinatorParseOptions) {
    const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
    const coordinator = new FlowGraphCoordinator({ scene: options.scene });
    // serializedObject._flowGraphs?.forEach((serializedGraph: any) => {
    //     FlowGraph.Parse(serializedGraph, { coordinator, valueParseFunction, pathConverter: options.pathConverter });
    // });
    // async-parse the flow graphs. This can be done in parallel
    await Promise.all(
        serializedObject._flowGraphs?.map((serializedGraph: any) => ParseGraphAsync(serializedGraph, { coordinator, valueParseFunction, pathConverter: options.pathConverter }))
    );
    return coordinator;
}

/**
 * Parses a graph from a given serialization object
 * @param serializationObject the object where the values are written
 * @param options options for parsing the graph
 * @returns the parsed graph
 */
export async function ParseGraphAsync(serializationObject: ISerializedFlowGraph, options: IFlowGraphParseOptions): Promise<FlowGraph> {
    const graph = options.coordinator.createGraph();
    const blocks: FlowGraphBlock[] = [];
    const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
    // get all classes types needed for the blocks using the block factory
    const resolvedClasses = await Promise.all(
        serializationObject.allBlocks.map(async (serializedBlock) => {
            const classFactory = blockFactory(serializedBlock.className as FlowGraphBlockNames);
            return await classFactory();
        })
    );
    // Parse all blocks
    // for (const serializedBlock of serializationObject.allBlocks) {
    for (let i = 0; i < serializationObject.allBlocks.length; i++) {
        const serializedBlock = serializationObject.allBlocks[i];
        const block = ParseBlockWithClassType(
            serializedBlock,
            { scene: options.coordinator.config.scene, pathConverter: options.pathConverter, valueParseFunction },
            resolvedClasses[i]
        );
        blocks.push(block);
        if (block instanceof FlowGraphEventBlock) {
            graph.addEventBlock(block);
        }
    }
    // After parsing all blocks, connect them
    for (const block of blocks) {
        for (const dataIn of block.dataInputs) {
            for (const serializedConnection of dataIn.connectedPointIds) {
                const connection = GetDataOutConnectionByUniqueId(blocks, serializedConnection);
                dataIn.connectTo(connection);
            }
        }
        if (block instanceof FlowGraphExecutionBlock) {
            for (const signalOut of block.signalOutputs) {
                for (const serializedConnection of signalOut.connectedPointIds) {
                    const connection = GetSignalInConnectionByUniqueId(blocks, serializedConnection);
                    signalOut.connectTo(connection);
                }
            }
        }
    }
    for (const serializedContext of serializationObject.executionContexts) {
        ParseContext(serializedContext, { graph, valueParseFunction });
    }
    // async will be used when we start using the block async factory
    return Promise.resolve(graph);
}

/**
 * Parses a context
 * @param serializationObject the object containing the context serialization values
 * @param options the options for parsing the context
 * @returns
 */
export function ParseContext(serializationObject: ISerializedFlowGraphContext, options: IFlowGraphContextParseOptions): FlowGraphContext {
    const result = options.graph.createContext();
    const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
    result.uniqueId = serializationObject.uniqueId;
    const scene = result.getScene();
    for (const key in serializationObject._userVariables) {
        const value = valueParseFunction(key, serializationObject._userVariables, scene);
        result.userVariables[key] = value;
    }
    for (const key in serializationObject._connectionValues) {
        const value = valueParseFunction(key, serializationObject._connectionValues, scene);
        result._setConnectionValueByKey(key, value);
    }

    return result;
}

/**
 * Parses a block from a serialization object
 * This function is async due to the factory method that is used to create the block's class. If you load the class externally use ParseBlockWithClassType
 * @param serializationObject the object to parse from
 * @param parseOptions options for parsing the block
 * @returns the parsed block
 */
export async function ParseBlockAsync(serializationObject: ISerializedFlowGraphBlock, parseOptions: IFlowGraphBlockParseOptions): Promise<FlowGraphBlock> {
    const classFactory = blockFactory(serializationObject.className as FlowGraphBlockNames);
    const classType = await classFactory();
    return ParseBlockWithClassType(serializationObject, parseOptions, classType);
}

/**
 * Parses a block from a serialization object
 * @param serializationObject the object to parse from
 * @param parseOptions options for parsing the block
 * @param classType the class type of the block. This is used when the class is not loaded asynchronously
 * @returns the parsed block
 */
export function ParseBlockWithClassType(
    serializationObject: ISerializedFlowGraphBlock,
    parseOptions: IFlowGraphBlockParseOptions,
    classType: typeof FlowGraphBlock
): FlowGraphBlock {
    const parsedConfig: any = {};
    const valueParseFunction = parseOptions.valueParseFunction ?? defaultValueParseFunction;
    if (serializationObject.config) {
        for (const key in serializationObject.config) {
            parsedConfig[key] = valueParseFunction(key, serializationObject.config, parseOptions.scene);
        }
    }
    if (needsPathConverter(serializationObject.className)) {
        parsedConfig.pathConverter = parseOptions.pathConverter;
    }
    const obj = new classType(parsedConfig);
    obj.uniqueId = serializationObject.uniqueId;
    for (let i = 0; i < serializationObject.dataInputs.length; i++) {
        const dataInput = obj.getDataInput(serializationObject.dataInputs[i].name);
        if (dataInput) {
            dataInput.deserialize(serializationObject.dataInputs[i]);
        } else {
            throw new Error("Could not find data input with name " + serializationObject.dataInputs[i].name + " in block " + serializationObject.className);
        }
    }
    for (let i = 0; i < serializationObject.dataOutputs.length; i++) {
        const dataOutput = obj.getDataOutput(serializationObject.dataOutputs[i].name);
        if (dataOutput) {
            dataOutput.deserialize(serializationObject.dataOutputs[i]);
        } else {
            throw new Error("Could not find data output with name " + serializationObject.dataOutputs[i].name + " in block " + serializationObject.className);
        }
    }
    obj.metadata = serializationObject.metadata;
    obj.deserialize && obj.deserialize(serializationObject);
    return obj;
}
