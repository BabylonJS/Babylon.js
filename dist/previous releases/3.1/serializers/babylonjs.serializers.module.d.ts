/// <reference types="babylonjs"/>

declare module 'babylonjs-serializers' { 
    export = BABYLON; 
}

declare module BABYLON {
    class OBJExport {
        static OBJ(mesh: Mesh[], materials?: boolean, matlibname?: string, globalposition?: boolean): string;
        static MTL(mesh: Mesh): string;
    }
}
