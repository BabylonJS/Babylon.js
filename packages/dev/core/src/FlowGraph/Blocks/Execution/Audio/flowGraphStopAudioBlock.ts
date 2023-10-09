import { Sound } from "../../../../Audio/sound";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Stops an audio.
 * @experimental
 */
export class FlowGraphStopAudioBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The audio to stop.
     */
    public readonly audio: FlowGraphDataConnection<Sound>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.audio = this._registerDataInput("audio", RichTypeAny);
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const audioValue = this.audio.getValue(context);
        if (audioValue instanceof Sound) {
            audioValue.stop();
        }
    }

    public getClassName(): string {
        return "FGStopAudioBlock";
    }
}
RegisterClass("FGStopAudioBlock", FlowGraphStopAudioBlock);
