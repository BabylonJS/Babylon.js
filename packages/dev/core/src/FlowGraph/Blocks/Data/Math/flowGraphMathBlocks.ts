import { RegisterClass } from "core/Misc";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphAddBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphAddBlock.ClassName, config);
    }

    private _polymorphicAdd(a: any, b: any) {
        const aClassName = this._getClassNameOf(a);
        const bClassName = this._getClassNameOf(b);
        if (
            (aClassName === "Vector2" && bClassName === "Vector2") ||
            (aClassName === "Vector3" && bClassName === "Vector3") ||
            (aClassName === "Vector4" && bClassName === "Vector4")
        ) {
            return a.add(b);
        } else {
            return a + b;
        }
    }

    private _getClassNameOf(v: any) {
        if (v.getClassName) {
            return v.getClassName();
        }
        return "";
    }

    public static ClassName = "FGAddBlock";
}
RegisterClass(FlowGraphAddBlock.ClassName, FlowGraphAddBlock);
