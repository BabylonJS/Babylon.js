/** This file must only contain pure code and pure imports */

import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeBoolean } from "../../../flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { type AbstractSound } from "../../../../AudioV2/abstractAudio/abstractSound";
import { SoundState } from "../../../../AudioV2/soundState";
import { RegisterClass } from "../../../../Misc/typeStore";

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

let _registered = false;
export function registerFlowGraphIsSoundPlayingBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass(FlowGraphBlockNames.AudioIsSoundPlaying, FlowGraphIsSoundPlayingBlock);
}
