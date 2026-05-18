/** This file must only contain pure code and pure imports */

import { DecalMapConfiguration } from "./material.decalMapConfiguration.pure";
import { StandardMaterial } from "./standardMaterial.pure";

let _Registered = false;
/**
 * Register side effects for standardMaterialDecalMap.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterStandardMaterialDecalMap(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Object.defineProperty(StandardMaterial.prototype, "decalMap", {
        get: function (this: StandardMaterial) {
            if (!this._decalMap) {
                this._decalMap = new DecalMapConfiguration(this);
            }
            return this._decalMap;
        },
        enumerable: true,
        configurable: true,
    });
}
