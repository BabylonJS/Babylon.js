/** This file must only contain pure code and pure imports */

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { FlowGraphKeyboardEventBlock, type IFlowGraphKeyboardEventBlockConfiguration } from "./flowGraphKeyboardEventBlock";

/**
 * A keyboard event block that fires when a key is released.
 * Inherits all inputs/outputs from {@link FlowGraphKeyboardEventBlock}.
 */
export class FlowGraphKeyUpEventBlock extends FlowGraphKeyboardEventBlock {
    /** @internal */
    public override readonly type: FlowGraphEventType = FlowGraphEventType.KeyUp;

    /**
     * Creates a new FlowGraphKeyUpEventBlock.
     * @param config optional configuration
     */
    public constructor(config?: IFlowGraphKeyboardEventBlockConfiguration) {
        super(config);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.KeyUpEvent;
    }
}

let _Registered = false;
/**
 * Registers the FlowGraphKeyUpEventBlock class.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphKeyUpEventBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.KeyUpEvent, FlowGraphKeyUpEventBlock);
}
