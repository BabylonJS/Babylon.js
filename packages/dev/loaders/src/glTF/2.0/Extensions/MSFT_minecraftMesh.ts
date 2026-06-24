/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./MSFT_minecraftMesh.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./MSFT_minecraftMesh.types";
export * from "./MSFT_minecraftMesh.pure";

import { RegisterMSFT_minecraftMesh } from "./MSFT_minecraftMesh.pure";
RegisterMSFT_minecraftMesh();
