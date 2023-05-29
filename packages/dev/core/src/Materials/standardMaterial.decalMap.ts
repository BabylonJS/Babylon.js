import type { Nullable } from "core/types";
import { DecalMapConfiguration } from "./material.decalMapConfiguration";
import { StandardMaterial } from "./standardMaterial";

declare module "./standardMaterial" {
    export interface StandardMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}

Object.defineProperty(StandardMaterial.prototype, "decalMap", {
    get: function (this: StandardMaterial) {
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
