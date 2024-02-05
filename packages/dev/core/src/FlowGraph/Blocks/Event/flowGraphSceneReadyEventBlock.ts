import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * @experimental
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    /**
     * @internal
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        if (!context._getExecutionVariable(this, "sceneReadyObserver")) {
            const scene = context.configuration.scene;
            const contextObserver = scene.onReadyObservable.add(() => {
                this._execute(context);
            });
            context._setExecutionVariable(this, "sceneReadyObserver", contextObserver);
        }
    }

    /**
     * @internal
     */
    public _cancelPendingTasks(context: FlowGraphContext) {
        const contextObserver = context._getExecutionVariable(this, "sceneReadyObserver");
        const scene = context.configuration.scene;
        scene.onReadyObservable.remove(contextObserver);
        context._deleteExecutionVariable(this, "sceneReadyObserver");
    }

    /**
     * @returns class name of the block.
     */
    public getClassName() {
        return FlowGraphSceneReadyEventBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSceneReadyEventBlock";
}
RegisterClass("FGSceneReadyEventBlock", FlowGraphSceneReadyEventBlock);
