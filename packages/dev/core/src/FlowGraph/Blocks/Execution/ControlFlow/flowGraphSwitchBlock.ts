import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import type { FlowGraphNumber } from "core/FlowGraph/utils";
import { getNumericValue, isNumeric } from "core/FlowGraph/utils";
/**
 * Configuration for a switch block.
 */
export interface IFlowGraphSwitchBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The possible values for the selection.
     */
    cases: T[];
}

/**
 * A block that executes a branch based on a selection.
 */
export class FlowGraphSwitchBlock<T extends FlowGraphNumber> extends FlowGraphExecutionBlock {
    /**
     * Input connection: The value of the selection.
     */
    public readonly case: FlowGraphDataConnection<T>;

    /**
     * The default case to execute if no other case is found.
     */
    public readonly default: FlowGraphSignalConnection = this._registerSignalOutput("default");

    private _caseToOutputFlow: Map<T, FlowGraphSignalConnection> = new Map();

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphSwitchBlockConfiguration<T>
    ) {
        super(config);

        this.case = this.registerDataInput("case", RichTypeAny);

        // iterate the set not using for of
        const array = this.config.cases || [];
        for (const caseValue of array) {
            this._caseToOutputFlow.set(caseValue, this._registerSignalOutput(`out_${caseValue}`));
        }
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const selectionValue = this.case.getValue(context);
        let outputFlow: FlowGraphSignalConnection | undefined;
        if (isNumeric(selectionValue)) {
            outputFlow = this._getOutputFlowForCase(getNumericValue(selectionValue) as T);
        } else {
            outputFlow = this._getOutputFlowForCase(selectionValue);
        }

        if (outputFlow) {
            outputFlow._activateSignal(context);
        } else {
            this.default._activateSignal(context);
        }
    }

    /**
     * Adds a new case to the switch block.
     * @param newCase the new case to add.
     */
    public addCase(newCase: T): void {
        if (this.config.cases.includes(newCase)) {
            return;
        }
        this.config.cases.push(newCase);
        this._caseToOutputFlow.set(newCase, this._registerSignalOutput(`out_${newCase}`));
    }

    /**
     * Removes a case from the switch block.
     * @param caseToRemove the case to remove.
     */
    public removeCase(caseToRemove: T): void {
        if (!this.config.cases.includes(caseToRemove)) {
            return;
        }
        const index = this.config.cases.indexOf(caseToRemove);
        this.config.cases.splice(index, 1);
        this._caseToOutputFlow.delete(caseToRemove);
    }

    /**
     * @internal
     */
    public _getOutputFlowForCase(caseValue: T) {
        return this._caseToOutputFlow.get(caseValue);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.Switch;
    }

    /**
     * Serialize the block to a JSON representation.
     * @param serializationObject the object to serialize to.
     */
    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.cases = this.config.cases;
    }
}
RegisterClass(FlowGraphBlockNames.Switch, FlowGraphSwitchBlock);
