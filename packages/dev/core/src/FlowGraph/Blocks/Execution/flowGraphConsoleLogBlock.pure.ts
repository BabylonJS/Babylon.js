/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection.pure";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeString } from "../../flowGraphRichTypes.pure";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { Logger } from "core/Misc/logger";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

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
        if (typeof config?.messageTemplate === "string") {
            const matches = this._getTemplateMatches(config.messageTemplate);
            const registered = new Set<string>();
            for (const match of matches) {
                if (!registered.has(match.name)) {
                    registered.add(match.name);
                    this.registerDataInput(match.name, RichTypeAny);
                }
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
        if (typeof this.config?.messageTemplate === "string") {
            let template: string = this.config.messageTemplate;
            const matches = this._getTemplateMatches(template);
            // If the message input is an object, use its keys as the primary
            // source for template placeholders, falling back to named data inputs.
            const messageValue = this.message.getValue(context);
            const messageObj = messageValue !== null && messageValue !== undefined && typeof messageValue === "object" ? messageValue : null;
            const replacements = new Map<string, string | undefined>();
            for (const match of matches) {
                if (replacements.has(match.name)) {
                    continue;
                }
                let value: any;
                if (messageObj !== null && match.name in messageObj) {
                    value = messageObj[match.name];
                } else {
                    value = this.getDataInput(match.name)?.getValue(context);
                }
                replacements.set(match.name, value === undefined ? undefined : this._serializeValue(value).replace(/[{}]/g, "$&$&"));
            }
            for (let index = matches.length - 1; index >= 0; index--) {
                const match = matches[index];
                const serialized = replacements.get(match.name);
                if (serialized !== undefined) {
                    template = template.substring(0, match.start) + serialized + template.substring(match.end + 1);
                }
            }
            return template.replace(/\{\{/g, "{").replace(/\}\}/g, "}");
        } else {
            // No template — pass the raw value directly so Logger receives the original
            // object (e.g. Vector3) rather than a stringified representation.
            return this.message.getValue(context);
        }
    }

    private _getTemplateMatches(template: string): { name: string; start: number; end: number }[] {
        let state = 0;
        let parameterStart = -1;
        const matches: { name: string; start: number; end: number }[] = [];
        for (let index = 0; index < template.length; index++) {
            const character = template[index];
            if (character === "{") {
                if (state === 0) {
                    state = 1;
                } else if (state === 1) {
                    state = 0;
                } else {
                    return [];
                }
            } else if (character === "}") {
                if (state === 0) {
                    state = 3;
                } else if (state === 3) {
                    state = 0;
                } else if (state === 2) {
                    matches.push({
                        name: template.substring(parameterStart + 1, index),
                        start: parameterStart,
                        end: index,
                    });
                    state = 0;
                } else {
                    return [];
                }
            } else if (state === 1) {
                parameterStart = index - 1;
                state = 2;
            } else if (state === 3) {
                return [];
            }
        }
        return state === 0 ? matches : [];
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphConsoleLogBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphConsoleLogBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.ConsoleLog, FlowGraphConsoleLogBlock);
}
