import { Sound } from "core/Audio";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

/**
 * Stops an audio.
 * @experimental
 */
export class FlowGraphStopAudioBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The audio to stop.
     */
    public readonly audio: FlowGraphDataConnection<Sound>;

    constructor() {
        super();

        this.audio = this._registerDataInput("audio", RichTypeAny);
    }
    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        const audioValue = this.audio.getValue(context);
        if (audioValue instanceof Sound) {
            audioValue.stop();
        }
    }
}
