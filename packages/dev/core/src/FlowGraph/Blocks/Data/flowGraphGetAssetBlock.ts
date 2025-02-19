import type { AssetType, FlowGraphAssetType } from "core/FlowGraph/flowGraphAssetsContext";
import { GetFlowGraphAssetWithType } from "core/FlowGraph/flowGraphAssetsContext";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { Nullable } from "core/types";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import type { FlowGraphNumber } from "core/FlowGraph/utils";
import { getNumericValue } from "core/FlowGraph/utils";

/**
 * Configuration for the get asset block.
 */
export interface IFlowGraphGetAssetBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The type of the asset that will be retrieved.
     */
    type: T;
    /**
     * The index of the asset in the corresponding array in the assets context.
     * If not provided you can still change it using the input connection.
     */
    index?: number | FlowGraphInteger;

    /**
     * If set to true, instead of the index in the array it will search for the unique id of the asset.
     * The value of index will be used as the unique id.
     */
    useIndexAsUniqueId?: boolean;
}

/**
 * A block that will deliver an asset as an output, based on its type and place in the assets index.
 *
 * The assets are loaded from the assetsContext defined in the context running this block. The assetsContext is a class extending AbstractClass,
 * meaning it can be a Scene, an AssetsContainers, and any other class that extends AbstractClass.
 */
export class FlowGraphGetAssetBlock<T extends FlowGraphAssetType> extends FlowGraphBlock {
    /**
     * Output connection: The value of the property.
     */
    public readonly value: FlowGraphDataConnection<Nullable<AssetType<T>>>;

    /**
     * Input connection: The type of the asset.
     */
    public readonly type: FlowGraphDataConnection<T>;

    /**
     * Input connection: The index of the asset in the corresponding array in the assets context.
     */
    public readonly index: FlowGraphDataConnection<FlowGraphNumber>;

    public constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphGetAssetBlockConfiguration<T>
    ) {
        super(config);
        this.type = this.registerDataInput("type", RichTypeAny, config.type);
        this.value = this.registerDataOutput("value", RichTypeAny);
        this.index = this.registerDataInput("index", RichTypeAny, new FlowGraphInteger(getNumericValue(config.index ?? -1)));
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        const type = this.type.getValue(context);
        const index = this.index.getValue(context);
        // get the asset from the context
        const asset = GetFlowGraphAssetWithType(context.assetsContext, type, getNumericValue(index), this.config.useIndexAsUniqueId);
        this.value.setValue(asset, context);
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.GetAsset;
    }
}

RegisterClass(FlowGraphBlockNames.GetAsset, FlowGraphGetAssetBlock);
