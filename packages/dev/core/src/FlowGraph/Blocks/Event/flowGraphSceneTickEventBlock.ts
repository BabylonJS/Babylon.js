import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * @experimental
 * Block that triggers on scene tick (before each render).
 */
export class FlowGraphSceneTickEventBlock extends FlowGraphEventBlock {
    /**
     * @internal
     */
    public override _preparePendingTasks(_context: FlowGraphContext): void {
        // no-op
    }

    /**
     * @internal
     */
    public override _executeOnFrame(context: FlowGraphContext): void {
        this._execute(context);
    }

    /**
     * @internal
     */
    public _cancelPendingTasks(context: FlowGraphContext) {
        // no-op
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphSceneTickEventBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSceneTickEventBlock";
}
RegisterClass(FlowGraphSceneTickEventBlock.ClassName, FlowGraphSceneTickEventBlock);
