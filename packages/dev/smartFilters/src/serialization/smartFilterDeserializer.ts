import type { BaseBlock } from "../blockFoundation/baseBlock.js";
import type { SerializedSmartFilter } from "./serializedSmartFilter.js";
import { SmartFilter } from "../smartFilter.js";
import { ShaderBlock } from "../blockFoundation/shaderBlock.js";
import { InputBlockDeserializer } from "../blockFoundation/inputBlock.deserializer.js";
import { OutputBlock } from "../blockFoundation/outputBlock.js";
import type { ThinEngine } from "core/Engines/thinEngine.js";
import { InputBlock } from "../blockFoundation/inputBlock.js";
import type { ISerializedBlockV1, ISerializedConnectionV1, OptionalBlockDeserializerV1, SerializedSmartFilterV1 } from "./v1/smartFilterSerialization.types.js";
import { UniqueIdGenerator } from "../utils/uniqueIdGenerator.js";
import type { Nullable } from "core/types.js";

/**
 * A function that creates a block instance of the given class block type, or return null if it cannot.
 */
export type BlockFactory = (
    smartFilter: SmartFilter,
    engine: ThinEngine,
    serializedBlock: ISerializedBlockV1,
    smartFilterDeserializer: SmartFilterDeserializer
) => Promise<Nullable<BaseBlock>>;

/**
 * Deserializes serialized SmartFilters. The caller passes in a map of block deserializers it wants to use,
 * which allows the caller to provide custom deserializers for blocks beyond the core blocks.
 * The deserializer supports versioned serialized SmartFilters.
 */
export class SmartFilterDeserializer {
    private readonly _blockFactory: BlockFactory;
    private readonly _customInputBlockDeserializer?: OptionalBlockDeserializerV1;

    /**
     * Creates a new SmartFilterDeserializer
     * @param blockFactory - A function that creates a block of the given class name, or returns null if it cannot
     * @param customInputBlockDeserializer - An optional custom deserializer for InputBlocks - if supplied and it returns null, the default deserializer will be used
     */
    public constructor(blockFactory: BlockFactory, customInputBlockDeserializer?: OptionalBlockDeserializerV1) {
        this._blockFactory = blockFactory;
        this._customInputBlockDeserializer = customInputBlockDeserializer;
    }

