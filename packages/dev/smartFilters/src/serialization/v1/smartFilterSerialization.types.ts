import type { Nullable } from "core/types.js";
import type { BaseBlock } from "../../blockFoundation/baseBlock.js";
import type { SmartFilter } from "../../smartFilter.js";
import type { ThinEngine } from "core/Engines/thinEngine.js";
import type { IEditorData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeLocationInfo.js";
import type { SmartFilterDeserializer } from "../smartFilterDeserializer.js";
import type { OutputTextureOptions } from "../../blockFoundation/textureOptions.js";

/**
 * ----------------------------------------------------------------------------
 * Serialized Data Types
 * ----------------------------------------------------------------------------
 */

/**
 * V1 Serialized Smart Filter
 */
export type SerializedSmartFilterV1 = {
    /** Which type of serialized data this is. */
    format: "smartFilter";

    /** The format version of the serialized data (not the version of the SmartFilter itself).*/
    formatVersion: 1;

    /** The SmartFilter name */
    name: string;

    /** The namespace of the SmartFilter */
    namespace: Nullable<string>;

    /** The SmartFilter comments */
    comments: Nullable<string>;

    /** The editor data for the SmartFilter */
    editorData: Nullable<IEditorData>;

    /** The serialized blocks */
    blocks: ISerializedBlockV1[];

    /** The serialized connections */
    connections: ISerializedConnectionV1[];
};

/**
 * V1 format of a block in a serialized Smart Filter.
 * Not to be confused with a SerializedBlockDefinitionV1 which serializes the definition of a CustomShaderBlock.
 */
export interface ISerializedBlockV1 {
    /** The name of the block */
    name: string;

    /** The namespace of the block */
    namespace: Nullable<string>;

    /** The unique ID of the block - correlates with the ID in the editorData for block position, etc. */
    uniqueId: number;

    /** The blockType of the block - used to determine how to instantiate the block during deserialization */
    blockType: string;

    /** The comments for the block */
    comments: Nullable<string>;

    /** The OutputTextureOptions for serialized ShaderBlocks */
    outputTextureOptions?: OutputTextureOptions;

    /** Block specific serialized data */
    data: any;
}

/**
 * V1 Serialized Connection
 */
export interface ISerializedConnectionV1 {
    /** The uniqueId of the block that the connection is to */
    outputBlock: number;

    /** The name of the connectionPoint on the outputBlock */
    outputConnectionPoint: string;

    /** The uniqueId of the block that the connection is from */
    inputBlock: number;

    /** The name of the connectionPoint on the inputBlock */
    inputConnectionPoint: string;
}

/**
 * ----------------------------------------------------------------------------
 * Serializer Types
 * ----------------------------------------------------------------------------
 */

/**
 * A function that serializes a block to a V1 serialized block object
 */
export type SerializeBlockV1 = (block: BaseBlock) => ISerializedBlockV1;

/**
 * A V1 serializer for blocks in a SmartFilter
 */
export interface IBlockSerializerV1 {
    /** The blockType of the block that this serializer can serialize */
    blockType: string;

    /** The function that serializes the block in the Smart Filter */
    serialize: SerializeBlockV1;
}

/**
 * ----------------------------------------------------------------------------
 * Deserializer Types
 * ----------------------------------------------------------------------------
 */

/**
 * A function that deserializes a V1 block in a SmartFilter
 */
export type DeserializeBlockV1 = (
    smartFilter: SmartFilter,
    serializedBlock: ISerializedBlockV1,
    engine: ThinEngine,
    smartFilterDeserializer: SmartFilterDeserializer
) => Promise<BaseBlock>;

/**
 * A function that optionally deserializes a block from a V1 serialized block object, returning null if it cannot
 */
export type OptionalBlockDeserializerV1 = (smartFilter: SmartFilter, serializedBlock: ISerializedBlockV1, engine: ThinEngine) => Promise<Nullable<BaseBlock>>;
