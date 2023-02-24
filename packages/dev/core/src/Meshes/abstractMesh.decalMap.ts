import type { Nullable } from "../types";
import { AbstractMesh } from "../Meshes/abstractMesh";
import type { DecalMapGenerator } from "./decalMapGenerator";

declare module "./abstractMesh" {
    export interface AbstractMesh {
        /** @internal */
        _decalMapGenerator: Nullable<DecalMapGenerator>;

        /**
         * Gets or sets the decal map generator for this mesh
         */
        decalMapGenerator: Nullable<DecalMapGenerator>;
    }
}

Object.defineProperty(AbstractMesh.prototype, "decalMapGenerator", {
    get: function (this: AbstractMesh) {
        return this._decalMapGenerator;
    },
    set: function (this: AbstractMesh, generator: Nullable<DecalMapGenerator>) {
        this._decalMapGenerator = generator;
    },
    enumerable: true,
    configurable: true,
});
