import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Nullable } from "../../../types";
import type { Observer } from "../../../Misc/observable";
import type { Scene } from "../../../scene";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
/**
 * @experimental
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    public override initPriority: number = -1;
    /**
     * @internal
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        if (!context._getExecutionVariable<Nullable<Observer<Scene>>>(this, "sceneReadyObserver", null)) {
            const scene = context.configuration.scene;
            if (scene.isReady(true)) {
                this._execute(context);
            } else {
                const contextObserver = scene.onReadyObservable.add(() => {
                    this._execute(context);
                });
                context._setExecutionVariable(this, "sceneReadyObserver", contextObserver);
            }
        }
    }

    /**
     * @internal
     */
    public _cancelPendingTasks(context: FlowGraphContext) {
        const contextObserver = context._getExecutionVariable<Nullable<Observer<Scene>>>(this, "sceneReadyObserver", null);
        const scene = context.configuration.scene;
        scene.onReadyObservable.remove(contextObserver);
        context._deleteExecutionVariable(this, "sceneReadyObserver");
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName() {
        return FlowGraphBlockNames.SceneReadyEvent;
    }
}
RegisterClass(FlowGraphBlockNames.SceneReadyEvent, FlowGraphSceneReadyEventBlock);
