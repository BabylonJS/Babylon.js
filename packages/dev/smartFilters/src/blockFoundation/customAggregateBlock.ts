/* eslint-disable import/no-internal-modules */
import type { ThinEngine } from "core/Engines/thinEngine.js";
import type { SmartFilterDeserializer, SerializedBlockDefinition } from "../serialization/index.js";
import type { SmartFilter } from "../smartFilter.js";
import { AggregateBlock } from "./aggregateBlock.js";
import type { BaseBlock } from "./baseBlock.js";
import type { Nullable } from "core/types.js";

/**
 * Loads a serialized Smart Filter into a block which can be used in another SmartFilter.
 */
export class CustomAggregateBlock extends AggregateBlock {
    /**
     * Creates a new CustomAggregateBlock
     * @param smartFilter - The Smart Filter to create the block for
     * @param engine - The ThinEngine to use
     * @param name - The friendly name of the block
     * @param serializedSmartFilter - The serialized SmartFilter to load into the block
     * @param smartFilterDeserializer - The deserializer to use
     * @returns A promise that resolves to the new CustomAggregateBlock
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static async Create(
        smartFilter: SmartFilter,
        engine: ThinEngine,
        name: string,
        serializedSmartFilter: SerializedBlockDefinition,
        smartFilterDeserializer: SmartFilterDeserializer
    ): Promise<BaseBlock> {
        const innerSmartFilter = await smartFilterDeserializer.deserialize(engine, serializedSmartFilter);
        return new CustomAggregateBlock(smartFilter, name, serializedSmartFilter.blockType, serializedSmartFilter.namespace, innerSmartFilter, false);
    }

    /**
     * The class name of the block.
     */
    public static override ClassName = "CustomAggregateBlock";

    private readonly _blockType: string;
    private readonly _namespace: Nullable<string>;

    /**
     * The type of the block - used when serializing / deserializing the block, and in the editor.
     */
    public override get blockType(): string {
        return this._blockType;
    }

    /**
     * The namespace of the block, which is used to reduce name collisions between blocks and also to group blocks in the editor UI.
     * By convention, sub namespaces are separated by a period (e.g. "Babylon.Demo.Effects").
     */
    public override get namespace(): Nullable<string> {
        return this._namespace;
    }

    private constructor(smartFilter: SmartFilter, name: string, blockType: string, namespace: Nullable<string>, innerSmartFilter: SmartFilter, disableOptimization: boolean) {
        super(smartFilter, name, disableOptimization);

        this._blockType = blockType;
        this._namespace = namespace;

        const attachedBlocks = innerSmartFilter.attachedBlocks;
        for (let index = 0; index < attachedBlocks.length; index++) {
            const block = attachedBlocks[index];
            if (block && block.isInput && block.outputs[0]) {
                // If this input block is connected to anything (has any endpoints), create an input connection point for it
                if (block.outputs[0].endpoints.length > 0) {
                    this._registerSubfilterInput(block.name, block.outputs[0].endpoints.slice(), block.outputs[0].runtimeData ?? null);
                }

                // Remove this input block from the Smart Filter graph - this will reset the runtimeData to the
                // default for that connection point (which may be null)
                innerSmartFilter.removeBlock(block);
                index--;
            }
        }

        if (!innerSmartFilter.output.connectedTo) {
            throw new Error("The inner smart filter must have an output connected to something");
        }

        this._registerSubfilterOutput("output", innerSmartFilter.output.connectedTo);

        // Disconnect the inner Smart Filter output from the inner Smart Filter
        innerSmartFilter.output.connectedTo.disconnectFrom(innerSmartFilter.output);
    }
}
