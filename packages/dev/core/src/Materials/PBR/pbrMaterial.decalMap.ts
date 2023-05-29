import type { Nullable } from "core/types";
import { DecalMapConfiguration } from "../material.decalMapConfiguration";
import { PBRBaseMaterial } from "./pbrBaseMaterial";

declare module "./pbrBaseMaterial" {
    export interface PBRBaseMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}

Object.defineProperty(PBRBaseMaterial.prototype, "decalMap", {
    get: function (this: PBRBaseMaterial) {
        if (!this._decalMap) {
            if (this._uniformBufferLayoutBuilt) {
                // Material already used to display a mesh, so it's invalid to add the decal map plugin at that point
                // Returns null instead of having new DecalMapConfiguration throws an exception
                return null;
            }

            this._decalMap = new DecalMapConfiguration(this);
        }
        return this._decalMap;
    },
    enumerable: true,
    configurable: true,
});
