
declare module BABYLON {
    class GLTFExport {
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * If glb is set to true, exports as .glb.
         * @param meshes
         * @param materials
         * @param glb
         */
        static GLTF(meshes: Mesh[], filename: string, glb?: boolean): {
            [fileName: string]: string | Blob;
        };
    }
}
