/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import anisotropyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anisotropyBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { AnisotropyBlock } from "./anisotropyBlock.pure";

RegisterClass("BABYLON.AnisotropyBlock", AnisotropyBlock);
