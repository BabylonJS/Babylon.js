import type { Observable } from "../../../Misc/observable";
import type { Scene } from "../../../scene";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";

/**
 * @experimental
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    private _scene: Scene;

    constructor(graph: FlowGraph, scene: Scene) {
        super(graph);
        this._scene = scene;
    }

    _getEventObservable(): Observable<any> {
        return this._scene.onReadyObservable;
    }
}
