/** This file must only contain pure code and pure imports */

import { Nullable } from "../types";
import { MeshUVSpaceRenderer } from "./meshUVSpaceRenderer.pure";
import { AbstractMesh } from "../Meshes/abstractMesh.pure";

let _registered = false;
export function registerAbstractMeshDecalMap(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
