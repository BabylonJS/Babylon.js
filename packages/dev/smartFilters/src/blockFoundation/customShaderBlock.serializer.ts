import type { ISerializedBlockV1, SerializeBlockV1 } from "../serialization/v1/smartFilterSerialization.types.js";
import type { BaseBlock } from "./baseBlock.js";
import { CustomShaderBlock } from "./customShaderBlock.js";

/**
 * Data for a dynamic property on a CustomShaderBlock
 */
export type CustomShaderBlockData = {
    /**
     * The custom properties of the CustomShaderBlock
     */
    customProperties: CustomPropertyData[];
};

type CustomPropertyData = {
    name: string;
    value: any;
};

/**
 * Serializes a CustomShaderBlock to V1 serialized data.
 * @param block - The block to serialize
 * @returns The serialized block
 */
export const CustomShaderBlockSerializer: SerializeBlockV1 = (block: BaseBlock): ISerializedBlockV1 => {
    if (block.getClassName() !== CustomShaderBlock.ClassName) {
        throw new Error("Was asked to serialize an unrecognized block type");
    }
    const customShaderBlock = block as CustomShaderBlock;

    let data: CustomShaderBlockData | undefined;
    const dynamicPropertyNames = customShaderBlock.dynamicPropertyNames;
    if (dynamicPropertyNames.length > 0) {
        data = {
            customProperties: dynamicPropertyNames.map((propertyName) => ({
                name: propertyName,
                value: (customShaderBlock as any)[propertyName],
            })),
        };
    }

    return {
        name: customShaderBlock.name,
        uniqueId: customShaderBlock.uniqueId,
        blockType: customShaderBlock.blockType,
        namespace: customShaderBlock.namespace,
        comments: customShaderBlock.comments,
        data,
        outputTextureOptions: customShaderBlock.outputTextureOptions,
    };
};
