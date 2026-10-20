/** This file must only contain pure code and pure imports */

import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RichTypeNumber, RichTypeString } from "core/FlowGraph/flowGraphRichTypes.pure";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { RegisterClass } from "../../../Misc/typeStore";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

/**
 * Configuration for the scene tick event.
 */
export interface IFlowGraphSceneTickEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /** Whether elapsed time starts at the first tick, whose delta time remains NaN. Defaults to false. */
    useFirstTickAsStart?: boolean;
}

/** Event source key used to build this block's event reference. */
const EventKey = "sceneTick";

/**
 * Payload for the scene tick event.
 */
export interface IFlowGraphOnTickEventPayload {
    /**
     * The scene's accumulated time in seconds before the current frame interval.
     */
    timeSinceStart: number;
    /**
     * the time in seconds since the last frame.
     */
    deltaTime: number;
}

/**
 * Block that triggers on scene tick (before each render).
 */
export class FlowGraphSceneTickEventBlock extends FlowGraphEventBlock {
    /**
     * Time in seconds since the scene started, or since the first tick when useFirstTickAsStart is enabled.
     */
    public readonly timeSinceStart: FlowGraphDataConnection<number>;

    /**
     * Time in seconds since the last frame. Remains NaN on the first opted-in tick.
     */
    public readonly deltaTime: FlowGraphDataConnection<number>;

    /**
     * Output: the opaque reference identifying this event source.
     * All instances of this block share the same reference, so comparing the `event` output of two
     * of them for equality succeeds. The reference format is owned by the host environment.
     */
    public readonly eventRef: FlowGraphDataConnection<string>;

    public override readonly type: FlowGraphEventType = FlowGraphEventType.SceneBeforeRender;
    /** @returns the shared scene-tick event key */
    public override get eventKey(): string {
        return EventKey;
    }

    /**
     * Creates a scene tick event block.
     * @param config optional clock behavior
     */
    constructor(config?: IFlowGraphSceneTickEventBlockConfiguration) {
        super(config);
        this.timeSinceStart = this.registerDataOutput("timeSinceStart", RichTypeNumber, config?.useFirstTickAsStart ? NaN : 0);
        this.deltaTime = this.registerDataOutput("deltaTime", RichTypeNumber, config?.useFirstTickAsStart ? NaN : 0);
        this.eventRef = this.registerDataOutput("event", RichTypeString);
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        this.eventRef.setValue(context.getEventReference(EventKey), context);
    }

    /**
     * @internal
     */
    public override _preparePendingTasks(_context: FlowGraphContext): void {
        // no-op
    }

    /**
     * @internal
     */
    public override _executeEvent(context: FlowGraphContext, payload: IFlowGraphOnTickEventPayload): boolean {
        if (this.config?.useFirstTickAsStart) {
            const firstTick = context._getGlobalContextVariable("firstTickPayload", payload);
            context._setGlobalContextVariable("firstTickPayload", firstTick);
            // The scene counter advances after dispatch; elapsed time uses the current tick's interval instead of the first one.
            const elapsedTime = payload.timeSinceStart - firstTick.timeSinceStart + payload.deltaTime - firstTick.deltaTime;
            this.timeSinceStart.setValue(payload === firstTick ? 0 : elapsedTime, context);
            this.deltaTime.setValue(payload === firstTick ? NaN : payload.deltaTime, context);
        } else {
            this.timeSinceStart.setValue(payload.timeSinceStart, context);
            this.deltaTime.setValue(payload.deltaTime, context);
        }
        this.eventRef.setValue(context.getEventReference(EventKey), context);
        this._execute(context);
        return true;
    }

    /**
     * @internal
     */
    public override _cancelPendingTasks(_context: FlowGraphContext) {
        // no-op
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.SceneTickEvent;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphSceneTickEventBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphSceneTickEventBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.SceneTickEvent, FlowGraphSceneTickEventBlock);
}
