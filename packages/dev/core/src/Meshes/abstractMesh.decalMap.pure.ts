/** This file must only contain pure code and pure imports */

import { type Nullable } from "../types";
import { type MeshUVSpaceRenderer } from "./meshUVSpaceRenderer.pure";
import { AbstractMesh } from "../Meshes/abstractMesh.pure";

let _Registered = false;
/**
 * Register side effects for abstractMeshDecalMap.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractMeshDecalMap(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Object.defineProperty(AbstractMesh.prototype, "decalMap", {
        get: function (this: AbstractMesh) {
            return this._decalMap;
        },
        set: function (this: AbstractMesh, decalMap: Nullable<MeshUVSpaceRenderer>) {
            this._decalMap = decalMap;
        },
        enumerable: true,
        configurable: true,
    });
}
