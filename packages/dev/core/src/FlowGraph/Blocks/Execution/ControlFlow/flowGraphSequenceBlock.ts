import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";

export interface IFlowGraphSequenceBlockConfiguration extends IFlowGraphBlockConfiguration {
    numberOutputFlows: number;
}

export class FlowGraphSequenceBlock extends FlowGraphExecutionBlock {
    public outFlows: FlowGraphSignalConnection[];

    constructor(public config: IFlowGraphSequenceBlockConfiguration) {
        super(config);
    }

    public configure(): void {
        super.configure();
        this.outFlows = [];
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows.push(this._registerSignalOutput(`${i}`));
        }
    }

    public _execute(context: FlowGraphContext) {
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows[i]._activateSignal(context);
        }
    }

    public getClassName(): string {
        return FlowGraphSequenceBlock.ClassName;
    }

    public static ClassName = "FGSequenceBlock";
}
RegisterClass(FlowGraphSequenceBlock.ClassName, FlowGraphSequenceBlock);
