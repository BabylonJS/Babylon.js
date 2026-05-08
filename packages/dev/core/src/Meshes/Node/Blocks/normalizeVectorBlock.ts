/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import normalizeVectorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalizeVectorBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NormalizeVectorBlock } from "./normalizeVectorBlock.pure";

RegisterClass("BABYLON.NormalizeVectorBlock", NormalizeVectorBlock);
