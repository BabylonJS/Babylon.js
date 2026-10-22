import { type IDrawContext } from "../Engines/IDrawContext";
import { type IMaterialContext } from "../Engines/IMaterialContext";
import { type Nullable } from "../types";

import { type AbstractEngine } from "../Engines/abstractEngine";
import { type Effect } from "./effect";
import { type MaterialDefines } from "./materialDefines";
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

    /** @internal What the draw last recorded by a snapshot was rendered with: the draw is encoded again while they did not change */
    public _recordedMaterial: Nullable<object> = null;
    /** @internal */
    public _recordedMaterialVersion = -1;
    /** @internal */
    public _recordedTexturesVersion = -1;
    /** @internal */
    public _recordedWorldFlag = -1;
    /** @internal */
    public _recordedVisibility = -1;
    /** @internal */
    public _recordedStart = -1;
    /** @internal */
    public _recordedCount = -1;
    /** @internal */
    public _recordedIndexBuffer: Nullable<object> = null;
    /** @internal The vertex buffers of the geometry and of the thin instances */
    public _recordedVertexBuffers: Nullable<Array<Nullable<object>>> = null;
    /** @internal */
    public _recordedInstances = -1;
    /** @internal The shadow map and the buffer the generator binds to receivers, for each light the draw was recorded with: they are in its bind groups */
    public _recordedLights: Nullable<Array<Nullable<object>>> = null;

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
        if (!resetContext && this.effect !== effect) {
            this.drawContext?._releaseUniformBufferSlots?.();
        }
        this.effect = effect;
        if (defines !== undefined) {
            this.defines = defines;
        }
        if (resetContext) {
            this.drawContext?.reset();
        }
    }

    /**
     * @internal
     * Replaces the draw context with a new one created by the engine, keeping its instancing setting.
     * After a context restoration, the old draw context can still hold resources of the lost device (in WebGPU,
     * the indirect draw buffer used for instanced draws, and the buffer manager that created it).
     * @param engine The engine to create the new draw context with.
     */
    public _recreateDrawContext(engine: AbstractEngine): void {
        const oldContext = this.drawContext;
        if (!oldContext) {
            return;
        }
        const useInstancing = oldContext.useInstancing;
        oldContext.dispose();
        this.drawContext = engine.createDrawContext();
        if (this.drawContext && useInstancing) {
            this.drawContext.useInstancing = true;
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
