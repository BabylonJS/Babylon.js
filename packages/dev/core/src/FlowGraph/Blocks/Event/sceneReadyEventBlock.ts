import type { Observable } from "../../../Misc/observable";
import type { Scene } from "../../../scene";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";

export class SceneReadyEventBlock extends FlowGraphEventBlock {
    private _scene: Scene;

    constructor(graph: FlowGraph, scene: Scene) {
        super(graph);
        this._scene = scene;
    }

    createEventObservable(): Observable<any> {
        return this._scene.onReadyObservable;
    }
}
