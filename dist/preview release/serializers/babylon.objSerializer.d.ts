/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class OBJExport {
        static OBJ(mesh: Mesh, materials?: boolean, matlibname?: string): string;
        static MTL(mesh: Mesh): string;
    }
}
