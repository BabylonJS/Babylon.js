import { WebGPUEngine } from "core/Engines/webgpuEngine";

export const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement; // Get the canvas element
export const engine = new WebGPUEngine(canvas);
