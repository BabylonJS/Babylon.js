/** This file must only contain pure code and pure imports */

import { type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { RichTypeBoolean, RichTypeFlowGraphInteger, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * A block that converts a boolean to a float.
 */
export class FlowGraphBooleanToFloat extends FlowGraphUnaryOperationBlock<boolean, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeNumber, (a) => +a, FlowGraphBlockNames.BooleanToFloat, config);
    }
}

/**
 * A block that converts a boolean to an integer
 */
export class FlowGraphBooleanToInt extends FlowGraphUnaryOperationBlock<boolean, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeFlowGraphInteger, (a) => FlowGraphInteger.FromValue(+a), FlowGraphBlockNames.BooleanToInt, config);
    }
}

/**
 * A block that converts a float to a boolean.
 */
export class FlowGraphFloatToBoolean extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeBoolean, (a) => !!a, FlowGraphBlockNames.FloatToBoolean, config);
    }
}

/**
 * A block that converts an integer to a boolean.
 */
export class FlowGraphIntToBoolean extends FlowGraphUnaryOperationBlock<FlowGraphInteger, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeFlowGraphInteger, RichTypeBoolean, (a) => !!a.value, FlowGraphBlockNames.IntToBoolean, config);
    }
}

/**
 * A block that converts an integer to a float.
 */
export class FlowGraphIntToFloat extends FlowGraphUnaryOperationBlock<FlowGraphInteger, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeFlowGraphInteger, RichTypeNumber, (a) => a.value, FlowGraphBlockNames.IntToFloat, config);
    }
}

/**
 * Configuration for the float to int block.
 */
export interface IFlowGraphFloatToIntConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The rounding mode to use.
     * if not defined, it will use the FlowGraphInteger default rounding ( a | 0 )
     */
    roundingMode?: "floor" | "ceil" | "round";
}
/**
 * A block that converts a float to an integer.
 */
export class FlowGraphFloatToInt extends FlowGraphUnaryOperationBlock<number, FlowGraphInteger> {
    constructor(config?: IFlowGraphFloatToIntConfiguration) {
        super(
            RichTypeNumber,
            RichTypeFlowGraphInteger,
            (a) => {
                const roundingMode = config?.roundingMode;
                switch (roundingMode) {
                    case "floor":
                        return FlowGraphInteger.FromValue(Math.floor(a));
                    case "ceil":
                        return FlowGraphInteger.FromValue(Math.ceil(a));
                    case "round":
                        return FlowGraphInteger.FromValue(Math.round(a));
                    default:
                        return FlowGraphInteger.FromValue(a);
                }
            },
            FlowGraphBlockNames.FloatToInt,
            config
        );
    }
}


let _registered = false;
export function registerFlowGraphTypeToTypeBlocks(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass(FlowGraphBlockNames.BooleanToFloat, FlowGraphBooleanToFloat);
    RegisterClass(FlowGraphBlockNames.BooleanToInt, FlowGraphBooleanToInt);
    RegisterClass(FlowGraphBlockNames.FloatToBoolean, FlowGraphFloatToBoolean);
    RegisterClass(FlowGraphBlockNames.IntToBoolean, FlowGraphIntToBoolean);
    RegisterClass(FlowGraphBlockNames.IntToFloat, FlowGraphIntToFloat);
    RegisterClass(FlowGraphBlockNames.FloatToInt, FlowGraphFloatToInt);
}
