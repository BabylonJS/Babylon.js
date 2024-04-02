import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { Logger } from "core/Misc/logger";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class FlowGraphConsoleLogBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The message to log.
     */
    public readonly message: FlowGraphDataConnection<any>;

    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.message = this.registerDataInput("message", RichTypeAny);
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        const messageValue = this.message.getValue(context);
        Logger.Log(messageValue);
        // activate the output flow block
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphConsoleLogBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGConsoleLogBlock";
}
RegisterClass(FlowGraphConsoleLogBlock.ClassName, FlowGraphConsoleLogBlock);
