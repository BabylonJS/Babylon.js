import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphNumber } from "core/FlowGraph/utils";
import { getNumericValue, isNumeric } from "core/FlowGraph/utils";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

export interface IFlowGraphDataSwitchBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The possible values for the selection.
     *
     */
    cases: FlowGraphNumber[];

    /**
     * If true, the cases will be treated as integers, meaning 1.1, 1.0, 0.1e1  and 1 will a single case - "1".
     * This is the default behavior in glTF interactivity.
     */
    treatCasesAsIntegers?: boolean;
}
/**
 * This block conditionally outputs one of its inputs, based on a condition and a list of cases.
 *
 * This of it as a passive (data) version of the switch statement in programming languages.
 */
export class FlowGraphDataSwitchBlock<T> extends FlowGraphBlock {
    /**
     * Current selection value.
     */
    public readonly case: FlowGraphDataConnection<FlowGraphNumber>;

    /**
     * Input: default value to output if no case is matched.
     */
    public readonly default: FlowGraphDataConnection<T>;

    /**
     * Output: the value that is output based on the selection.
     */
    public readonly value: FlowGraphDataConnection<T | undefined>;

    private _inputCases: Map<number, FlowGraphDataConnection<T>> = new Map();

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphDataSwitchBlockConfiguration<T>
    ) {
        super(config);

        this.case = this.registerDataInput("case", RichTypeAny, NaN);
        this.default = this.registerDataInput("default", RichTypeAny);
        this.value = this.registerDataOutput("value", RichTypeAny);

        // iterate the set not using for of
        const array = this.config.cases || [];
        for (let caseValue of array) {
            // if treat as integers, make sure not to set it again if it exists
            caseValue = getNumericValue(caseValue);
            if (this.config.treatCasesAsIntegers) {
                caseValue = caseValue | 0;
                if (this._inputCases.has(caseValue)) {
                    return;
                }
            }
            this._inputCases.set(caseValue, this.registerDataInput(`in_${caseValue}`, RichTypeAny));
        }
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        const selectionValue = this.case.getValue(context);
        let outputValue: T | undefined;
        if (isNumeric(selectionValue)) {
            outputValue = this._getOutputValueForCase(getNumericValue(selectionValue), context);
        } else {
            outputValue = this.default.getValue(context);
        }

        this.value.setValue(outputValue, context);
    }

    private _getOutputValueForCase(caseValue: number, context: FlowGraphContext): T | undefined {
        return this._inputCases.get(caseValue)?.getValue(context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.DataSwitch;
    }
}
RegisterClass(FlowGraphBlockNames.DataSwitch, FlowGraphDataSwitchBlock);
