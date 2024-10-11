import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Configuration for a switch block.
 */
export interface IFlowGraphSwitchBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The possible values for the selection.
     */
    cases: Set<T>;
}

/**
 * @experimental
 * A block that executes a branch based on a selection.
 */
export class FlowGraphSwitchBlock<T = number> extends FlowGraphExecutionBlock {
    /**
     * The class name of the block.
     */
    public static readonly ClassName = "FGSwitchBlock";
    /**
     * Input connection: The value of the selection.
     */
    public readonly selection: FlowGraphDataConnection<T>;

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

        this.selection = this.registerDataInput("selection", RichTypeAny);

        // iterate the set not using for of
        this.config.cases.forEach((caseValue) => {
            this._caseToOutputFlow.set(caseValue, this._registerSignalOutput(`out_${caseValue}`));
        });
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const selectionValue = this.selection.getValue(context);

        const outputFlow = this._getOutputFlowForCase(selectionValue);
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
        if (this.config.cases.has(newCase)) {
            return;
        }
        this.config.cases.add(newCase);
        this._caseToOutputFlow.set(newCase, this._registerSignalOutput(`out_${newCase}`));
    }

    /**
     * Removes a case from the switch block.
     * @param caseToRemove the case to remove.
     */
    public removeCase(caseToRemove: T): void {
        if (!this.config.cases.has(caseToRemove)) {
            return;
        }
        this.config.cases.delete(caseToRemove);
        this._caseToOutputFlow.delete(caseToRemove);
    }

    private _getOutputFlowForCase(caseValue: T) {
        return this._caseToOutputFlow.get(caseValue);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphSwitchBlock.ClassName;
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
RegisterClass(FlowGraphSwitchBlock.ClassName, FlowGraphSwitchBlock);
