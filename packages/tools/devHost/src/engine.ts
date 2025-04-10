import { Engine } from "core/Engines/engine"; // can also be @lts/core

export const Canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement; // Get the canvas element
export const EngineInstance = new Engine(Canvas, true); // Generate the BABYLON 3D engine
