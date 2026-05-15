import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeBoolean, RichTypeNumber } from "../../../flowGraphRichTypes";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";

/**
 * @experimental
 * A block that plays an Audio V2 sound.
 */
export class FlowGraphPlaySoundBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The sound to play.
     */
    public readonly sound: FlowGraphDataConnection<AbstractSound>;

    /**
     * Input connection: The volume to play at (0–1). Defaults to 1.
     */
    public readonly volume: FlowGraphDataConnection<number>;

    /**
     * Input connection: The time offset in seconds to start playback from. Defaults to 0.
     */
    public readonly startOffset: FlowGraphDataConnection<number>;

    /**
     * Input connection: Whether the sound should loop. Defaults to false.
     */
    public readonly loop: FlowGraphDataConnection<boolean>;

    /**
     * Constructs a new FlowGraphPlaySoundBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.sound = this.registerDataInput("sound", RichTypeAny);
        this.volume = this.registerDataInput("volume", RichTypeNumber, 1);
        this.startOffset = this.registerDataInput("startOffset", RichTypeNumber, 0);
        this.loop = this.registerDataInput("loop", RichTypeBoolean, false);
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
        const offset = this.startOffset.getValue(context);
        const loopVal = this.loop.getValue(context);
        soundValue.play({ volume: vol, startOffset: offset, loop: loopVal });
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AudioPlaySound;
    }
}
RegisterClass(FlowGraphBlockNames.AudioPlaySound, FlowGraphPlaySoundBlock);
