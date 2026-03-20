import type { AssetType, FlowGraphAssetType } from "core/FlowGraph/flowGraphAssetsContext";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeString } from "core/FlowGraph/flowGraphRichTypes";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock";

/**
 * Configuration for the FlowGraphGetPropertyBlock.
 */
export interface IFlowGraphGetPropertyBlockConfiguration<O extends FlowGraphAssetType> extends IFlowGraphBlockConfiguration {
    /**
     * The name of the property that will be set
     */
    propertyName?: string;

    /**
     * The target asset from which the property will be retrieved
     */
    object?: AssetType<O>;

    /**
     * If true, the block will reset the output to the default value when the target asset is undefined.
     */
    resetToDefaultWhenUndefined?: boolean;
}

/**
 * This block will deliver a property of an asset, based on the property name and an input asset.
 * The property name can include dots ("."), which will be interpreted as a path to the property.
 *
 * For example, with an input of a mesh asset, the property name "position.x" will deliver the x component of the position of the mesh.
 *
 * Note that it is recommended to input the object on which you are working on (i.e. a material) rather than providing a mesh as object and then getting the material from it.
 */
export class FlowGraphGetPropertyBlock<P extends any, O extends FlowGraphAssetType> extends FlowGraphCachedOperationBlock<P> {
    /**
     * Input connection: The asset from which the property will be retrieved
     */
    public readonly object: FlowGraphDataConnection<AssetType<O>>;

    /**
     * Input connection: The name of the property that will be set
     */
    public readonly propertyName: FlowGraphDataConnection<string>;

    /**
     * Input connection: A function that can be used to get the value of the property.
     * This will be used if defined, instead of the default get function.
     */
    public readonly customGetFunction: FlowGraphDataConnection<(target: AssetType<O>, propertyName: string, context: FlowGraphContext) => P | undefined>;

    /**
     * Constructs a new FlowGraphGetPropertyBlock.
     * @param config - the configuration of the block
     */
    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphGetPropertyBlockConfiguration<O>
    ) {
        super(RichTypeAny, config);
        this.object = this.registerDataInput("object", RichTypeAny, config.object);
        this.propertyName = this.registerDataInput("propertyName", RichTypeString, config.propertyName);
        this.customGetFunction = this.registerDataInput("customGetFunction", RichTypeAny);
    }

    /**
     * Retrieves the property value from the target object.
     * @param context - the flow graph context
     * @returns the property value, or undefined if the target or property name is not set
     */
    public override _doOperation(context: FlowGraphContext): P | undefined {
        const getter = this.customGetFunction.getValue(context);
        let value;
        if (getter) {
            value = getter(this.object.getValue(context), this.propertyName.getValue(context), context);
        } else {
            const target = this.object.getValue(context);
            const propertyName = this.propertyName.getValue(context);
            value = target && propertyName ? this._getPropertyValue(target, propertyName) : undefined;
        }
        return value;
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

    /**
     * Returns the class name of this block.
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.GetProperty;
    }
}

RegisterClass(FlowGraphBlockNames.GetProperty, FlowGraphGetPropertyBlock);
