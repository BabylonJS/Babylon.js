import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { Logger } from "core/Misc/logger";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

/**
 * Configuration for the console log block.
 */
export interface IFlowGraphConsoleLogBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * An optional message template to use for the log message.
     * If provided, the template can hold placeholders for the message value.
     * For example, if the template is "The message is: \{data\}", a new data input called "data" will be created.
     * The value of the message input will be used to replace the placeholder in the template.
     */
    messageTemplate?: string;
}

/**
 * Block that logs a message to the console.
 */
export class FlowGraphConsoleLogBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The message to log.
     * Will be ignored if a message template is provided.
     */
    public readonly message: FlowGraphDataConnection<any>;

    /**
     * Input connection: The log type.
     */
    public readonly logType: FlowGraphDataConnection<"log" | "warn" | "error">;

    public constructor(config?: IFlowGraphConsoleLogBlockConfiguration) {
        super(config);
        this.message = this.registerDataInput("message", RichTypeAny);
        this.logType = this.registerDataInput("logType", RichTypeAny, "log");
        if (config?.messageTemplate) {
            const matches = this._getTemplateMatches(config.messageTemplate);
            for (const match of matches) {
                this.registerDataInput(match, RichTypeAny);
            }
        }
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        const typeValue = this.logType.getValue(context);
        const messageValue = this._getMessageValue(context);
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

    private _getMessageValue(context: FlowGraphContext): string {
        if (this.config?.messageTemplate) {
            let template: string = this.config.messageTemplate;
            const matches = this._getTemplateMatches(template);
            for (const match of matches) {
                const value = this.getDataInput(match)?.getValue(context);
                if (value !== undefined) {
                    // replace all
                    template = template.replace(new RegExp(`\\{${match}\\}`, "g"), value.toString());
                }
            }
            return template;
        } else {
            return this.message.getValue(context);
        }
    }

    private _getTemplateMatches(template: string): string[] {
        const regex = /\{([^}]+)\}/g;
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(template)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }
}

RegisterClass(FlowGraphBlockNames.ConsoleLog, FlowGraphConsoleLogBlock);
