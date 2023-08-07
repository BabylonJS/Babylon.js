import type { Nullable } from "../../../types";
import type { Observer } from "../../../Misc/observable";
import type { Scene } from "../../../scene";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";

/**
 * @experimental
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    private _scene: Scene;
    private _sceneReadyObserver: Nullable<Observer<Scene>>;

    public constructor(graph: FlowGraph, scene: Scene) {
        super(graph);
        this._scene = scene;
    }

    /**
     * @internal
     */
    public _startListening(): void {
        if (!this._sceneReadyObserver) {
            this._sceneReadyObserver = this._scene.onReadyObservable.add(() => {
                this._execute();
            });
        }
    }

    /**
     * @internal
     */
    public _stopListening() {
        this._scene.onReadyObservable.remove(this._sceneReadyObserver);
        this._sceneReadyObserver = null;
    }
}
