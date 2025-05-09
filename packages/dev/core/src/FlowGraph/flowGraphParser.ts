import type { IAssetContainer } from "core/IAssetContainer";
import { blockFactory } from "./Blocks/flowGraphBlockFactory";
import type { FlowGraphBlockNames } from "./Blocks/flowGraphBlockNames";
import type { FlowGraph, IFlowGraphParseOptions } from "./flowGraph";
import type { FlowGraphBlock, IFlowGraphBlockParseOptions } from "./flowGraphBlock";
import type { FlowGraphContext, IFlowGraphContextParseOptions } from "./flowGraphContext";
import type { IFlowGraphCoordinatorParseOptions } from "./flowGraphCoordinator";
import { FlowGraphCoordinator } from "./flowGraphCoordinator";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";
import { defaultValueParseFunction, needsPathConverter } from "./serialization";
import type { ISerializedFlowGraph, ISerializedFlowGraphBlock, ISerializedFlowGraphContext } from "./typeDefinitions";
import type { Node } from "core/node";
import { getRichTypeByFlowGraphType, RichType } from "./flowGraphRichTypes";
import type { FlowGraphConnection } from "./flowGraphConnection";

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
export async function ParseCoordinatorAsync(serializedObject: any, options: IFlowGraphCoordinatorParseOptions) {
    const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
    const coordinator = new FlowGraphCoordinator({ scene: options.scene });

    if (serializedObject.dispatchEventsSynchronously) {
        coordinator.dispatchEventsSynchronously = serializedObject.dispatchEventsSynchronously;
    }

    await options.scene.whenReadyAsync();
    // if custom default values are defined, set them in the global context
    if (serializedObject._defaultValues) {
        for (const key in serializedObject._defaultValues) {
            // key is the FlowGraphType, value is the default value
            const value = serializedObject._defaultValues[key];
            getRichTypeByFlowGraphType(key).defaultValue = value;
        }
    }
    // async-parse the flow graphs. This can be done in parallel
    await Promise.all(
        serializedObject._flowGraphs?.map(
            async (serializedGraph: any) => await ParseFlowGraphAsync(serializedGraph, { coordinator, valueParseFunction, pathConverter: options.pathConverter })
        )
    );
    return coordinator;
}

/**
 * Parses a graph from a given serialization object
 * @param serializationObject the object where the values are written
 * @param options options for parsing the graph
 * @returns the parsed graph
 */
export async function ParseFlowGraphAsync(serializationObject: ISerializedFlowGraph, options: IFlowGraphParseOptions): Promise<FlowGraph> {
    // get all classes types needed for the blocks using the block factory
    const resolvedClasses = await Promise.all(
        serializationObject.allBlocks.map(async (serializedBlock) => {
            const classFactory = blockFactory(serializedBlock.className as FlowGraphBlockNames);
            return await classFactory();
        })
    );
    // async will be used when we start using the block async factory
    return ParseFlowGraph(serializationObject, options, resolvedClasses);
}

/**
 * Parses a graph from a given serialization object
 * @param serializationObject the object where the values are written
 * @param options options for parsing the graph
 * @param resolvedClasses the resolved classes for the blocks
 * @returns the parsed graph
 */
