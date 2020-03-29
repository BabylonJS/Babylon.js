import { Nullable } from "../types";
import { Effect } from "../Materials/effect";
import { SubMesh } from './subMesh';

declare type MaterialDefines = import("../Materials/materialDefines").MaterialDefines;

declare module "../Meshes/subMesh" {
    export interface SubMesh {
        /** Switch the current effect to be the regular effect for this sub mesh */
        switchToRegularEffect: () => void;

        /** Switch the current effect to be the shadow depth effect for this sub mesh */
        switchToShadowDepthEffect: () => void;

        /** @hidden */
        _materialDefinesShadowDepth: Nullable<MaterialDefines>;
        /** @hidden */
        _materialEffectShadowDepth: Nullable<Effect>;

        /** @hidden */
        _regularDefines: Nullable<MaterialDefines>;
        /** @hidden */
        _regularEffect: Nullable<Effect>;

        /** @hidden */
        _currentEffect: number; /* 0=regular, 1=shadow depth */

    }
}

SubMesh.prototype._currentEffect = 0;

SubMesh.prototype.switchToRegularEffect = function() {
    if (this._currentEffect !== 0)  {
        this._currentEffect = 0;
        this._materialDefinesShadowDepth = this._materialDefines;
        this._materialEffectShadowDepth = this._materialEffect;
        this._materialDefines = this._regularDefines;
        this._materialEffect = this._regularEffect;
    }
};

SubMesh.prototype.switchToShadowDepthEffect = function() {
    if (this._currentEffect !== 1)  {
        this._currentEffect = 1;
        this._regularDefines = this._materialDefines;
        this._regularEffect = this._materialEffect;
        this._materialDefines = this._materialDefinesShadowDepth;
        this._materialEffect = this._materialEffectShadowDepth;
    }
};
