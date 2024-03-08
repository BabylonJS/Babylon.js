import { Engine } from "core/Engines/engine"; // can also be @lts/core

export const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement; // Get the canvas element
export const engine = new Engine(canvas, true); // Generate the BABYLON 3D engine
