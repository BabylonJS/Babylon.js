import type { Scene } from "../../../scene";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";

/**
 * @experimental
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    private _scene: Scene;

    public constructor(graph: FlowGraph) {
        super(graph);
        this._scene = this._graph.scene;
    }

    /**
     * @internal
     */
    public _startListening(context: FlowGraphContext): void {
        let contextObserver = context._getExecutionVariable(this, "sceneReadyObserver");
        if (!contextObserver) {
            contextObserver = this._scene.onReadyObservable.add(() => {
                this._execute(context);
            });
            context._setExecutionVariable(this, "sceneReadyObserver", contextObserver);
        }
    }

    /**
     * @internal
     */
    public _stopListening(context: FlowGraphContext) {
        const contextObserver = context._getExecutionVariable(this, "sceneReadyObserver");
        this._scene.onReadyObservable.remove(contextObserver);
        context._deleteExecutionVariable(this, "sceneReadyObserver");
    }
}
