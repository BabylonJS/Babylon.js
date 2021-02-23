import { IDrawContext } from "../Engines/IDrawContext";
import { IMaterialContext } from "../Engines/IMaterialContext";
import { Nullable } from "../types";

declare type ThinEngine = import("../Engines/thinEngine").ThinEngine;
declare type Effect = import("./effect").Effect;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;

/** @hidden */
export class DrawWrapper {
    public effect: Nullable<Effect>;
    public defines: Nullable<string | MaterialDefines>;
    public materialContext?: IMaterialContext;
    public drawContext?: IDrawContext;

    public static IsWrapper(effect: Effect | DrawWrapper): effect is DrawWrapper {
        return (effect as Effect).getPipelineContext === undefined;
    }

    public static GetEffect(effect: Effect | DrawWrapper): Nullable<Effect> {
        return (effect as Effect).getPipelineContext === undefined ? (effect as DrawWrapper).effect : effect as Effect;
    }

    constructor(engine: ThinEngine, createMaterialContext = true) {
        this.effect = null;
        this.defines = null;
        this.drawContext = engine.createDrawContext();
        if (createMaterialContext) {
            this.materialContext = engine.createMaterialContext();
        }
    }

    public setEffect(effect: Nullable<Effect>, defines?: Nullable<string | MaterialDefines>): void {
        this.effect = effect;
        if (defines !== undefined) {
            this.defines = defines;
        }
    }
}
