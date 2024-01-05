import { Sound } from "../../../../Audio/sound";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * A block that plays an audio.
 */
export class FlowGraphPlayAudioBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The audio to play.
     */
    public readonly audio: FlowGraphDataConnection<Sound>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.audio = this.registerDataInput("audio", RichTypeAny);
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const audioValue = this.audio.getValue(context);
        if (audioValue instanceof Sound) {
            audioValue.play();
        }
        this.out._activateSignal(context);
    }

    public getClassName(): string {
        return "FGPlayAudioBlock";
    }
}
RegisterClass("FGPlayAudioBlock", FlowGraphPlayAudioBlock);
