import type { SerializedShaderBlockDefinition } from "./serializedShaderBlockDefinition.js";
import type { SerializedSmartFilter } from "./serializedSmartFilter.js";

/**
 * Type that represents any type of serialized block definition - shader or aggregate.
 */
export type SerializedBlockDefinition = (SerializedShaderBlockDefinition | SerializedSmartFilter) & {
    /**
     * The type of block this is.
     */
    blockType: string;
};
