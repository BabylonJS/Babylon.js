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
    public _preparePendingTasks(context: FlowGraphContext): void {
        if (!context._getExecutionVariable(this, "sceneBeforeRender")) {
            const scene = context.configuration.scene;
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
        const scene = context.configuration.scene;
        scene.onBeforeRenderObservable.remove(contextObserver);
        context._deleteExecutionVariable(this, "sceneBeforeRender");
    }

    public getClassName(): string {
        return FlowGraphSceneTickEventBlock.ClassName;
    }

    public static ClassName = "FGSceneTickEventBlock";
}
RegisterClass(FlowGraphSceneTickEventBlock.ClassName, FlowGraphSceneTickEventBlock);
