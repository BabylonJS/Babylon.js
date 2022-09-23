import type { IDrawContext } from "../Engines/IDrawContext";
import type { IMaterialContext } from "../Engines/IMaterialContext";
import type { Nullable } from "../types";

declare type ThinEngine = import("../Engines/thinEngine").ThinEngine;
declare type Effect = import("./effect").Effect;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;

/** @internal */
export class DrawWrapper {
    public effect: Nullable<Effect>;
    public defines: Nullable<string | MaterialDefines>;
    public materialContext?: IMaterialContext;
    public drawContext?: IDrawContext;

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
