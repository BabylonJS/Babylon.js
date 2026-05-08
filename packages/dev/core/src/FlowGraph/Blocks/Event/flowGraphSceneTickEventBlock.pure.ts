/** This file must only contain pure code and pure imports */

import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes.pure";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { RegisterClass } from "../../../Misc/typeStore";

/**
 * Payload for the scene tick event.
 */
export interface IFlowGraphOnTickEventPayload {
    /**
     * the time in seconds since the scene started.
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
     * the time in seconds since the scene started.
     */
    public readonly timeSinceStart: FlowGraphDataConnection<number>;

    /**
     * the time in seconds since the last frame.
     */
    public readonly deltaTime: FlowGraphDataConnection<number>;

    public override readonly type: FlowGraphEventType = FlowGraphEventType.SceneBeforeRender;

    constructor() {
        super();
        this.timeSinceStart = this.registerDataOutput("timeSinceStart", RichTypeNumber);
        this.deltaTime = this.registerDataOutput("deltaTime", RichTypeNumber);
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
        this.timeSinceStart.setValue(payload.timeSinceStart, context);
        this.deltaTime.setValue(payload.deltaTime, context);
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
