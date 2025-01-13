import type { IDrawContext } from "../Engines/IDrawContext";
import type { IMaterialContext } from "../Engines/IMaterialContext";
import type { Nullable } from "../types";

import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Effect } from "./effect";
import type { MaterialDefines } from "./materialDefines";
import { TimingTools } from "core/Misc/timingTools";

/** @internal */
export class DrawWrapper {
    public effect: Nullable<Effect>;
    public defines: Nullable<string | MaterialDefines>;
    public materialContext?: IMaterialContext;
    public drawContext?: IDrawContext;

    /**
     * @internal
     * Specifies if the effect was previously ready
     */
    public _wasPreviouslyReady = false;

    /**
     * @internal
     * Forces the code from bindForSubMesh to be fully run the next time it is called
     */
    public _forceRebindOnNextCall = true;

    /**
     * @internal
     * Specifies if the effect was previously using instances
     */
    public _wasPreviouslyUsingInstances: Nullable<boolean> = null;

    public static GetEffect(effect: Effect | DrawWrapper): Nullable<Effect> {
        return (effect as Effect).getPipelineContext === undefined ? (effect as DrawWrapper).effect : (effect as Effect);
    }

    constructor(engine: AbstractEngine, createMaterialContext = true) {
        this.effect = null;
        this.defines = null;
        this.drawContext = engine.createDrawContext();
        if (createMaterialContext) {
            this.materialContext = engine.createMaterialContext();
        }
    }

    public setEffect(effect: Nullable<Effect>, defines?: Nullable<string | MaterialDefines>, resetContext = true): void {
        this.effect = effect;
        if (defines !== undefined) {
            this.defines = defines;
        }
        if (resetContext) {
            this.drawContext?.reset();
        }
    }

    /**
     * Dispose the effect wrapper and its resources
     * @param immediate if the effect should be disposed immediately or on the next frame.
     * If dispose() is not called during a scene or engine dispose, we want to delay the dispose of the underlying effect. Mostly to give a chance to user code to reuse the effect in some way.
     */
    public dispose(immediate = false): void {
        if (this.effect) {
            const effect = this.effect;
            if (immediate) {
                effect.dispose();
            } else {
                TimingTools.SetImmediate(() => {
                    effect.getEngine().onEndFrameObservable.addOnce(() => {
                        effect.dispose();
                    });
                });
            }
            this.effect = null;
        }
        this.drawContext?.dispose();
    }
}
