/** This file must only contain pure code and pure imports */

import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeNumber } from "../../../flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";
import { RegisterClass } from "../../../../Misc/typeStore";

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

let _Registered = false;
/**
 * Register side effects for flowGraphGetSoundVolumeBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphGetSoundVolumeBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.AudioGetVolume, FlowGraphGetSoundVolumeBlock);
}
