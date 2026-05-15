import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny, RichTypeBoolean } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";
import { SoundState } from "../../../../AudioV2/soundState";

/**
 * @experimental
 * A data block that checks whether an Audio V2 sound is currently playing.
 */
export class FlowGraphIsSoundPlayingBlock extends FlowGraphCachedOperationBlock<boolean> {
    /**
     * Input connection: The sound to check.
     */
    public readonly sound: FlowGraphDataConnection<AbstractSound>;

    /**
     * Constructs a new FlowGraphIsSoundPlayingBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, config);
        this.sound = this.registerDataInput("sound", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _doOperation(context: FlowGraphContext): boolean | undefined {
        const soundValue = this.sound.getValue(context);
        if (!soundValue) {
            return undefined;
        }
        return soundValue.state === SoundState.Started || soundValue.state === SoundState.Starting;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AudioIsSoundPlaying;
    }
}
RegisterClass(FlowGraphBlockNames.AudioIsSoundPlaying, FlowGraphIsSoundPlayingBlock);
