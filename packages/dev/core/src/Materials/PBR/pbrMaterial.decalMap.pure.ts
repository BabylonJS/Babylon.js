/** This file must only contain pure code and pure imports */

import { DecalMapConfiguration } from "../material.decalMapConfiguration.pure";
import { PBRBaseMaterial } from "./pbrBaseMaterial.pure";

let _Registered = false;
/**
 * Register side effects for pbrMaterialDecalMap.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterPbrMaterialDecalMap(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Object.defineProperty(PBRBaseMaterial.prototype, "decalMap", {
        get: function (this: PBRBaseMaterial) {
            if (!this._decalMap) {
                this._decalMap = new DecalMapConfiguration(this);
            }
            return this._decalMap;
        },
        enumerable: true,
        configurable: true,
    });
}
