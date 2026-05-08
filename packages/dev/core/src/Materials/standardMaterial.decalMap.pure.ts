/** This file must only contain pure code and pure imports */

import { DecalMapConfiguration } from "./material.decalMapConfiguration.pure";
import { StandardMaterial } from "./standardMaterial.pure";

let _registered = false;
export function registerStandardMaterialDecalMap(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
