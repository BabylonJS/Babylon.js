import type { SerializedShaderBlockDefinition } from "./serializedShaderBlockDefinition";
import type { SerializedSmartFilter } from "./serializedSmartFilter";

/**
 * Type that represents any type of serialized block definition - shader or aggregate.
 */
export type SerializedBlockDefinition = (SerializedShaderBlockDefinition | SerializedSmartFilter) & {
    /**
     * The type of block this is.
     */
    blockType: string;
};
