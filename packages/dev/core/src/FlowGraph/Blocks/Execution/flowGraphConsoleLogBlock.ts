import { type FlowGraphContext } from "../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeString } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
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

    /**
     * Creates a new console log block.
     * @param config optional configuration
     */
    public constructor(config?: IFlowGraphConsoleLogBlockConfiguration) {
        super(config);
        this.message = this.registerDataInput("message", RichTypeAny);
        this.logType = this.registerDataInput("logType", RichTypeString, "log") as FlowGraphDataConnection<"log" | "warn" | "error">;
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

    private _serializeValue(value: any): string {
        if (value === null || value === undefined) {
            return String(value);
        }
        if (typeof value === "object") {
            // Prefer the object's own toString() (e.g. Vector3 → "{X:1 Y:2 Z:3}").
            // Only fall back to JSON.stringify when toString() is the unhelpful default.
            const str = value.toString();
            if (str === "[object Object]") {
                try {
                    return JSON.stringify(value);
                } catch {
                    return str;
                }
            }
            return str;
        }
        return String(value);
    }

    private _getMessageValue(context: FlowGraphContext): string {
        if (this.config?.messageTemplate) {
            let template: string = this.config.messageTemplate;
            const matches = this._getTemplateMatches(template);
            // If the message input is an object, use its keys as the primary
            // source for template placeholders, falling back to named data inputs.
            const messageValue = this.message.getValue(context);
            const messageObj = messageValue !== null && messageValue !== undefined && typeof messageValue === "object" ? messageValue : null;
            for (const match of matches) {
                let value: any;
                if (messageObj !== null && match in messageObj) {
                    value = messageObj[match];
                } else {
                    value = this.getDataInput(match)?.getValue(context);
                }
                if (value !== undefined) {
                    // Escape regex metacharacters in the placeholder name before building the pattern.
                    const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    template = template.replace(new RegExp(`\\{${escapedMatch}\\}`, "g"), this._serializeValue(value));
                }
            }
            return template;
        } else {
            // No template — pass the raw value directly so Logger receives the original
            // object (e.g. Vector3) rather than a stringified representation.
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
