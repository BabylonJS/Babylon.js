import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";
import { SoundState } from "../../../../AudioV2/soundState";

/**
 * @experimental
 * A block that pauses an Audio V2 sound. If the sound is already paused, resumes it.
 */
export class FlowGraphPauseSoundBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The sound to pause or resume.
     */
    public readonly sound: FlowGraphDataConnection<AbstractSound>;

    /**
     * Constructs a new FlowGraphPauseSoundBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.sound = this.registerDataInput("sound", RichTypeAny);
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
        if (soundValue.state === SoundState.Paused) {
            soundValue.resume();
        } else if (soundValue.state === SoundState.Starting || soundValue.state === SoundState.Started) {
            soundValue.pause();
        }
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AudioPauseSound;
    }
}
RegisterClass(FlowGraphBlockNames.AudioPauseSound, FlowGraphPauseSoundBlock);
