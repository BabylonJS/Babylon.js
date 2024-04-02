import type { IDrawContext } from "../Engines/IDrawContext";
import type { IMaterialContext } from "../Engines/IMaterialContext";
import type { Nullable } from "../types";

import type { ThinEngine } from "../Engines/thinEngine";
import type { Effect } from "./effect";
import type { MaterialDefines } from "./materialDefines";

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

    public static IsWrapper(effect: Effect | DrawWrapper): effect is DrawWrapper {
        return (effect as Effect).getPipelineContext === undefined;
    }

    public static GetEffect(effect: Effect | DrawWrapper): Nullable<Effect> {
        return (effect as Effect).getPipelineContext === undefined ? (effect as DrawWrapper).effect : (effect as Effect);
    }

    constructor(engine: ThinEngine, createMaterialContext = true) {
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

    public dispose(): void {
        this.drawContext?.dispose();
    }
}
