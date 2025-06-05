import type { SmartFilter } from "../smartFilter";
import type { BaseBlock } from "../blockFoundation/baseBlock";
import { inputBlockSerializer } from "../blockFoundation/inputBlock.serializer.js";
import type { ConnectionPoint } from "../connection/connectionPoint";
import { defaultBlockSerializer } from "./v1/defaultBlockSerializer.js";
import { OutputBlock } from "../blockFoundation/outputBlock.js";
import type {
    IBlockSerializerV1,
    ISerializedBlockV1,
    ISerializedConnectionV1,
    SerializeBlockV1,
    SerializedSmartFilterV1,
} from "./v1/smartFilterSerialization.types";
import { CustomShaderBlock } from "../blockFoundation/customShaderBlock.js";
import { CustomAggregateBlock } from "../blockFoundation/customAggregateBlock.js";

/**
 * Determines if two serialized connection points are equivalent to each other
 * @param a - The first connection point to compare
 * @param b - The second connection point to compare
 * @returns True if the connection points are equivalent, false otherwise
 */
function serializedConnectionPointsEqual(a: ISerializedConnectionV1, b: ISerializedConnectionV1): boolean {
    return (
        a.inputBlock === b.inputBlock &&
        a.inputConnectionPoint === b.inputConnectionPoint &&
        a.outputBlock === b.outputBlock &&
        a.outputConnectionPoint === b.outputConnectionPoint
    );
}

/**
 * Serializes SmartFilters using the latest SmartFilter serialization version.
 * The caller passes in information necessary to serialize the blocks in the SmartFilter.
 * This allows the caller to provide custom serializers for blocks beyond the core blocks.
 */
export class SmartFilterSerializer {
    private readonly _blockSerializers: Map<string, SerializeBlockV1> = new Map();

    /**
     * Creates a new SmartFilterSerializer
     * @param blocksUsingDefaultSerialization - A list of the blockType of blocks which can use default serialization (they only have ConnectionPoint properties and no constructor parameters)
     * @param additionalBlockSerializers - An array of block serializers to use, beyond those for the core blocks
     */
    public constructor(blocksUsingDefaultSerialization: string[], additionalBlockSerializers: IBlockSerializerV1[]) {
        this._blockSerializers.set(inputBlockSerializer.blockType, inputBlockSerializer.serialize);
        this._blockSerializers.set(OutputBlock.ClassName, defaultBlockSerializer);
        blocksUsingDefaultSerialization.forEach((block) => {
            this._blockSerializers.set(block, defaultBlockSerializer);
        });
        additionalBlockSerializers.forEach((serializer) =>
            this._blockSerializers.set(serializer.blockType, serializer.serialize)
        );
    }

    /**
     * Serializes a SmartFilter to a JSON object of the latest version
     * @param smartFilter - The SmartFilter to serialize
     * @returns The serialized SmartFilter
     */
    public serialize(smartFilter: SmartFilter): SerializedSmartFilterV1 {
        const connections: ISerializedConnectionV1[] = [];

        const blocks = smartFilter.attachedBlocks.map((block: BaseBlock) => {
            // Serialize the block itself
            const blockClassName = block.getClassName();
            const serializeFn =
                blockClassName === CustomShaderBlock.ClassName || blockClassName === CustomAggregateBlock.ClassName
                    ? defaultBlockSerializer
                    : this._blockSerializers.get(block.blockType);
            if (!serializeFn) {
                throw new Error(`No serializer was provided for a block of type ${block.blockType}`);
            }
            const serializedBlock: ISerializedBlockV1 = serializeFn(block);

            // Serialize the connections to the inputs
            block.inputs.forEach((input: ConnectionPoint) => {
                const connectedTo = input.connectedTo;
                if (connectedTo) {
                    const newConnection: ISerializedConnectionV1 = {
                        inputBlock: block.uniqueId,
                        inputConnectionPoint: input.name,
                        outputBlock: connectedTo.ownerBlock.uniqueId,
                        outputConnectionPoint: connectedTo.name,
                    };
                    if (!connections.find((other) => serializedConnectionPointsEqual(newConnection, other))) {
                        connections.push(newConnection);
                    }
                }
            });

            // Serialize the connections to the outputs
            block.outputs.forEach((output: ConnectionPoint) => {
                output.endpoints.forEach((input: ConnectionPoint) => {
                    const newConnection: ISerializedConnectionV1 = {
                        inputBlock: input.ownerBlock.uniqueId,
                        inputConnectionPoint: input.name,
                        outputBlock: block.uniqueId,
                        outputConnectionPoint: output.name,
                    };
                    if (!connections.find((other) => serializedConnectionPointsEqual(newConnection, other))) {
                        connections.push(newConnection);
                    }
                });
            });

            return serializedBlock;
        });

        return {
            format: "smartFilter",
            formatVersion: 1,
            name: smartFilter.name,
            namespace: smartFilter.namespace,
            comments: smartFilter.comments,
            editorData: smartFilter.editorData,
            blocks,
            connections,
        };
    }
}
