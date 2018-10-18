module BABYLON {
    /**
     * Class used to represent a specific level of detail of a mesh
     * @see http://doc.babylonjs.com/how_to/how_to_use_lod
     */
    export class MeshLODLevel {
        /**
         * Creates a new LOD level
         * @param distance defines the distance where this level should star being displayed
         * @param mesh defines the mesh to use to render this level
         */
        constructor(
            /** Defines the distance where this level should star being displayed */
            public distance: number,
            /** Defines the mesh to use to render this level */
            public mesh: Nullable<Mesh>) {
        }
    }
}