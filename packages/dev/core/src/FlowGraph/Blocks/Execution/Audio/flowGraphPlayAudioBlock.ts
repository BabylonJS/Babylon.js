import { Sound } from "../../../../Audio/sound";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * A block that plays an audio.
 */
export class FlowGraphPlayAudioBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The audio to play.
     */
    public readonly audio: FlowGraphDataConnection<Sound>;

    constructor() {
        super();

        this.audio = this._registerDataInput("audio", RichTypeAny);
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const audioValue = this.audio.getValue(context);
        if (audioValue instanceof Sound) {
            audioValue.play();
        }
        this.onDone._activateSignal(context);
    }
}
