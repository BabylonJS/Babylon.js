import { Nullable } from "../types";

declare type ThinEngine = import("../Engines/thinEngine").ThinEngine;
declare type Effect = import("./Effect").Effect;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;

/** @hidden */
export class ContextualEffect {
    private _needsContext: boolean;

    private _effect: Nullable<Effect>;
    private _defines: Nullable<string | MaterialDefines>;
    private _context?: any;

    public static IsContextualEffect(effect: Effect | ContextualEffect): effect is ContextualEffect {
        return (effect as Effect).getPipelineContext === undefined;
    }

    constructor(engine: ThinEngine, createContext = false) {
        this._needsContext = engine._features.needsEffectContext;
        this._effect = null;
        this._defines = null;
        if (createContext) {
            this._context = {};
        }
    }

    public get effect(): Nullable<Effect> {
        return this._effect;
    }

    public get defines(): Nullable<string | MaterialDefines> {
        return this._defines;
    }

    public set defines(defines: Nullable<string | MaterialDefines>) {
        this._defines = defines;
    }

    public get context(): any {
        return this._context;
    }

    public setEffect(effect: Nullable<Effect>, defines: Nullable<string | MaterialDefines>, createNewContext = true): void {
        if (this._effect === effect) {
            if (!effect) {
                this._defines = null;
                if (this._needsContext) {
                    this._context = undefined;
                }
            }
            return;
        }
        this._effect = effect;
        this._defines = defines;
        if (createNewContext && this._needsContext) {
            this._context = {};
        }
    }
}
