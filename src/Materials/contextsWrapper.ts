import { IMaterialContext } from "../Engines/IMaterialContext";
import { Nullable } from "../types";

declare type ThinEngine = import("../Engines/thinEngine").ThinEngine;
declare type Effect = import("./Effect").Effect;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;

/** @hidden */
export class ContextsWrapper {
    public effect: Nullable<Effect>;
    public defines: Nullable<string | MaterialDefines>;
    public materialContext?: IMaterialContext;

    public static IsContextualEffect(effect: Effect | ContextsWrapper): effect is ContextsWrapper {
        return (effect as Effect).getPipelineContext === undefined;
    }

    public static GetEffect(effect: Effect | ContextsWrapper): Nullable<Effect> {
        return (effect as Effect).getPipelineContext === undefined ? (effect as ContextsWrapper).effect : effect as Effect;
    }

    /** Note: if engine is passed in, a materialContext is automatically created */
    constructor(engine?: ThinEngine) {
        this.effect = null;
        this.defines = null;
        if (engine) {
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
