import { RegisterClass } from "core/Misc";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RichTypeAny, RichTypeBoolean, RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { _getClassNameOf } from "./utils";

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphAddBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphAddBlock.ClassName, config);
    }

    private _polymorphicAdd(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
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

    public getClassName(): string {
        return FlowGraphAddBlock.ClassName;
    }

    public static ClassName = "FGAddBlock";
}
RegisterClass(FlowGraphAddBlock.ClassName, FlowGraphAddBlock);

export class FlowGraphMultiplyBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMultiply(a, b), FlowGraphMultiplyBlock.ClassName, config);
    }

    private _polymorphicMultiply(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (
            (aClassName === "Vector2" && bClassName === "Vector2") ||
            (aClassName === "Vector3" && bClassName === "Vector3") ||
            (aClassName === "Vector4" && bClassName === "Vector4")
        ) {
            return a.multiply(b);
        } else {
            return a * b;
        }
    }

    public static ClassName = "FGMultiplyBlock";
}
RegisterClass(FlowGraphMultiplyBlock.ClassName, FlowGraphMultiplyBlock);

export class FlowGraphRandomBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, () => Math.random(), FlowGraphRandomBlock.ClassName, config);
    }

    public static ClassName = "FGRandomBlock";
}
RegisterClass(FlowGraphRandomBlock.ClassName, FlowGraphRandomBlock);

export class FlowGraphLessThanBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (a, b) => a < b, FlowGraphLessThanBlock.ClassName, config);
    }

    public static ClassName = "FGLessThanBlock";
}
RegisterClass(FlowGraphLessThanBlock.ClassName, FlowGraphLessThanBlock);
