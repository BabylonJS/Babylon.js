/** This file must only contain pure code and pure imports */

import { Nullable } from "../types";
import { MeshUVSpaceRenderer } from "./meshUVSpaceRenderer.pure";
import { AbstractMesh } from "../Meshes/abstractMesh.pure";

declare module "./abstractMesh" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /** @internal */
        _decalMap: Nullable<MeshUVSpaceRenderer>;

        /**
         * Gets or sets the decal map for this mesh
         */
        decalMap: Nullable<MeshUVSpaceRenderer>;
    }
}

export {};

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
