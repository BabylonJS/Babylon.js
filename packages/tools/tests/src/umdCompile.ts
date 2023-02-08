import * as BABYLON from "babylonjs";
import "babylonjs-gui";
import "babylonjs-inspector";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas);
const scene = new BABYLON.Scene(engine);

scene.debugLayer.show();
