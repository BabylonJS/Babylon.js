/// <reference path="../../../../dist/preview release/babylon.module.d.ts"/>
/// <reference path="../../../../dist/preview release/gui/babylon.gui.d.ts"/>
/// <reference path="../../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
/// <reference path="../../../../dist/preview release/loaders/babylonjs.loaders.d.ts"/>

// an error in typescript prevents us from using types instead of path

declare function runTests(name: string, babylon: any, gui: any, gltf2: any);

runTests("typescript-vanilla", BABYLON, BABYLON.GUI, BABYLON.GLTF2);