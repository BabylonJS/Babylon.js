import { type KeyboardInfo } from "core/Events/keyboardEvents";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeBoolean } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { FlowGraphKeyboardEventBlock, type IFlowGraphKeyboardEventBlockConfiguration } from "./flowGraphKeyboardEventBlock";

/**
 * Configuration for the key down event block.
 */
export interface IFlowGraphKeyDownEventBlockConfiguration extends IFlowGraphKeyboardEventBlockConfiguration {
    /**
     * When true, auto-repeat key-down events (the user holding a key) are
     * ignored and only the initial press fires the block. Defaults to false.
     */
    ignoreRepeat?: boolean;
}

/**
 * A keyboard event block that fires when a key is pressed down.
 * Extends {@link FlowGraphKeyboardEventBlock} with an `isRepeat` output
 * and an `ignoreRepeat` configuration option.
 */
export class FlowGraphKeyDownEventBlock extends FlowGraphKeyboardEventBlock {
    /**
     * Output connection: whether this is an auto-repeat event (key held down).
     */
    public readonly isRepeat: FlowGraphDataConnection<boolean>;

    /** @internal */
    public override readonly type: FlowGraphEventType = FlowGraphEventType.KeyDown;

    /**
     * Creates a new FlowGraphKeyDownEventBlock.
     * @param config optional configuration
     */
    public constructor(config?: IFlowGraphKeyDownEventBlockConfiguration) {
        super(config);
        this.isRepeat = this.registerDataOutput("isRepeat", RichTypeBoolean);
    }

    /** @internal */
    public override _executeEvent(context: FlowGraphContext, keyboardInfo: KeyboardInfo): boolean {
        const repeat = keyboardInfo.event.repeat ?? false;

        // Skip auto-repeat events when configured to do so.
        if (repeat && (this.config as IFlowGraphKeyDownEventBlockConfiguration)?.ignoreRepeat) {
            return true;
        }

        // Delegate to the base class for key filtering, output population, and execution.
        const result = super._executeEvent(context, keyboardInfo);

        // Set the repeat output after the base class has set all other outputs.
        this.isRepeat.setValue(repeat, context);
        return result;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.KeyDownEvent;
    }
}
RegisterClass(FlowGraphBlockNames.KeyDownEvent, FlowGraphKeyDownEventBlock);
