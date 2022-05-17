import("@babylonjs/core/Debug/debugLayer");
import("@babylonjs/inspector");
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas);
const scene = new Scene(engine);

scene.debugLayer.show();
