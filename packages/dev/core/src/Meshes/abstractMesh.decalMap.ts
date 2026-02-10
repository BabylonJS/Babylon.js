import type { Nullable } from "../types";
import { AbstractMesh } from "../Meshes/abstractMesh";
import type { MeshUVSpaceRenderer } from "./meshUVSpaceRenderer";

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
