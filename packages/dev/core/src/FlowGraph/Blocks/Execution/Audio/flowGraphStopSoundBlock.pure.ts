/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "../../../flowGraphRichTypes.pure";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * @experimental
 * A block that stops an Audio V2 sound.
 */
export class FlowGraphStopSoundBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The sound to stop.
     */
    public readonly sound: FlowGraphDataConnection<AbstractSound>;

    /**
     * Constructs a new FlowGraphStopSoundBlock.
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
        soundValue.stop();
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AudioStopSound;
    }
}


let _registered = false;
export function registerFlowGraphStopSoundBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass(FlowGraphBlockNames.AudioStopSound, FlowGraphStopSoundBlock);
}
