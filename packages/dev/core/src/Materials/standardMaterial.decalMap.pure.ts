/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";
import { DecalMapConfiguration } from "./material.decalMapConfiguration.pure";
import { StandardMaterial } from "./standardMaterial.pure";



declare module "./standardMaterial" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface StandardMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}

export {};


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
