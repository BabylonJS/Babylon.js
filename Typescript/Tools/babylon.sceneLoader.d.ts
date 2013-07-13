/// <reference path="../babylon.d.ts" />
declare module BABYLON.SceneLoader {
    function ImportMesh(meshName: string, rootUrl: string, sceneFilename: string, scene: Scene, then: Function);
    function Load(rootUrl: string, sceneFilename: string, engine: Engine, then: Function, progressCallback: Function);
}