/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./EXT_mesh_gpu_instancing.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./EXT_mesh_gpu_instancing.types";
export * from "./EXT_mesh_gpu_instancing.pure";

import "core/Meshes/thinInstanceMesh";

import { RegisterEXT_mesh_gpu_instancing } from "./EXT_mesh_gpu_instancing.pure";
RegisterEXT_mesh_gpu_instancing();