export function ParseFlowGraph(serializationObject: ISerializedFlowGraph, options: IFlowGraphParseOptions, resolvedClasses: (typeof FlowGraphBlock)[]) {
    const graph = options.coordinator.createGraph();
    const blocks: FlowGraphBlock[] = [];
    const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
    // Parse all blocks
    // for (const serializedBlock of serializationObject.allBlocks) {
    for (let i = 0; i < serializationObject.allBlocks.length; i++) {
        const serializedBlock = serializationObject.allBlocks[i];
        const block = ParseFlowGraphBlockWithClassType(
            serializedBlock,
            { scene: options.coordinator.config.scene, pathConverter: options.pathConverter, assetsContainer: options.coordinator.config.scene, valueParseFunction },
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
        ParseFlowGraphContext(serializedContext, { graph, valueParseFunction }, serializationObject.rightHanded);
    }
    return graph;
}

/**
 * Parses a context
 * @param serializationObject the object containing the context serialization values
 * @param options the options for parsing the context
 * @param rightHanded whether the serialized data is right handed
 * @returns
 */
export function ParseFlowGraphContext(serializationObject: ISerializedFlowGraphContext, options: IFlowGraphContextParseOptions, rightHanded?: boolean): FlowGraphContext {
    const result = options.graph.createContext();
    if (serializationObject.enableLogging) {
        result.enableLogging = true;
    }
    result.treatDataAsRightHanded = rightHanded || false;
    const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
    result.uniqueId = serializationObject.uniqueId;
    const scene = result.getScene();
    // check if assets context is available
    if (serializationObject._assetsContext) {
        const ac = serializationObject._assetsContext;
        const assetsContext: IAssetContainer = {
            meshes: ac.meshes?.map((m: string) => scene.getMeshById(m)),
            lights: ac.lights?.map((l: string) => scene.getLightByName(l)),
            cameras: ac.cameras?.map((c: string) => scene.getCameraByName(c)),
            materials: ac.materials?.map((m: string) => scene.getMaterialById(m)),
            textures: ac.textures?.map((t: string) => scene.getTextureByName(t)),
            animations: ac.animations?.map((a: string) => scene.animations.find((anim) => anim.name === a)),
            skeletons: ac.skeletons?.map((s: string) => scene.getSkeletonByName(s)),
            particleSystems: ac.particleSystems?.map((ps: string) => scene.getParticleSystemById(ps)),
            animationGroups: ac.animationGroups?.map((ag: string) => scene.getAnimationGroupByName(ag)),
            transformNodes: ac.transformNodes?.map((tn: string) => scene.getTransformNodeById(tn)),
            rootNodes: [],
            multiMaterials: [],
            morphTargetManagers: [],
            geometries: [],
            actionManagers: [],
            environmentTexture: null,
            postProcesses: [],
            sounds: null,
            effectLayers: [],
            layers: [],
            reflectionProbes: [],
            lensFlareSystems: [],
            proceduralTextures: [],
            getNodes: function (): Array<Node> {
                throw new Error("Function not implemented.");
            },
        };
        result.assetsContext = assetsContext;
    }
    for (const key in serializationObject._userVariables) {
        const value = valueParseFunction(key, serializationObject._userVariables, result.assetsContext, scene);
        result.userVariables[key] = value;
    }
    for (const key in serializationObject._connectionValues) {
        const value = valueParseFunction(key, serializationObject._connectionValues, result.assetsContext, scene);
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
    return ParseFlowGraphBlockWithClassType(serializationObject, parseOptions, classType);
}

/**
 * Parses a block from a serialization object
 * @param serializationObject the object to parse from
 * @param parseOptions options for parsing the block
 * @param classType the class type of the block. This is used when the class is not loaded asynchronously
 * @returns the parsed block
 */
export function ParseFlowGraphBlockWithClassType(
    serializationObject: ISerializedFlowGraphBlock,
    parseOptions: IFlowGraphBlockParseOptions,
    classType: typeof FlowGraphBlock
): FlowGraphBlock {
    const parsedConfig: any = {};
    const valueParseFunction = parseOptions.valueParseFunction ?? defaultValueParseFunction;
    if (serializationObject.config) {
        for (const key in serializationObject.config) {
            parsedConfig[key] = valueParseFunction(key, serializationObject.config, parseOptions.assetsContainer || parseOptions.scene, parseOptions.scene);
        }
    }
    if (needsPathConverter(serializationObject.className)) {
        if (!parseOptions.pathConverter) {
            throw new Error("Path converter is required for this block");
        }
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

/**
 * Parses a connection from an object
 * @param serializationObject the object to parse from.
 * @param ownerBlock the block that owns the connection.
 * @param classType the class type of the connection.
 * @returns the parsed connection.
 */
export function ParseGraphConnectionWithClassType<BlockT extends FlowGraphBlock>(serializationObject: any = {}, ownerBlock: BlockT, classType: typeof FlowGraphConnection) {
    const connection = new classType(serializationObject.name, serializationObject._connectionType, ownerBlock);
    connection.deserialize(serializationObject);
    return connection;
}

/**
 * Parses a data connection from a serialized object.
 * @param serializationObject the object to parse from
 * @param ownerBlock the block that owns the connection
 * @param classType the class type of the data connection
 * @returns the parsed connection
 */
export function ParseGraphDataConnection(serializationObject: any, ownerBlock: FlowGraphBlock, classType: typeof FlowGraphDataConnection): FlowGraphDataConnection<any> {
    const richType = ParseRichType(serializationObject.richType);
    const defaultValue = serializationObject.defaultValue;
    const connection = new classType(serializationObject.name, serializationObject._connectionType, ownerBlock, richType, defaultValue, !!serializationObject._optional);
    connection.deserialize(serializationObject);
    return connection;
}

/**
 * Parses a rich type from a serialization object.
 * @param serializationObject a serialization object
 * @returns the parsed rich type
 */
function ParseRichType(serializationObject: any): RichType<any> {
    return new RichType(serializationObject.typeName, serializationObject.defaultValue);
}
