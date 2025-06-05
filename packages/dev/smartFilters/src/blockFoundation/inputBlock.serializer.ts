import { InputBlockBase, type InputBlock } from "./inputBlock.js";
import type { BaseBlock } from "./baseBlock.js";
import { ConnectionPointType } from "../connection/connectionPointType.js";
import type {
    BooleanInputBlockData,
    Color3InputBlockData,
    Color4InputBlockData,
    FloatInputBlockData,
    SerializedInputBlockData,
    TextureInputBlockData,
    Vector2InputBlockData,
} from "./inputBlock.serialization.types.js";
import type { IBlockSerializerV1 } from "../serialization/v1/smartFilterSerialization.types.js";

/**
 * Determines which generic type of InputBlock we are trying to serialize and calls the appropriate function
 * to serialize the specifics for that type of InputBlock
 * @param inputBlock - The InputBlock to serialize
 * @returns Serialized data for the InputBlock
 */
function serializeInputBlockData(inputBlock: InputBlockBase): SerializedInputBlockData {
    switch (inputBlock.type) {
        case ConnectionPointType.Texture:
            return serializeTextureInputBlock(inputBlock as InputBlock<ConnectionPointType.Texture>);
        case ConnectionPointType.Boolean:
            return serializeBooleanInputBlock(inputBlock as InputBlock<ConnectionPointType.Boolean>);
        case ConnectionPointType.Float:
            return serializeFloatInputBlock(inputBlock as InputBlock<ConnectionPointType.Float>);
        case ConnectionPointType.Color3:
            return serializeColor3InputBlock(inputBlock as InputBlock<ConnectionPointType.Color3>);
        case ConnectionPointType.Color4:
            return serializeColor4InputBlock(inputBlock as InputBlock<ConnectionPointType.Color4>);
        case ConnectionPointType.Vector2:
            return serializeVector2InputBlock(inputBlock as InputBlock<ConnectionPointType.Vector2>);
    }
}

/**
 * Generates the serialized data for a Texture InputBlock
 * @param inputBlock - The Texture InputBlock to serialize
 * @returns The serialized data for the InputBlock
 */
function serializeTextureInputBlock(inputBlock: InputBlock<ConnectionPointType.Texture>): TextureInputBlockData {
    const internalTexture = inputBlock.runtimeValue.value?.getInternalTexture();
    const forcedExtension = internalTexture?._extension ?? null;

    let url = internalTexture?.url ?? null;
    if (url === "" || !url) {
        url = inputBlock.editorData?.url ?? null;
    }

    return {
        inputType: ConnectionPointType.Texture,
        url,
        urlTypeHint: inputBlock.editorData?.urlTypeHint ?? null,
        flipY: internalTexture?.invertY ?? null,
        anisotropicFilteringLevel: internalTexture?.anisotropicFilteringLevel ?? null,
        forcedExtension: forcedExtension !== "" ? forcedExtension : null,
        appMetadata: inputBlock.appMetadata,
    };
}

/**
 * Generates the serialized data for a Boolean InputBlock
 * @param inputBlock - The Boolean InputBlock to serialize
 * @returns The serialized data for the InputBlock
 */
function serializeBooleanInputBlock(inputBlock: InputBlock<ConnectionPointType.Boolean>): BooleanInputBlockData {
    return {
        inputType: ConnectionPointType.Boolean,
        value: inputBlock.runtimeValue.value,
        appMetadata: inputBlock.appMetadata,
    };
}

/**
 * Generates the serialized data for a Float InputBlock
 * @param inputBlock - The Float InputBlock to serialize
 * @returns The serialized data for the InputBlock
 */
function serializeFloatInputBlock(inputBlock: InputBlock<ConnectionPointType.Float>): FloatInputBlockData {
    return {
        inputType: ConnectionPointType.Float,
        value: inputBlock.runtimeValue.value,
        animationType: inputBlock.editorData?.animationType ?? null,
        valueDeltaPerMs: inputBlock.editorData?.valueDeltaPerMs ?? null,
        min: inputBlock.editorData?.min ?? null,
        max: inputBlock.editorData?.max ?? null,
        appMetadata: inputBlock.appMetadata,
    };
}

/**
 * Generates the serialized data for a Color3 InputBlock
 * @param inputBlock - The Color3 InputBlock to serialize
 * @returns The serialized data for the InputBlock
 */
function serializeColor3InputBlock(inputBlock: InputBlock<ConnectionPointType.Color3>): Color3InputBlockData {
    return {
        inputType: ConnectionPointType.Color3,
        value: inputBlock.runtimeValue.value,
        appMetadata: inputBlock.appMetadata,
    };
}

/**
 * Generates the serialized data for a Color4 InputBlock
 * @param inputBlock - The Color4 InputBlock to serialize
 * @returns The serialized data for the InputBlock
 */
function serializeColor4InputBlock(inputBlock: InputBlock<ConnectionPointType.Color4>): Color4InputBlockData {
    return {
        inputType: ConnectionPointType.Color4,
        value: inputBlock.runtimeValue.value,
        appMetadata: inputBlock.appMetadata,
    };
}

/**
 * Generates the serialized data for a Vector2 InputBlock
 * @param inputBlock - The Vector2 InputBlock to serialize
 * @returns The serialized data for the InputBlock
 */
function serializeVector2InputBlock(inputBlock: InputBlock<ConnectionPointType.Vector2>): Vector2InputBlockData {
    return {
        inputType: ConnectionPointType.Vector2,
        value: inputBlock.runtimeValue.value,
        appMetadata: inputBlock.appMetadata,
    };
}

/**
 * The V1 serializer for an InputBlock
 */
export const inputBlockSerializer: IBlockSerializerV1 = {
    blockType: InputBlockBase.ClassName,
    serialize: (block: BaseBlock) => {
        if (block.blockType !== InputBlockBase.ClassName) {
            throw new Error("Was asked to serialize an unrecognized block type");
        }
        return {
            name: block.name,
            uniqueId: block.uniqueId,
            blockType: InputBlockBase.ClassName,
            namespace: null,
            comments: block.comments,
            data: serializeInputBlockData(block as unknown as InputBlockBase),
        };
    },
};
