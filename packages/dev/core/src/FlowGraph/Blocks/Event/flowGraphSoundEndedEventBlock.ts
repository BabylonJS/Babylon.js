import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "../../flowGraphContext";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { type AbstractSound } from "../../../AudioV2/abstractAudio/abstractSound";
import { type Observer } from "../../../Misc/observable";
import { type Nullable } from "../../../types";

/**
 * @experimental
 * An event block that fires when an Audio V2 sound stops or ends.
 * Subscribes to the sound's onEndedObservable, which fires when playback
 * stops for any reason (natural completion or a manual call to stop()).
 * Does not fire when a looping sound naturally restarts, but will still
 * fire if a looping sound is explicitly stopped.
 */
export class FlowGraphSoundEndedEventBlock extends FlowGraphEventBlock {
    /**
     * Input connection: The sound to monitor for when playback stops or ends.
     */
    public readonly sound: FlowGraphDataConnection<AbstractSound>;

    /**
     * Constructs a new FlowGraphSoundEndedEventBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.sound = this.registerDataInput("sound", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _preparePendingTasks(context: FlowGraphContext): void {
        const soundValue = this.sound.getValue(context);
        if (!soundValue) {
            this._reportError(context, "No sound provided for sound-ended event");
            return;
        }
        const observer = soundValue.onEndedObservable.add(() => {
            this._execute(context);
        });
        // Store observer and subscribed sound per-context for safe multi-context usage
        context._setExecutionVariable(this, "_soundEndedObserver", observer);
        context._setExecutionVariable(this, "_subscribedSound", soundValue);
    }

    /**
     * @internal
     */
    public override _executeEvent(_context: FlowGraphContext, _payload: any): boolean {
        // This block manages its own observable subscription, so the
        // central event coordinator does not dispatch to it.
        return true;
    }

    /**
     * @internal
     */
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        const observer = context._getExecutionVariable<Nullable<Observer<AbstractSound>>>(this, "_soundEndedObserver", null);
        const subscribedSound = context._getExecutionVariable<Nullable<AbstractSound>>(this, "_subscribedSound", null);
        if (observer && subscribedSound) {
            subscribedSound.onEndedObservable.remove(observer);
        }
        context._setExecutionVariable(this, "_soundEndedObserver", null);
        context._setExecutionVariable(this, "_subscribedSound", null);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AudioSoundEndedEvent;
    }
}
RegisterClass(FlowGraphBlockNames.AudioSoundEndedEvent, FlowGraphSoundEndedEventBlock);