    /**
     * Deserializes a SmartFilter from a JSON object - can be safely called multiple times and has no side effects within the class.
     * @param engine - The ThinEngine to pass to the new SmartFilter
     * @param smartFilterJson - The JSON object to deserialize
     * @returns A promise that resolves to the deserialized SmartFilter
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public async deserialize(engine: ThinEngine, smartFilterJson: any): Promise<SmartFilter> {
        const serializedSmartFilter: SerializedSmartFilter = smartFilterJson;

        // Back-compat for the rename of version to formatVersion, didn't warrant a new version
        if ((serializedSmartFilter as any).version && serializedSmartFilter.formatVersion === undefined) {
            serializedSmartFilter.formatVersion = (serializedSmartFilter as any).version;
        }

        switch (serializedSmartFilter.formatVersion) {
            case 1:
                return await this._deserializeV1Async(engine, serializedSmartFilter);
        }
    }

    private async _deserializeV1Async(engine: ThinEngine, serializedSmartFilter: SerializedSmartFilterV1): Promise<SmartFilter> {
        const smartFilter = new SmartFilter(serializedSmartFilter.name, serializedSmartFilter.namespace);
        const blockIdMap = new Map<number, BaseBlock>();

        // Only needed for smart filters saved before we started using uniqueIds for the maps, didn't warrant new version
        const blockNameMap = new Map<string, BaseBlock>();

        // Deserialize the SmartFilter level data
        smartFilter.comments = serializedSmartFilter.comments;
        smartFilter.editorData = serializedSmartFilter.editorData;

        // Deserialize the blocks
        const blockDeserializationWork: Promise<void>[] = [];
        const blockDefinitionsWhichCouldNotBeDeserialized: string[] = [];
        serializedSmartFilter.blocks.forEach((serializedBlock: ISerializedBlockV1) => {
            blockDeserializationWork.push(
                this._deserializeBlockV1Async(smartFilter, serializedBlock, engine, blockDefinitionsWhichCouldNotBeDeserialized, blockIdMap, blockNameMap)
            );
        });
        await Promise.all(blockDeserializationWork);

        // If any block definitions could not be deserialized, throw an error
        if (blockDefinitionsWhichCouldNotBeDeserialized.length > 0) {
            throw new Error(`Could not deserialize the following block definitions: ${blockDefinitionsWhichCouldNotBeDeserialized.join(", ")}`);
        }

        // Deserialize the connections
        serializedSmartFilter.connections.forEach((connection: ISerializedConnectionV1) => {
            // Find the source block and its connection point's connectTo function
            const sourceBlock = typeof connection.outputBlock === "string" ? blockNameMap.get(connection.outputBlock) : blockIdMap.get(connection.outputBlock);

            if (!sourceBlock) {
                throw new Error(`Source block ${connection.outputBlock} not found`);
            }
            const sourceConnectionPoint = sourceBlock.outputs.find((output) => output.name === connection.outputConnectionPoint);
            if (!sourceConnectionPoint || typeof sourceConnectionPoint.connectTo !== "function") {
                throw new Error(`Block ${connection.outputBlock} does not have an connection point named ${connection.outputConnectionPoint}`);
            }
            const sourceConnectToFunction = sourceConnectionPoint.connectTo.bind(sourceConnectionPoint);

            // Find the target block and its connection point
            const targetBlock = typeof connection.inputBlock === "string" ? blockNameMap.get(connection.inputBlock) : blockIdMap.get(connection.inputBlock);
            if (!targetBlock) {
                throw new Error(`Target block ${connection.inputBlock} not found`);
            }

            const targetConnectionPoint = targetBlock.inputs.find((input) => input.name === connection.inputConnectionPoint);
            if (!targetConnectionPoint || typeof targetConnectionPoint !== "object") {
                throw new Error(`Block ${connection.inputBlock} does not have a connection point named ${connection.inputConnectionPoint}`);
            }

            // Create the connection
            sourceConnectToFunction.call(sourceBlock, targetConnectionPoint);
        });

        return smartFilter;
    }

    private async _deserializeBlockV1Async(
        smartFilter: SmartFilter,
        serializedBlock: ISerializedBlockV1,
        engine: ThinEngine,
        blockTypesWhichCouldNotBeDeserialized: string[],
        blockIdMap: Map<number, BaseBlock>,
        blockNameMap: Map<string, BaseBlock>
    ): Promise<void> {
        let newBlock: Nullable<BaseBlock> = null;

        // Back compat for early Smart Filter V1 serialization where the blockType was stored in className
        // Not worth creating a new version for this, as it's only used in the deserializer
        if ((serializedBlock as any).className && !serializedBlock.blockType) {
            serializedBlock.blockType = (serializedBlock as any).className;
        }

        // Back compat for early Smart Filter V1 serialization where the namespace was not stored
        if (serializedBlock.namespace === undefined) {
            serializedBlock.namespace = null;
        }

        // Get the instance of the block
        switch (serializedBlock.blockType) {
            case InputBlock.ClassName:
                {
                    if (this._customInputBlockDeserializer) {
                        newBlock = await this._customInputBlockDeserializer(smartFilter, serializedBlock, engine);
                    }
                    if (newBlock === null) {
                        newBlock = InputBlockDeserializer(smartFilter, serializedBlock);
                    }
                }
                break;
            case OutputBlock.ClassName:
                {
                    newBlock = smartFilter.output.ownerBlock;
                }
                break;
            default: {
                // If it's not an input or output block, use the provided block factory
                newBlock = await this._blockFactory(smartFilter, engine, serializedBlock, this);
                if (!newBlock) {
                    if (blockTypesWhichCouldNotBeDeserialized.indexOf(serializedBlock.blockType) === -1) {
                        blockTypesWhichCouldNotBeDeserialized.push(serializedBlock.blockType);
                    }
                    return;
                }
            }
        }

        // Deserializers are not responsible for setting the uniqueId or comments.
        // This is so they don't have to be passed into the constructors when programmatically creating
        // blocks, and so each deserializer doesn't have to remember to do it.
        newBlock.uniqueId = serializedBlock.uniqueId;
        newBlock.comments = serializedBlock.comments;

        // Deserializers are also not responsible for deserializing the outputTextureOptions of ShaderBlocks.
        if (serializedBlock.outputTextureOptions && newBlock instanceof ShaderBlock) {
            newBlock.outputTextureOptions = serializedBlock.outputTextureOptions;
        }

        // We need to ensure any uniqueIds generated in the future (e.g. a new block is added to the SmartFilter)
        // are higher than this one.
        UniqueIdGenerator.EnsureIdsGreaterThan(newBlock.uniqueId);

        // Save in the map
        blockIdMap.set(newBlock.uniqueId, newBlock);
        blockNameMap.set(newBlock.name, newBlock);
    }
}
