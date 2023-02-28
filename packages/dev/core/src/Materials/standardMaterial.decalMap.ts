import { DecalMapConfiguration } from "./material.decalMapConfiguration";
import { StandardMaterial } from "./standardMaterial";

declare module "./standardMaterial" {
    export interface StandardMaterial {
        /** @internal */
        _decalMap: DecalMapConfiguration;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: DecalMapConfiguration;
    }
}

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
