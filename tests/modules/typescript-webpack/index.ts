import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import * as LOADERS from "babylonjs-loaders";

import "babylonjs-serializers";
// an error in typescript prevents us from using types instead of path

declare function runTests(name: string, babylon: any, gui: any, gltf2: any);

runTests("typescript-webpack", BABYLON, GUI, LOADERS.GLTF2);