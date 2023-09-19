import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";

/**
 * @experimental
 * Block that triggers on scene tick (before each render).
 */
export class FlowGraphSceneTickEventBlock extends FlowGraphEventBlock {
    /**
     * @internal
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        if (!context._getExecutionVariable(this, "sceneBeforeRender")) {
            const scene = context.graphVariables.scene;
            const contextObserver = scene.onBeforeRenderObservable.add(() => {
                this._execute(context);
            });
            context._setExecutionVariable(this, "sceneBeforeRender", contextObserver);
        }
    }

    /**
     * @internal
     */
    public _cancelPendingTasks(context: FlowGraphContext) {
        const contextObserver = context._getExecutionVariable(this, "sceneBeforeRender");
        const scene = context.graphVariables.scene;
        scene.onBeforeRenderObservable.remove(contextObserver);
        context._deleteExecutionVariable(this, "sceneBeforeRender");
    }
}
