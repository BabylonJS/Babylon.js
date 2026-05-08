/** This file must only contain pure code and pure imports */

import { DecalMapConfiguration } from "../material.decalMapConfiguration.pure";
import { PBRBaseMaterial } from "./pbrBaseMaterial.pure";

let _registered = false;
export function registerPbrMaterialDecalMap(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
