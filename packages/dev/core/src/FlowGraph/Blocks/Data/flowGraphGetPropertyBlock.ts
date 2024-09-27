import type { AssetType, FlowGraphAssetType } from "core/FlowGraph/flowGraphAssetsContext";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";

export interface IFlowGraphGetPropertyBlockConfiguration<O extends FlowGraphAssetType> extends IFlowGraphBlockConfiguration {
    /**
     * The name of the property that will be set
     */
    propertyName: string;

    /**
     * The target asset from which the property will be retrieved
     * // TODO - should it be any? or do we only support assets from the assetsContext?
     */
    target?: AssetType<O>;
}

/**
 * This block will deliver a property of an asset, based on the property name and an input asset.
 * The property name can include dots ("."), which will be interpreted as a path to the property.
 * Property name is fixed and cannot be changed after the block is created.
 *
 * For example, with an input of a mesh asset, the property name "position.x" will deliver the x component of the position of the mesh.
 *
 * Note that it is recommended to input the object on which you are working on (i.e. a material) than providing a mesh and then getting the material from it.
 */
export class FlowGraphGetPropertyBlock<P extends any, O extends FlowGraphAssetType> extends FlowGraphBlock {
    /**
     * Output connection: The value of the property.
     */
    public readonly value: FlowGraphDataConnection<P>;

    /**
     * Input connection: The target asset from which the property will be retrieved
     */
    public readonly target: FlowGraphDataConnection<AssetType<O>>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphGetPropertyBlockConfiguration<O>
    ) {
        super(config);
        this.target = this.registerDataInput("target", RichTypeAny, config.target);
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        const target = this.target.getValue(context);
        const value = target ? this._getPropertyValue(target, this.config.propertyName) : undefined;
        if (value === undefined) {
            throw new Error(`Property ${this.config.propertyName} not found in the target asset.`);
        }
        this.value.setValue(value, context);
    }

    private _getPropertyValue(target: AssetType<O>, propertyName: string): P | undefined {
        const path = propertyName.split(".");
        let value: any = target;
        for (const prop of path) {
            value = value[prop];
            if (value === undefined) {
                return;
            }
        }
        return value as P;
    }
}
