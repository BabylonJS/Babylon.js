import type { Nullable } from "core/types";
import { DecalMapConfiguration } from "../material.decalMapConfiguration";
import { PBRBaseMaterial } from "./pbrBaseMaterial";

declare module "./pbrBaseMaterial" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
            this._decalMap = new DecalMapConfiguration(this);
        }
        return this._decalMap;
    },
    enumerable: true,
    configurable: true,
});
