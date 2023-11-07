import { RegisterClass } from "core/Misc";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RichTypeAny, RichTypeBoolean, RichTypeNumber, RichTypeVector3 } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { _getClassNameOf, _areSameVectorClass } from "./utils";
import { Vector3 } from "core/Maths";

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
        if (_areSameVectorClass(aClassName, bClassName)) {
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

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphSubtractBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphSubtractBlock.ClassName, config);
    }

    private _polymorphicAdd(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName)) {
            return a.subtract(b);
        } else {
            return a - b;
        }
    }

    public getClassName(): string {
        return FlowGraphSubtractBlock.ClassName;
    }

    public static ClassName = "FGSubBlock";
}
RegisterClass(FlowGraphSubtractBlock.ClassName, FlowGraphSubtractBlock);

export class FlowGraphMultiplyBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMultiply(a, b), FlowGraphMultiplyBlock.ClassName, config);
    }

    private _polymorphicMultiply(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName)) {
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
        super(RichTypeNumber, () => Math.random(), FlowGraphRandomBlock.ClassName, config);
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

export class FlowGraphDotBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeNumber, (a, b) => Vector3.Dot(a, b), FlowGraphDotBlock.ClassName, config);
    }

    public static ClassName = "FGDotBlock";
}
RegisterClass(FlowGraphDotBlock.ClassName, FlowGraphDotBlock);
