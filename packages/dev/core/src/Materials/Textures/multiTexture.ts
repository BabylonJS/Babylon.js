export * from "./multiTexture.types";
export * from "./multiTexture.pure";

// Register the WebGL2 upload extension (side effect). Harmless on WebGPU where the patch targets a
// different prototype; WebGPU consumers must additionally import
// "core/Engines/WebGPU/Extensions/engine.texture2DArrayImageSource".
import "../../Engines/Extensions/engine.texture2DArrayImageSource";
