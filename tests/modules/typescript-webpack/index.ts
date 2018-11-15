import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

import "babylonjs-loaders";
import "babylonjs-serializers";
// an error in typescript prevents us from using types instead of path


declare function runTests(name: string, babylon: any, gui: any);

runTests("typescript-vanilla", BABYLON, GUI);