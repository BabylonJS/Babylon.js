import type { AssetType, FlowGraphAssetType } from "core/FlowGraph/flowGraphAssetsContext";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "core/FlowGraph/flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { RegisterClass } from "core/Misc/typeStore";

export interface IFlowGraphSetPropertyBlockConfiguration<O extends FlowGraphAssetType> {
    /**
     * The name of the property that will be set
     */
    propertyName?: string;

    /**
     * The target asset from which the property will be retrieved
     * // TODO - should it be any? or do we only support assets from the assetsContext?
     */
    target?: O;
}

/**
 * This block will set a property on a given target asset.
 * The property name can include dots ("."), which will be interpreted as a path to the property.
 * The target asset is an input and can be changed at any time.
 * The value of the property is an input and can be changed at any time.
 *
 * For example, with an input of a mesh asset, the property name "position.x" will set the x component of the position of the mesh.
 *
 * Note that it is recommended to input the object on which you are working on (i.e. a material) than providing a mesh and then getting the material from it.
 */
export class FlowGraphSetPropertyBlock<P extends any, O extends FlowGraphAssetType> extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * The class name of this block.
     */
    public static readonly ClassName = "FGSetPropertyBlock";
    /**
     * Input connection: The value to set on the property.
     */
    public readonly value: FlowGraphDataConnection<P>;

    /**
     * Input connection: The target asset from which the property will be retrieved
     */
    public readonly target: FlowGraphDataConnection<AssetType<O>>;

    /**
     * Input connection: The name of the property that will be set
     */
    public readonly propertyName: FlowGraphDataConnection<string>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphSetPropertyBlockConfiguration<O>
    ) {
        super(config);
        this.target = this.registerDataInput("target", RichTypeAny, config.target);
        this.value = this.registerDataInput("value", RichTypeAny);
        this.propertyName = this.registerDataInput("propertyName", RichTypeAny, config.propertyName);
    }
    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        try {
            const target = this.target.getValue(context);
            const value = this.value.getValue(context);
            this._setPropertyValue(target, this.propertyName.getValue(context), value);
        } catch (e) {
            this.error._activateSignal(context);
        }
        this.out._activateSignal(context);
    }

    private _setPropertyValue(target: AssetType<O>, propertyName: string, value: P): void {
        const path = propertyName.split(".");
        let obj = target as any;
        for (let i = 0; i < path.length - 1; i++) {
            const prop = path[i];
            if (obj[prop] === undefined) {
                obj[prop] = {};
            }
            obj = obj[prop];
        }
        obj[path[path.length - 1]] = value;
    }

    public override getClassName(): string {
        return FlowGraphSetPropertyBlock.ClassName;
    }
}

RegisterClass(FlowGraphSetPropertyBlock.ClassName, FlowGraphSetPropertyBlock);
