import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeNumber } from "../../../flowGraphRichTypes";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";

/**
 * @experimental
 * A block that sets the volume of an Audio V2 sound.
 */
export class FlowGraphSetSoundVolumeBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The sound to set the volume on.
     */
    public readonly sound: FlowGraphDataConnection<AbstractSound>;

    /**
     * Input connection: The target volume (0–1). Defaults to 1.
     */
    public readonly volume: FlowGraphDataConnection<number>;

    /**
     * Constructs a new FlowGraphSetSoundVolumeBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.sound = this.registerDataInput("sound", RichTypeAny);
        this.volume = this.registerDataInput("volume", RichTypeNumber, 1);
    }

    /**
     * @internal
     */
    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const soundValue = this.sound.getValue(context);
        if (!soundValue) {
            this._reportError(context, "No sound provided");
            this.out._activateSignal(context);
            return;
        }
        const vol = this.volume.getValue(context);
        soundValue.volume = vol;
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AudioSetVolume;
    }
}
RegisterClass(FlowGraphBlockNames.AudioSetVolume, FlowGraphSetSoundVolumeBlock);
