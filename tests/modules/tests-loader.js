/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/preview release/gui/babylon.gui.d.ts"/>
// an error in typescript prevents us from using types instead of path
runTests("typescript-vanilla", BABYLON, BABYLON.GUI, window.INSPECTOR);
