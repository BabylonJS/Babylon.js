/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/preview release/gui/babylon.gui.d.ts"/>
// an error in typescript prevents us from using types instead of path


declare function runTests(name: string, babylon: any, gui: any, inspector: any);

runTests("typescript-vanilla", BABYLON, BABYLON.GUI, (<any>window).INSPECTOR);