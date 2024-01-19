import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeBoolean } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
/**
 * @experimental
 * Configuration for the while loop block.
 */
export interface IFlowGraphWhileLoopBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * If true, the loop body will be executed at least once.
     */
    isDo?: boolean;
}

/**
 * @experimental
 * A block that executes a branch while a condition is true.
 */
export class FlowGraphWhileLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The condition to evaluate.
     */
    public readonly condition: FlowGraphDataConnection<boolean>;
    /**
     * Output connection: The loop body.
     */
    public readonly loopBody: FlowGraphSignalConnection;

    constructor(
        /**
         * the configuration of the block
         */
        public config?: IFlowGraphWhileLoopBlockConfiguration
    ) {
        super(config);

        this.condition = this.registerDataInput("condition", RichTypeBoolean);
        this.loopBody = this._registerSignalOutput("loopBody");
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        let conditionValue = this.condition.getValue(context);
        if (this.config?.isDo && !conditionValue) {
            this.loopBody._activateSignal(context);
        }
        while (conditionValue) {
            this.loopBody._activateSignal(context);
            conditionValue = this.condition.getValue(context);
        }
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphWhileLoopBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGWhileLoopBlock";

    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    public serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.isDo = this.config?.isDo;
    }
}
RegisterClass(FlowGraphWhileLoopBlock.ClassName, FlowGraphWhileLoopBlock);
