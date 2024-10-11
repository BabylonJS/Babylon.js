import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
/**
 * @experimental
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
    public override _executeOnFrame(context: FlowGraphContext): void {
        this._execute(context);
    }

    /**
     * @internal
     */
    public _cancelPendingTasks(_context: FlowGraphContext) {
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
