import type { ThinEngine } from "core/Engines/thinEngine.js";
import type { SmartFilter, SmartFilterDeserializer, ISerializedBlockV1, BaseBlock } from "smart-filters";

/**
 * Options for the block factory when creating a new block
 */
export interface IBlockRegistrationFactoryOptions {
    /**
     * If true, automatic input blocks will not be created for the block
     */
    suppressAutomaticInputBlocks?: boolean;

    /**
     * If a serialized block is not provided, this is the name to use for the block, otherwise a default will be used
     */
    name?: string;
}

/**
 * An object which describes a block definition, as well as a factory for creating a new instance of the block or
 * deserializing it
 */
export interface IBlockRegistration {
    /**
     * The block type of the block
     */
    blockType: string;

    /**
     * Creates an instance of the block, either fresh or deserialized from a serialized block
     * @param smartFilter - The smart filter to create the block for
     * @param engine - The engine to use for creating blocks
     * @param smartFilterDeserializer - The deserializer to use for deserializing blocks
     * @param serializedBlock - The serialized block to deserialize, if any
     * @param options - Options for creating the block
     * @returns - A promise for a new instance of the block
     */
    factory?: (
        smartFilter: SmartFilter,
        engine: ThinEngine,
        smartFilterDeserializer: SmartFilterDeserializer,
        serializedBlock?: ISerializedBlockV1,
        options?: IBlockRegistrationFactoryOptions
    ) => Promise<BaseBlock>;

    /**
     * The namespace of the block
     */
    namespace: string;

    /**
     * A tooltip for the block if displayed in an editor, for instance
     */
    tooltip: string;

    /**
     * True if this is an input block
     */
    isInput?: boolean;

    /**
     * If true, this represents a custom block (not one that was programmatically included)
     */
    isCustom?: boolean;
}
