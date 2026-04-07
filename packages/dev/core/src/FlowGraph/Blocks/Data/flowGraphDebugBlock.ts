import { type FlowGraphContext } from "../../flowGraphContext";
import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "../../flowGraphBlock";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { type Nullable } from "../../../types";

/**
 * Maximum number of log entries stored by the debug block.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const MAX_LOG_ENTRIES = 100;

/**
 * A passthrough block used to debug data values flowing through connections.
 * Spliced into a data connection to observe the value passing through it.
 */
export class FlowGraphDebugBlock extends FlowGraphBlock {
    /**
     * Input connection: The value to observe.
     */
    public readonly input: FlowGraphDataConnection<any>;

    /**
     * Output connection: The same value, passed through unchanged.
     */
    public readonly output: FlowGraphDataConnection<any>;

    /**
     * Log of values that have passed through this block.
     * Each entry is a [displayString, tooltipString] tuple.
     */
    public log: string[][] = [];

    /**
     * Whether this block is a debug block.
     * Used by the editor to identify debug blocks.
     */
    public readonly _isDebug: boolean = true;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.input = this.registerDataInput("input", RichTypeAny);
        this.output = this.registerDataOutput("output", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _updateOutputs(context: FlowGraphContext): void {
        const value = this.input.getValue(context);
        this.output.setValue(value, context);
        this._logValue(value);
    }

    /**
     * Format and store a value in the log.
     * @param value
     */
    private _logValue(value: Nullable<any>): void {
        if (value === null || value === undefined) {
            this.log.push(["null", "null"]);
        } else {
            const formatted = FlowGraphDebugBlock._FormatValue(value);
            this.log.push([formatted, String(value)]);
        }
        if (this.log.length > MAX_LOG_ENTRIES) {
            this.log.shift();
        }
    }

    /**
     * Type-aware value formatting.
     * @param value the value to format
     * @returns a human-readable string
     */
    private static _FormatValue(value: any): string {
        if (typeof value === "number") {
            return Number.isInteger(value) ? value.toString() : value.toFixed(4);
        }
        if (typeof value === "boolean" || typeof value === "string") {
            return String(value);
        }
        // Vector-like objects with x, y, z, w
        if (value && typeof value === "object") {
            if ("w" in value && "x" in value && "y" in value && "z" in value) {
                return `(${value.x.toFixed(3)}, ${value.y.toFixed(3)}, ${value.z.toFixed(3)}, ${value.w.toFixed(3)})`;
            }
            if ("z" in value && "x" in value && "y" in value) {
                return `(${value.x.toFixed(3)}, ${value.y.toFixed(3)}, ${value.z.toFixed(3)})`;
            }
            if ("x" in value && "y" in value) {
                return `(${value.x.toFixed(3)}, ${value.y.toFixed(3)})`;
            }
            // Color3/Color4 with r, g, b
            if ("r" in value && "g" in value && "b" in value) {
                const a = "a" in value ? `, ${value.a.toFixed(3)}` : "";
                return `(${value.r.toFixed(3)}, ${value.g.toFixed(3)}, ${value.b.toFixed(3)}${a})`;
            }
            if (typeof value.toString === "function" && value.toString !== Object.prototype.toString) {
                return value.toString();
            }
        }
        try {
            const str = JSON.stringify(value);
            return str.length > 64 ? str.substring(0, 61) + "..." : str;
        } catch {
            return String(value);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.DebugBlock;
    }
}

RegisterClass(FlowGraphBlockNames.DebugBlock, FlowGraphDebugBlock);
