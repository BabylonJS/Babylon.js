import type { Scene } from "../../scene";
import { Observable } from "../../Misc/observable";
import type { AbstractEngine } from "../abstractEngine";

/** @internal */
export function _InitCommonObservables(engine: AbstractEngine) {
    engine.onCanvasBlurObservable = new Observable<AbstractEngine>();
    engine.onCanvasFocusObservable = new Observable<AbstractEngine>();
    engine.onNewSceneAddedObservable = new Observable<Scene>();
    engine.onResizeObservable = new Observable<AbstractEngine>();
    engine.onCanvasPointerOutObservable = new Observable<PointerEvent>();
}

/** @internal */
export function _ClearCommonObservables(engine: AbstractEngine) {
    engine.onResizeObservable.clear();
    engine.onCanvasBlurObservable.clear();
    engine.onCanvasFocusObservable.clear();
    engine.onCanvasPointerOutObservable.clear();
    engine.onNewSceneAddedObservable.clear();
}
