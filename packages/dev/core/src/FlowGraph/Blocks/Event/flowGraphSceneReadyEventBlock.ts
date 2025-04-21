import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
/**
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    public override initPriority: number = -1;

    public override readonly type: FlowGraphEventType = FlowGraphEventType.SceneReady;

    public override _executeEvent(context: FlowGraphContext, _payload: any): boolean {
        this._execute(context);
        return true;
    }
    public override _preparePendingTasks(context: FlowGraphContext): void {
        // no-op
    }
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        // no-op
    }
    /**
     * @returns class name of the block.
     */
    public override getClassName() {
        return FlowGraphBlockNames.SceneReadyEvent;
    }
}
RegisterClass(FlowGraphBlockNames.SceneReadyEvent, FlowGraphSceneReadyEventBlock);
