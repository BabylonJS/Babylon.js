import { DecalMapConfiguration } from "../material.decalMapConfiguration";
import { PBRBaseMaterial } from "./pbrBaseMaterial";

declare module "./PBRBaseMaterial" {
    export interface PBRBaseMaterial {
        /** @internal */
        _decalMap: DecalMapConfiguration;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: DecalMapConfiguration;
    }
}

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
