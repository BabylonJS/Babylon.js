import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";

/**
 * @experimental
 * A data block that reads the current volume of an Audio V2 sound.
 */
export class FlowGraphGetSoundVolumeBlock extends FlowGraphCachedOperationBlock<number> {
    /**
     * Input connection: The sound to read the volume from.
     */
    public readonly sound: FlowGraphDataConnection<AbstractSound>;

    /**
     * Constructs a new FlowGraphGetSoundVolumeBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, config);
        this.sound = this.registerDataInput("sound", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _doOperation(context: FlowGraphContext): number | undefined {
        const soundValue = this.sound.getValue(context);
        if (!soundValue) {
            return undefined;
        }
        return soundValue.volume;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AudioGetVolume;
    }
}
RegisterClass(FlowGraphBlockNames.AudioGetVolume, FlowGraphGetSoundVolumeBlock);
