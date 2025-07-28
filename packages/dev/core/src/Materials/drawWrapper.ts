import type { IDrawContext } from "../Engines/IDrawContext";
import type { IMaterialContext } from "../Engines/IMaterialContext";
import type { Nullable } from "../types";

import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Effect } from "./effect";
import type { MaterialDefines } from "./materialDefines";
import { TimingTools } from "core/Misc/timingTools";

/**
 * Wrapper for an effect and its associated material context and draw context.
 * This class is meant to encapsulate the effect and its related contexts, allowing for easier management of rendering states.
 */
export class DrawWrapper {
    /**
     * The effect associated with this wrapper.
     */
    public effect: Nullable<Effect>;
    /**
     * The defines associated with this wrapper.
     */
    public defines: Nullable<string | MaterialDefines>;
    /**
     * The material context associated with this wrapper.
     */
    public materialContext?: IMaterialContext;
    /**
     * The draw context associated with this wrapper.
     */
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

    /**
     * Retrieves the effect from a DrawWrapper or Effect instance.
     * @param effect The effect or DrawWrapper instance to retrieve the effect from.
     * @returns The effect associated with the given instance, or null if not found.
     */
    public static GetEffect(effect: Effect | DrawWrapper): Nullable<Effect> {
        return (effect as Effect).getPipelineContext === undefined ? (effect as DrawWrapper).effect : (effect as Effect);
    }

    /**
     * Creates a new DrawWrapper instance.
     * Note that drawContext is always created (but may end up being undefined if the engine doesn't need draw contexts), but materialContext is optional.
     * @param engine The engine to create the draw wrapper for.
     * @param createMaterialContext If true, creates a material context for this wrapper (default is true).
     */
    constructor(engine: AbstractEngine, createMaterialContext = true) {
        this.effect = null;
        this.defines = null;
        this.drawContext = engine.createDrawContext();
        if (createMaterialContext) {
            this.materialContext = engine.createMaterialContext();
        }
    }

    /**
     * Sets the effect and its associated defines for this wrapper.
     * @param effect The effect to associate with this wrapper.
     * @param defines The defines to associate with this wrapper.
     * @param resetContext If true, resets the draw context (default is true).
     */
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
     * Disposes the effect wrapper and its resources
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
