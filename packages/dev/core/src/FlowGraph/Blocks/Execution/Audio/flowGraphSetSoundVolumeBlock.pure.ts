/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeNumber } from "../../../flowGraphRichTypes.pure";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";
import { RegisterClass } from "../../../../Misc/typeStore";

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

let _Registered = false;
/**
 * Register side effects for flowGraphSetSoundVolumeBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphSetSoundVolumeBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.AudioSetVolume, FlowGraphSetSoundVolumeBlock);
}
