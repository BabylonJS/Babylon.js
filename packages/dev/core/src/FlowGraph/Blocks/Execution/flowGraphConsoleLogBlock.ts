import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { Logger } from "core/Misc/logger";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

/**
 * Block that logs a message to the console.
 */
export class FlowGraphConsoleLogBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The message to log.
     */
    public readonly message: FlowGraphDataConnection<any>;

    /**
     * Input connection: The log type.
     */
    public readonly logType: FlowGraphDataConnection<"log" | "warn" | "error">;

    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.message = this.registerDataInput("message", RichTypeAny);
        this.logType = this.registerDataInput("logType", RichTypeAny, "log");
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        const typeValue = this.logType.getValue(context);
        const messageValue = this.message.getValue(context);
        if (typeValue === "warn") {
            Logger.Warn(messageValue);
        } else if (typeValue === "error") {
            Logger.Error(messageValue);
        } else {
            Logger.Log(messageValue);
        }
        // activate the output flow block
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.ConsoleLog;
    }
}

RegisterClass(FlowGraphBlockNames.ConsoleLog, FlowGraphConsoleLogBlock);
